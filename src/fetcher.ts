import {
  FetchArgument,
  FetcherStatus,
  FetchFunction,
  FetchState,
  OptionsForCreatingAFetcher,
  Unsubscribable,
} from './shape';
import { deepCopy, deepFreeze } from './utils';

/**
 * This is a factory function which, when invoked, returns another function which can be used to fetch data asynchronously.
 * For example:
 * ```
 * const fetchTodos = createFetcher({
 *   onStore: select(s => s.todos),
 *   getData: () => fetchTodosFromApiReturningPromise(),
 *   setData: arg => arg.store.addAfter(arg.data),
 *   cacheFor: 1000 * 60 // cache for 60 seconds
 * });
 * const todosFetchState = fetchTodos();
 * todosFetchState.onChangeOnce(state => {
 *   console.log(`Status is currently: ${state.status}`);
 *   if (state.status === 'resolved') {
 *     console.log(`Resolved data is: ${state.data}`);
 *   } else if (state.status === 'rejected') {
 *     console.log(`Rejection is: ${state.error}`);
 *   }
 * });
 * ```
 */
export const createFetcher = <S, C, B extends boolean, X extends (params: any) => Promise<C>, P extends Parameters<X>[0]>(
  specs: OptionsForCreatingAFetcher<C, B, X>,
): FetchFunction<S, C, Parameters<X>[0], B> => {
  const responseCache = new Map<any, {
    data: C,
    error: any,
    lastFetch: number,
    status: FetcherStatus,
    changeListeners: Array<(fetch: FetchState<S, C, P, B>) => Unsubscribable>,
    changeOnceListeners: Array<{ listener: (fetch: FetchState<S, C, P, B>) => Unsubscribable, unsubscribe: () => any }>,
    cacheExpiredListeners: Array<(fetch: FetchState<S, C, P, B>) => Unsubscribable>,
    cacheExpiredOnceListeners: Array<{ listener: (fetch: FetchState<S, C, P, B>) => Unsubscribable, unsubscribe: () => any }>,
    promises: Array<{ resolve: (c: C) => void, reject: (e: any) => void }>,
    fetches: Array<FetchState<S, C, P, B>>,
  }>();
  const result = (paramsOrTag: P | string | void, tag: string | void): FetchState<S, C, P, B> => {
    const supportsTags = (specs.onStore as any).supportsTags;
    const actualTag = supportsTags ? (tag || paramsOrTag) as string : undefined;
    const actualParams = (((supportsTags && tag) || (!supportsTags && paramsOrTag)) ? paramsOrTag : undefined) as FetchArgument<P>;
    const cacheItem = responseCache.get(actualParams) || responseCache.set(actualParams,
      { data: undefined as any as C, error: undefined, lastFetch: 0, status: 'pristine', fetches: [], changeListeners: [], changeOnceListeners: [], cacheExpiredListeners: [], cacheExpiredOnceListeners: [], promises: [] }).get(actualParams)!;
    const cacheHasExpiredOrPromiseNotYetCalled = (cacheItem.lastFetch + (specs.cacheFor || 0)) < Date.now();
    const invalidateCache = () => {
      cacheItem.data = null as any as C;
      cacheItem.lastFetch = 0;
    }
    const createFetch = () => ({
      data: cacheItem.data,
      fetchArg: actualParams,
      store: specs.onStore,
      error: cacheItem.error,
      status: cacheItem.status,
      invalidateCache,
      refetch: (paramsOrTag: P | string | void, tag: string | void) => {
        invalidateCache();
        return result(paramsOrTag, tag);
      },
      onChange: (listener: () => Unsubscribable) => {
        cacheItem.changeListeners.push(listener);
        return { unsubscribe: () => cacheItem.changeListeners.splice(cacheItem.changeListeners.findIndex(changeListener => changeListener === listener), 1) };
      },
      onChangeOnce: (listener: () => Unsubscribable) => {
        const unsubscribe = () => cacheItem.changeOnceListeners.splice(cacheItem.changeOnceListeners.findIndex(changeOnceListener => changeOnceListener.listener === listener), 1);
        cacheItem.changeOnceListeners.push({ listener, unsubscribe });
        return { unsubscribe };
      },
      onCacheExpired: (listener: () => Unsubscribable) => {
        cacheItem.cacheExpiredListeners.push(listener);
        return { unsubscribe: () => cacheItem.cacheExpiredListeners.splice(cacheItem.cacheExpiredListeners.findIndex(expiredListener => expiredListener === listener), 1) };
      },
      onCacheExpiredOnce: (listener: () => Unsubscribable) => {
        const unsubscribe = () => cacheItem.cacheExpiredOnceListeners.splice(cacheItem.cacheExpiredOnceListeners.findIndex(expiredOnceListener => expiredOnceListener.listener === listener), 1);
        cacheItem.cacheExpiredOnceListeners.push({ listener, unsubscribe });
        return { unsubscribe };
      },
      toPromise: () => {
        // cacheItem.promises.push()
        return new Promise<C>((resolve, reject) => cacheItem.promises.push({ resolve, reject }));
      },
    }) as FetchState<S, C, P, B>;
    const notifyChangeListeners = (notifyChangeOnceListeners: boolean) => {
      cacheItem.changeListeners.forEach(changeListener => changeListener(createFetch()));
      if (notifyChangeOnceListeners) {
        cacheItem.changeOnceListeners.forEach(changeOnceListener => {
          changeOnceListener.listener(createFetch());
          changeOnceListener.unsubscribe();
        });
      }
    }
    if (cacheItem.status === 'resolving') {
      return cacheItem.fetches[cacheItem.fetches.length - 1];
    } else
    if (cacheHasExpiredOrPromiseNotYetCalled) {
      cacheItem.status = 'resolving';
      cacheItem.fetches.forEach(fetch => Object.assign<FetchState<S, C, P, B>, Partial<FetchState<S, C, P, B>>>(fetch, { status: cacheItem.status }));
      notifyChangeListeners(false);
      let errorThatWasCaughtInPromise: any = null;
      specs.getData(actualParams)
        .then(value => {
          try {
            cacheItem.lastFetch = Date.now();
            if (specs.setData) {
              specs.setData({
                data: value,
                tag: actualTag,
                param: actualParams,
                store: specs.onStore,
              });
            } else {
              const piece = specs.onStore as any as { replace: (c: C, tag: string | void) => void } & { replaceAll: (c: C, tag: string | void) => void };
              if (piece.replaceAll) { piece.replaceAll(value, actualTag); } else { piece.replace(value, actualTag); }
            }
            cacheItem.data = deepFreeze(deepCopy(value));
            cacheItem.error = null;
            cacheItem.status = 'resolved';
            cacheItem.fetches.forEach(fetch => Object.assign<FetchState<S, C, P, B>, Partial<FetchState<S, C, P, B>>>(fetch, { status: cacheItem.status, data: value, error: cacheItem.error }));
            notifyChangeListeners(true);

            cacheItem.promises.forEach(promise => promise.resolve(cacheItem.data));
            cacheItem.promises.length = 0;

            setTimeout(() => {
              invalidateCache();  // free memory
              cacheItem.cacheExpiredListeners.forEach(listener => listener(createFetch()));
              cacheItem.cacheExpiredOnceListeners.forEach(cacheOnceListener => {
                cacheOnceListener.listener(createFetch());
                cacheOnceListener.unsubscribe();
              });
            }, specs.cacheFor);
          } catch (e) {
            errorThatWasCaughtInPromise = e;
          }
        }).catch(error => {
          try {
            cacheItem.error = error;
            cacheItem.status = 'rejected';
            cacheItem.fetches.forEach(fetch => Object.assign<FetchState<S, C, P, B>, Partial<FetchState<S, C, P, B>>>(fetch, { status: cacheItem.status, error }));
            notifyChangeListeners(true);

            cacheItem.promises.forEach(promise => promise.reject(error));
            cacheItem.promises.length = 0;
          } catch (e) {
            errorThatWasCaughtInPromise = e;
          }
        }).finally(() => {
          if (errorThatWasCaughtInPromise) {
            throw errorThatWasCaughtInPromise;
          }
        });
    }
    const fetch = createFetch();
    cacheItem.fetches.push(fetch);
    return fetch;
  }
  return result as any;
}