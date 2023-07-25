import { andOr, augmentations, comparators, errorMessages, findFilter, libState, updateFunctions } from './constant';
import { readState } from './read';
import { OptionsForMakingAStore, RecursiveRecord, StateAction, Store, StoreAugment } from './type';
import { is, mustBe } from './type-check';
import { StoreInternal, StoreInternals } from './type-internal';
import { deepFreeze } from './utility';
import { processPotentiallyAsyncUpdate } from './write';
import { setNewStateAndNotifyListeners } from './write-complete';

export function createStore<S>(
  args: OptionsForMakingAStore<S>
): Store<S> & (S extends never ? unknown : StoreAugment<S>) {
  validateKeyedState(args);
  const state = args.state as RecursiveRecord;
  validateState(args.state);
  removeStaleCacheReferences(state);
  const internals: StoreInternals = {
    state: JSON.parse(JSON.stringify(args.state)),
    changeListeners: [],
    currentAction: { type: '' },
    initialState: state,
  };
  const recurseProxy = (stateActions: StateAction[], topLevel = false): StoreInternal => {
    return new Proxy(<StoreInternal>{}, {
      get: (_, prop: string) => {
        stateActions = topLevel ? new Array<StateAction>() : stateActions;
        if ('$internals' === prop) {
          return internals;
        } else if (updateFunctions.includes(prop)) {
          return processPotentiallyAsyncUpdate({ stateActions, prop });
        } else if ('$invalidateCache' === prop) {
          return () => {
            try {
              setNewStateAndNotifyListeners({
                stateActions: [
                  { name: 'cache' },
                  { name: stateActions.map(sa => sa.name).join('.') },
                  { name: '$delete' },
                ]
              });
            } catch (e) {
              /* This can happen if a cache has already expired */
            }
          }
        } else if ('$mergeMatching' === prop) {
          stateActions.push({ name: prop });
          return recurseProxy(stateActions);
        } else if ('$state' === prop) {
          const tryFetchResult = (stateActions: StateAction[]): unknown => {
            try {
              return deepFreeze(readState({ state: internals.state, stateActions: [...stateActions, { name: prop }], cursor: { index: 0 } }));
            } catch (e) {
              stateActions.pop();
              return tryFetchResult(stateActions);
            }
          }
          const result = tryFetchResult(stateActions.slice());
          return result === undefined ? null : result;
        } else if ('$onChange' === prop) {
          return (listener: (arg: unknown) => unknown) => {
            const stateActionsCopy: StateAction[] = [...stateActions, { name: prop }];
            const unsubscribe = () => internals.changeListeners.splice(internals.changeListeners.findIndex(e => e === element), 1);
            const element = { actions: stateActionsCopy, listener, unsubscribe };
            internals.changeListeners.push(element);
            return { unsubscribe }
          }
        } else if (andOr.includes(prop)) {
          stateActions.push({ name: prop });
          return recurseProxy(stateActions);
        } else if (comparators.includes(prop)) {
          return (arg?: unknown) => {
            stateActions.push({ name: prop, arg });
            return recurseProxy(stateActions);
          }
        } else if (findFilter.includes(prop)) {
          stateActions.push({ name: prop });
          return recurseProxy(stateActions);
        } else if (augmentations.selection[prop]) {
          return augmentations.selection[prop](recurseProxy(stateActions));
        } else if (augmentations.core[prop]) {
          return augmentations.core[prop](recurseProxy(stateActions));
        } else {
          stateActions.push({ name: prop });
          return recurseProxy(stateActions);
        }
      }
    });
  };
  if (args.key) {
    internals.state = {};
    if (!libState.store) {
      libState.store = recurseProxy([], true);
    }
    libState.store!.$setNew({ [args.key!]: args.state });
    const innerStore = new Proxy(<Store<typeof state>>{}, {
      get: (_, prop: string) => {
        if (prop === '$destroyStore') {
          return () => {
            const changeListeners = libState.store!.$internals.changeListeners;
            changeListeners.filter(l => l.actions[0].name === args.key).forEach(l => l.unsubscribe());
            libState.store![args.key!].$delete();
            libState.detached.push(args.key!);
            libState.innerStores.delete(args.key!);
          }
        }
        return libState.store![args.key!][prop];
      }
    });
    libState.innerStores.set(args.key, innerStore);
    return innerStore as Store<S>;
  } else {
    if (libState.store) {
      libState.store.$setNew(state);
      return <Store<S>>libState.store;
    }
    return (libState.store = recurseProxy([], true)) as Store<S>;
  }
}

export const validateKeyedState = <S>(args: OptionsForMakingAStore<S>) => {
  if (!args.key) { return; }
  const state = libState.store?.$state;
  if (state === null || state === undefined) { return; }
  const initialStateOfHostStore = libState.store!.$internals.initialState;
  if (initialStateOfHostStore[args.key] !== undefined) {
    throw new Error(errorMessages.KEY_ALREADY_IN_USE(args.key));
  }
}

export const validateState = (state: unknown) => {
  const throwError = (illegal: { toString(): string }) => {
    throw new Error(errorMessages.INVALID_STATE_INPUT(illegal));
  };
  if (is.actual(state) && !is.primitive(state)) {
    if (!is.array(state) && !is.record(state)) {
      throwError(state);
    }
    Object.entries(state).forEach(([key, val]) => {
      if (key.startsWith('$')) {
        throw new Error(errorMessages.DOLLAR_USED_IN_STATE);
      }
      validateState(val);
    });
  }
}

export const removeStaleCacheReferences = (state: RecursiveRecord) => {
  if (!state.cache) { return; }
  const cache = mustBe.recordOf.string(state.cache);
  for (const key in cache) {
    if (new Date(cache[key]).getTime() <= Date.now()) {
      delete cache[key];
    }
  }
}
