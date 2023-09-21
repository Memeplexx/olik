import { augmentations, libState } from './constant';
import { readState } from './read';
import { Actual, EnableAsyncActionsArgs, FutureState, StateAction } from './type';
import { toIsoStringInCurrentTz } from './utility';
import { setNewStateAndNotifyListeners } from './write-complete';

export const importOlikAsyncModule = () => {
  libState.asyncUpdate = (
    { stateActions, prop, cache, eager, arg }: EnableAsyncActionsArgs
  ) => {
    const readCurrentState = () =>
      readState({ state: libState.state, stateActions: [...stateActions, { name: '$state' }], cursor: { index: 0 } });
    let state: FutureState<unknown> = { storeValue: readCurrentState(), error: null, isLoading: false, wasRejected: false, wasResolved: false };
    if (libState.state && 'cache' in libState.state && (libState.state.cache as Record<string, unknown>)[stateActions.map(sa => sa.name).join('.')]) {
      const result = new Proxy(new Promise(resolve => resolve(readCurrentState())), {
        get: (target, prop: string) => {
          if (prop === 'then' || prop === 'catch' || prop === 'finally') {
            const t = Promise.resolve(readCurrentState());
            return t[prop].bind(t);
          } else if (prop === '$state') {
            return state;
          } else {
            return (...args: Array<Actual>) => (target as unknown as Record<string, (a: Actual[]) => unknown>)[prop]!(args);
          }
        }
      });
      const resultCast = result as unknown as Record<string, () => unknown>;
      const futureCast = augmentations.future as unknown as Record<string, (a: unknown) => () => unknown>;
      Object.keys(augmentations.future).forEach(name => resultCast[name] = futureCast[name](result));
      return result;
    }
    const promiseResult = () => {
      let snapshot: unknown = undefined;
      if (eager) {
        snapshot = readCurrentState();
        setNewStateAndNotifyListeners({ stateActions: [...stateActions, { name: prop, arg: eager }] });
      }
      state = { ...state, isLoading: true, storeValue: readCurrentState() };
      const argCast = arg as () => Promise<unknown>;
      const promise = (augmentations.async ? augmentations.async(argCast) : argCast());
      return promise
        .then(promiseResult => {
          setNewStateAndNotifyListeners({ stateActions: [...stateActions, { name: prop, arg: promiseResult }] });
          state = { ...state, wasResolved: true, wasRejected: false, isLoading: false, storeValue: readCurrentState() };
          if (cache) {
            const statePath = stateActions.map(sa => sa.name).join('.');
            const actions = [
              { name: 'cache' },
              { name: statePath },
            ] satisfies StateAction[];
            setNewStateAndNotifyListeners({ stateActions: [...actions, { name: '$set', arg: toIsoStringInCurrentTz(new Date()) }] });
            setTimeout(() => {
              try {
                setNewStateAndNotifyListeners({ stateActions: [...actions, { name: '$delete' }] })
              } catch (e) {
                // Ignoring. This may happen due to the user manually invalidating a cache. If that has happened, we don't want an error to be thrown.
              }
            }, cache);
          }
          return readCurrentState();
        }).catch(error => {
          if (snapshot !== undefined) {
            setNewStateAndNotifyListeners({ stateActions: [...stateActions, { name: prop, arg: snapshot }] });
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
        if (prop === '$state') {
          return state;
        } else if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          promiseWasChained = true;
          const t = promiseResult();
          return t[prop].bind(t);
        } else { // must be an augmentation
          promiseWasChained = true;
          return (target as unknown as Record<string, unknown>)[prop];
        }
      }
    }) as { state: FutureState<unknown> } & Promise<unknown>;
    const resultCast = result as unknown as Record<string, (arg: Actual[]) => unknown>;
    Object.keys(augmentations.future).forEach(name => resultCast[name] = augmentations.future[name](result));
    return result;
  }
}


