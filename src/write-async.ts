import { augmentations, errorMessages, libState } from './constant';
import { readState } from './read';
import { Actual, AnyAsync, EnableAsyncActionsArgs, FutureState, StateAction, UpdateOptions } from './type';
import { mustBe } from './type-check';
import { setNewStateAndNotifyListeners } from './write-complete';

export const importOlikAsyncModule = () => {
  libState.asyncUpdate = (
    { stateActions, prop, cache, eager, arg }: EnableAsyncActionsArgs
  ) => {
    if (libState.isInsideTransaction) { throw new Error(errorMessages.ASYNC_PAYLOAD_INSIDE_TRANSACTION); }
    const readCurrentState = () =>
      readState({ state: libState.store!.$state, stateActions: [...stateActions, { type: 'action', name: 'state' }], cursor: { index: 0 } });
    let state: FutureState<unknown> = { storeValue: readCurrentState(), error: null, isLoading: false, wasRejected: false, wasResolved: false };
    if (libState.store!.$state.cache?.[stateActions.map(sa => sa.actionType).join('.')]) {
      const result = new Proxy(new Promise(resolve => resolve(readCurrentState())), {
        get: (target, prop: string) => {
          if (prop === 'then' || prop === 'catch' || prop === 'finally') {
            const t = Promise.resolve(readCurrentState());
            return t[prop].bind(t);
          } else if (prop === 'state') {
            return state;
          } else {
            return (...args: Array<Actual>) => mustBe.recordOf.function(target)[prop]!(args);
          }
        }
      });
      const resultCast = mustBe.recordOf.function(result);
      const futureCast = mustBe.recordOf.function<unknown, (a: unknown) => undefined>(augmentations.future);
      Object.keys(augmentations.future).forEach(name => resultCast[name] = futureCast[name](result));
      return result;
    }
    const promiseResult = () => {
      let snapshot: unknown = undefined;
      if (eager) {
        snapshot = readCurrentState();
        setNewStateAndNotifyListeners({ stateActions: [...stateActions, { type: 'action', name: prop, arg: eager, actionType: `${prop}()` }] });
      }
      state = { ...state, isLoading: true, storeValue: readCurrentState() };
      const argCast = mustBe.function<void, Promise<unknown>>(arg);
      const promise = (augmentations.async ? augmentations.async(argCast) : argCast());
      return promise
        .then(promiseResult => {
          setNewStateAndNotifyListeners({ stateActions: [...stateActions, { type: 'action', name: prop, arg: promiseResult, actionType: `${prop}()` }] });
          state = { ...state, wasResolved: true, wasRejected: false, isLoading: false, storeValue: readCurrentState() };
          if (cache) {
            const statePath = stateActions.map(sa => sa.actionType).join('.');
            const actions = [
              { type: 'property', name: 'cache', actionType: 'cache' },
              { type: 'property', name: statePath, actionType: statePath },
            ] satisfies StateAction[];
            setNewStateAndNotifyListeners({ stateActions: [...actions, { type: 'action', name: 'set', arg: toIsoStringInCurrentTz(new Date()), actionType: 'set()' }] });
            setTimeout(() => {
              try {
                setNewStateAndNotifyListeners({ stateActions: [...actions, { type: 'action', name: 'delete', actionType: 'delete()' }] })
              } catch (e) {
                // Ignoring. This may happen due to the user manually invalidating a cache. If that has happened, we don't want an error to be thrown.
              }
            }, cache);
          }
          return readCurrentState();
        }).catch(error => {
          if (snapshot !== undefined) {
            setNewStateAndNotifyListeners({ stateActions: [...stateActions, { type: 'action', name: prop, arg: snapshot, actionType: `${prop}()` }] });
          }
          state = { ...state, wasRejected: true, wasResolved: false, isLoading: false, error };
          throw error;
        });
    }
    let promiseWasChained = false;
    const result = new Proxy(new Promise(resolve => {
      setTimeout(() => { if (!promiseWasChained) { promiseResult().then((r) => resolve(r)); } });
    }), {
      get: (target, prop: string) => {
        if (prop === 'state') {
          return state;
        } else if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          promiseWasChained = true;
          const t = promiseResult();
          return t[prop].bind(t);
        } else { // must be an augmentation
          promiseWasChained = true;
          return mustBe.record(target)[prop];
        }
      }
    }) as { state: FutureState<unknown> } & Promise<unknown>;
    const resultCast = mustBe.recordOf.function<Actual[], unknown>(result);
    Object.keys(augmentations.future).forEach(name => resultCast[name] = augmentations.future[name](result));
    return result;
  }
}

export const toIsoStringInCurrentTz = (date: Date) => {
  const tzo = -date.getTimezoneOffset();
  const dif = tzo >= 0 ? '+' : '-';
  const pad = (num: number) => {
    const norm = Math.floor(Math.abs(num));
    return (norm < 10 ? '0' : '') + norm;
  };
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + 'T' + pad(date.getHours())
    + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds()) + dif + pad(tzo / 60) + ':' + pad(tzo % 60);
}

export const defineQuery = <T>(
  arg: { query: () => AnyAsync<T>, cache?: number, eager?: T }
): [() => AnyAsync<T>, UpdateOptions<() => AnyAsync<T>>] => {
  return [arg.query, { cache: arg.cache, eager: arg.eager } satisfies UpdateOptions<() => AnyAsync<T>>];
};
