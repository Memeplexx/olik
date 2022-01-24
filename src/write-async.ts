import { augmentations, errorMessages, libState } from './constant';
import { readState } from './read';
import { EnableAsyncActionsArgs, FutureState, StateAction } from './type';
import { setNewStateAndNotifyListeners } from './write-complete';

export const importOlikAsyncModule = () => {
  libState.asyncUpdate = (
    { storeName, stateActions, prop, cacheFor, optimisticallyUpdateWith, arg }: EnableAsyncActionsArgs
  ) => {
    if (libState.isInsideTransaction) { throw new Error(errorMessages.ASYNC_PAYLOAD_INSIDE_TRANSACTION); }
    const readCurrentState = () =>
      readState({ state: libState.stores[storeName].$state, stateActions: [...stateActions, { type: 'action', name: 'state' }], cursor: { index: 0 } });
    let state = { storeValue: readCurrentState(), error: null, isLoading: false, wasRejected: false, wasResolved: false } as FutureState<any>;
    if (libState.stores[storeName].$state.cache?.[stateActions.map(sa => sa.actionType).join('.')]) {
      const result = new Proxy(new Promise<any>(resolve => resolve(readCurrentState())), {
        get: (target: any, prop: any) => {
          if (prop === 'then' || prop === 'catch' || prop === 'finally') {
            const t = Promise.resolve(readCurrentState());
            return (t as any)[prop].bind(t);
          } else if (prop === 'state') {
            return state;
          } else {
            return (...args: any[]) => target[prop].apply(target, args);
          }
        }
      });
      Object.keys(augmentations.future).forEach(name => (result as any)[name] = augmentations.future[name](result));
      return result;
    }
    const promiseResult = () => {
      let snapshot: any = undefined;
      if (optimisticallyUpdateWith) {
        snapshot = readCurrentState();
        setNewStateAndNotifyListeners({ storeName, stateActions: [...stateActions, { type: 'action', name: prop, arg: optimisticallyUpdateWith, actionType: `${prop}()` }] });
      }
      state = { ...state, isLoading: true, storeValue: readCurrentState() };
      const promise = (augmentations.async ? augmentations.async(arg) : arg()) as Promise<any>;
      return promise
        .then(promiseResult => {
          setNewStateAndNotifyListeners({ storeName, stateActions: [...stateActions, { type: 'action', name: prop, arg: promiseResult, actionType: `${prop}()` }] });
          state = { ...state, wasResolved: true, wasRejected: false, isLoading: false, storeValue: readCurrentState() };
          if (cacheFor) {
            const statePath = stateActions.map(sa => sa.actionType).join('.');
            const actions = [
              { type: 'property', name: 'cache', actionType: 'cache' },
              { type: 'property', name: statePath, actionType: statePath },
            ] as StateAction[];
            setNewStateAndNotifyListeners({ storeName, stateActions: [...actions, { type: 'action', name: 'replace', arg: toIsoStringInCurrentTz(new Date()), actionType: 'replace()' }] });
            setTimeout(() => {
              try {
                setNewStateAndNotifyListeners({ storeName, stateActions: [...actions, { type: 'action', name: 'remove', actionType: 'remove()' }] })
              } catch (e) {
                // Ignoring. This may happen due to the user manually invalidating a cache. If that has happened, we don't want an error to be thrown.
              }
            }, cacheFor);
          }
          return readCurrentState();
        }).catch(error => {
          if (snapshot !== undefined) {
            setNewStateAndNotifyListeners({ storeName, stateActions: [...stateActions, { type: 'action', name: prop, arg: snapshot, actionType: `${prop}()` }] });
          }
          state = { ...state, wasRejected: true, wasResolved: false, isLoading: false, error };
          throw error;
        });
    }
    let promiseWasChained = false;
    const result: any = new Proxy(new Promise<any>(resolve => {
      setTimeout(() => { if (!promiseWasChained) { promiseResult().then((r) => resolve(r)); } });
    }), {
      get: (target: any, prop: any) => {
        if (prop === 'state') {
          return state;
        } else if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          promiseWasChained = true;
          const t = promiseResult();
          return (t as any)[prop].bind(t);
        } else { // must be an augmentation
          promiseWasChained = true;
          return target[prop];
        }
      }
    })
    Object.keys(augmentations.future).forEach(name => (result as any)[name] = augmentations.future[name](result));
    return result
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
