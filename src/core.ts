import { augmentations, errorMessages, libState } from './constant';
import { readState } from './read';
import { Readable, StateAction, Store, StoreAugment } from './type';
import { assertIsAnyLibProp, assertIsRecord, assertIsStoreInternal, assertIsString, is } from './type-check';
import { StoreInternal } from './type-internal';
import { deepFreeze } from './utility';
import { processPotentiallyAsyncUpdate } from './write';
import { setNewStateAndNotifyListeners } from './write-complete';


export const createInnerStore = <S extends Record<string, unknown>>(state: S) => ({
  usingAccessor: <C extends Readable<unknown>>(accessor: (store: Store<S>) => C): C & (C extends never ? unknown : StoreAugment<C>) => {
    if (!libState.store) {
      const created = createStore(state);
      assertIsStoreInternal(created);
      libState.store = created;
    } else {
      libState.store.$patchDeep(state);
    }
    const store = libState.store as Store<S>;
    return new Proxy({}, {
      get: (_, prop: string) => accessor(store)[prop as keyof C]
    }) as C & (C extends never ? unknown : StoreAugment<C>);
  }
})

export function createStore<S extends Record<string, unknown>>(
  initialState: S
): Store<S> & (S extends never ? unknown : StoreAugment<S>) {
  validateState(initialState);
  removeStaleCacheReferences(initialState);
  if (!libState.initialState) {
    const state = deepFreeze(initialState)!;
    libState.initialState = state;
    libState.state = state;
  }
  const recurseProxy = (stateActions: StateAction[], topLevel = false): StoreInternal => {
    return new Proxy(<StoreInternal>{}, {
      get: (_, prop: string) => {
        stateActions = topLevel ? new Array<StateAction>() : stateActions;
        if (is.anyUpdateFunction(prop)) {
          return (arg: unknown, { cache, eager }: { cache?: number, eager?: unknown } = {}) => {
            if (libState.olikDevtools) {
              libState.stacktraceError = new Error();
            }
            if (prop === '$delete') {
              const stateActionsStr = stateActions.map(sa => sa.name).join('.');
              libState.changeListeners.filter(l => l.actions.map(a => a.name).join('.').startsWith(stateActionsStr))
                .forEach(l => l.unsubscribe());
            }
            if (prop === '$setKey') {
              assertIsString(arg);
              const stateActionsStr = stateActions.map(sa => sa.name).join('.');
              libState.changeListeners.filter(l => l.actions.map(a => a.name).join('.').startsWith(stateActionsStr))
                .forEach(l => l.actions[l.actions.length - 2].name = arg);
            }
            return processPotentiallyAsyncUpdate({ stateActions, prop, arg, cache, eager });
          }
        }
        if (augmentations.selection[prop]) {
          return augmentations.selection[prop](recurseProxy(stateActions));
        }
        if (augmentations.core[prop]) {
          return augmentations.core[prop](recurseProxy(stateActions));
        }
        if (!is.anyLibProp(prop)) {
          stateActions.push({ name: prop });
          return recurseProxy(stateActions);
        }
        if (is.anyComparatorProp(prop)) {
          return (arg?: unknown) => {
            stateActions.push({ name: prop, arg });
            return recurseProxy(stateActions);
          }
        }
        assertIsAnyLibProp(prop);
        if (prop === '$invalidateCache') {
          return () => {
            try {
              setNewStateAndNotifyListeners({
                stateActions: [
                  { name: 'cache' },
                  { name: stateActions.map(sa => sa.name).join('.') },
                  { name: '$delete' },
                ],
              });
            } catch (e) {
              /* This can happen if a cache has already expired */
            }
          }
        }
        if (prop === '$mergeMatching') {
          stateActions.push({ name: prop });
          return recurseProxy(stateActions);
        }
        if (prop === '$state') {
          const tryFetchResult = (stateActions: StateAction[]): unknown => {
            try {
              return deepFreeze(readState({ state: libState.state, stateActions: [...stateActions, { name: prop }], cursor: { index: 0 } }));
            } catch (e) {
              stateActions.pop();
              return tryFetchResult(stateActions);
            }
          }
          const result = tryFetchResult(stateActions.slice());
          return result === undefined ? null : result;
        }
        if (prop === '$onChange') {
          return (listener: (arg: unknown) => unknown) => {
            const stateActionsCopy: StateAction[] = [...stateActions, { name: prop }];
            const unsubscribe = () => libState.changeListeners.splice(libState.changeListeners.findIndex(e => e === element), 1);
            const element = { actions: stateActionsCopy, listener, unsubscribe };
            libState.changeListeners.push(element);
            return { unsubscribe }
          }
        }
        if (prop === '$and' || prop === '$or') {
          stateActions.push({ name: prop });
          return recurseProxy(stateActions);
        }
        if (prop === '$find' || prop === '$filter') {
          stateActions.push({ name: prop });
          return recurseProxy(stateActions);
        }
        if (prop === '$at') {
          return (index: number) => {
            stateActions.push({ name: prop, arg: index });
            return recurseProxy(stateActions);
          }
        }
        if (prop === '$stateActions') {
          return stateActions;
        }
        if (prop === '$distinct') {
          stateActions.push({ name: prop });
          return recurseProxy(stateActions);
        }
      }
    });
  };
  return (libState.store = recurseProxy([], true)) as Store<S>;
}

export const validateState = (state: unknown) => {
  const throwError = (illegal: { toString(): string }) => {
    throw new Error(errorMessages.INVALID_STATE_INPUT(illegal));
  };
  if (is.actual(state) && !is.primitive(state)) {
    if (!is.array(state) && !is.record(state) && !is.date(state)) {
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

export const removeStaleCacheReferences = (state: Record<string, unknown>) => {
  if (!state.cache) { return; }
  assertIsRecord<string>(state.cache);
  for (const key in state.cache) {
    if (new Date(state.cache[key]).getTime() <= Date.now()) {
      delete state.cache[key];
    }
  }
}
