import { Fetch, FetcherStatus, Params, Store, Unsubscribable } from "./shape";
import { deepCopy, deepFreeze } from "./utils";

export const createFetcher = <S, C, P = void>(storeResult: (selector?: (s: S) => C) => Store<S, C, any>, supportsTags: boolean, selector: (s: S) => C) => (specs: {
  getData: ((params: Params<P>) => Promise<C>) | (() => Promise<C>),
  setData?: (args: { store: Store<S, C, boolean>, data: C, params: Params<P>, tag?: string }) => any,
  cacheFor?: number,
}) => {
  const responseCache = new Map<any, {
    data: C,
    error: any,
    lastFetch: number,
    status: FetcherStatus,
    changeListeners: Array<(fetch: Fetch<S, C, P>) => Unsubscribable>,
    changeOnceListeners: Array<{ listener: (fetch: Fetch<S, C, P>) => Unsubscribable, unsubscribe: () => any }>,
    cacheExpiredListeners: Array<(fetch: Fetch<S, C, P>) => Unsubscribable>,
    cacheExpiredOnceListeners: Array<{ listener: (fetch: Fetch<S, C, P>) => Unsubscribable, unsubscribe: () => any }>,
    fetches: Array<Fetch<S, C, P>>,
  }>();
  const result = (paramsOrTag: P | string | void, tag: string | void): Fetch<S, C, P> => {
    const actualTag = supportsTags ? (tag || paramsOrTag) as string : undefined;
    const actualParams = (((supportsTags && tag) || (!supportsTags && paramsOrTag)) ? paramsOrTag : undefined) as Params<P>;
    const cacheItem = responseCache.get(actualParams) || responseCache.set(actualParams,
      { data: undefined as any as C, error: undefined, lastFetch: 0, status: 'pristine', fetches: [], changeListeners: [], changeOnceListeners: [], cacheExpiredListeners: [], cacheExpiredOnceListeners: [] }).get(actualParams)!;
    const cacheHasExpiredOrPromiseNotYetCalled = (cacheItem.lastFetch + (specs.cacheFor || 0)) < Date.now();
    const invalidateCache = () => {
      cacheItem.data = null as any as C;
      cacheItem.lastFetch = 0;
    }
    const createFetch = () => ({
      data: cacheItem.data,
      fetchArg: actualParams,
      store: storeResult(selector),
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
    }) as Fetch<S, C, P>;
    const notifyChangeListeners = (notifyChangeOnceListeners: boolean) => {
      cacheItem.changeListeners.forEach(changeListener => changeListener(createFetch()));
      if (notifyChangeOnceListeners) {
        cacheItem.changeOnceListeners.forEach(changeOnceListener => {
          changeOnceListener.listener(createFetch());
          changeOnceListener.unsubscribe();
        });
      }
    }
    if (cacheHasExpiredOrPromiseNotYetCalled) {
      cacheItem.status = 'resolving';
      cacheItem.fetches.forEach(fetch => Object.assign<Fetch<S, C, P>, Partial<Fetch<S, C, P>>>(fetch, { status: cacheItem.status }));
      notifyChangeListeners(false);
      let errorThatWasCaughtInPromise: any = null;
      specs.getData(actualParams)
        .then(value => {
          try {
            const valueFrozen = deepFreeze(deepCopy(value));
            cacheItem.lastFetch = Date.now();
            if (specs.setData) {
              specs.setData({
                data: valueFrozen,
                tag: actualTag,
                params: actualParams,
                store: storeResult(selector),
              });
            } else {
              const piece = storeResult(selector) as any as { replace: (c: C, tag: string | void) => void } & { replaceAll: (c: C, tag: string | void) => void };
              if (piece.replaceAll) { piece.replaceAll(valueFrozen, actualTag); } else { piece.replace(valueFrozen, actualTag); }
            }
            cacheItem.data = valueFrozen;
            cacheItem.error = null;
            cacheItem.status = 'resolved';
            cacheItem.fetches.forEach(fetch => Object.assign<Fetch<S, C, P>, Partial<Fetch<S, C, P>>>(fetch, { status: cacheItem.status, data: valueFrozen, error: cacheItem.error }));
            notifyChangeListeners(true);
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
            cacheItem.fetches.forEach(fetch => Object.assign<Fetch<S, C, P>, Partial<Fetch<S, C, P>>>(fetch, { status: cacheItem.status, error }));
            notifyChangeListeners(true);
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
  return result;
}