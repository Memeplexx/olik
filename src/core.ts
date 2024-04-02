import { augmentations, errorMessages, libState } from './constant';
import { readState } from './read';
import { Readable, StateAction, Store, StoreAugment } from './type';
import { assertIsRecord, assertIsStoreInternal, assertIsString, is } from './type-check';
import { StoreArgs, StoreInternal } from './type-internal';
import { deepFreeze } from './utility';
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
  initializeLibState(initialState);
  const recurseProxy = (stateActions: StateAction[], topLevel = false): StoreInternal => new Proxy(<StoreInternal>{}, {
    get: (_, prop: string) => {
      stateActions = topLevel ? [] : stateActions;
      const args = { stateActions, prop, recurseProxy };
      if (is.anyUpdateFunction(prop)) {
        return processUpdateFunction(args);
      }
      if (augmentations.selection[prop]) {
        return augmentations.selection[prop](recurseProxy(stateActions));
      }
      if (augmentations.core[prop]) {
        return augmentations.core[prop](recurseProxy(stateActions));
      }
      if (!is.anyLibArg(prop) || is.anyLibArg(prop, '$and', '$or', '$find', '$filter', '$distinct', '$mergeMatching')) {
        return basicProp(args);
      }
      if (is.anyLibArg(prop, '$at') || is.anyComparatorProp(prop)) {
        return comparator(args);
      }
      if (is.anyLibArg(prop, '$invalidateCache')) {
        return invalidateCache(args);
      }
      if (is.anyLibArg(prop, '$state')) {
        return state(args);
      }
      if (is.anyLibArg(prop, '$onChange')) {
        return onChange(args);
      }
      if (is.anyLibArg(prop, '$stateActions')) {
        return stateActions;
      }
    }
  });
  return (libState.store = recurseProxy([], true)) as Store<S>;
}

const validateState = (state: unknown) => {
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

const onChange = (args: StoreArgs) => (listener: (arg: unknown) => unknown) => {
  const stateActionsCopy: StateAction[] = [...args.stateActions, { name: args.prop }];
  const unsubscribe = () => libState.changeListeners.splice(libState.changeListeners.findIndex(e => e === element), 1);
  const element = { actions: stateActionsCopy, listener, unsubscribe };
  libState.changeListeners.push(element);
  return { unsubscribe }
}

const state = (args: StoreArgs) => {
  const tryFetchResult = (stateActions: StateAction[]): unknown => {
    try {
      return deepFreeze(readState({ state: libState.state, stateActions: [...stateActions, { name: args.prop }], cursor: { index: 0 } }));
    } catch (e) {
      stateActions.pop();
      return tryFetchResult(stateActions);
    }
  }
  const result = tryFetchResult(args.stateActions.slice());
  return result === undefined ? null : result;
}

const initializeLibState = (initialState: Record<string, unknown>) => {
  if (!libState.initialState) {
    const state = deepFreeze(initialState)!;
    libState.initialState = state;
    libState.state = state;
  }
}

const removeStaleCacheReferences = (state: Record<string, unknown>) => {
  if (!state.cache) { return; }
  assertIsRecord<string>(state.cache);
  for (const key in state.cache) {
    if (new Date(state.cache[key]).getTime() <= Date.now()) {
      delete state.cache[key];
    }
  }
}

const basicProp = (args: StoreArgs) => {
  args.stateActions.push({ name: args.prop });
  return args.recurseProxy(args.stateActions);
}

const comparator = (args: StoreArgs) => (arg?: unknown) => {
  args.stateActions.push({ name: args.prop, arg });
  return args.recurseProxy(args.stateActions);
}

const invalidateCache = (args: StoreArgs) => () => {
  try {
    setNewStateAndNotifyListeners({
      stateActions: [
        { name: 'cache' },
        { name: args.stateActions.map(sa => sa.name).join('.') },
        { name: '$delete' },
      ],
    });
  } catch (e) {
    /* This can happen if a cache has already expired */
  }
};

const processUpdateFunction = (args: StoreArgs) => (arg: unknown, { cache, eager }: { cache?: number, eager?: unknown } = {}) => {
  if (libState.olikDevtools) {
    libState.stacktraceError = new Error();
  }
  if (is.anyLibArg(args.prop, '$delete')) {
    const stateActionsStr = args.stateActions.map(sa => sa.name).join('.');
    libState.changeListeners
      .filter(l => l.actions.map(a => a.name).join('.').startsWith(stateActionsStr))
      .forEach(l => l.unsubscribe());
  }
  if (is.anyLibArg(args.prop, '$setKey')) {
    assertIsString(arg);
    const stateActionsStr = args.stateActions.map(sa => sa.name).join('.');
    libState.changeListeners
      .filter(l => l.actions.map(a => a.name).join('.').startsWith(stateActionsStr))
      .forEach(l => l.actions[l.actions.length - 2].name = arg);
  }
  deepFreeze(arg);
  if (typeof (arg) === 'function') {
    if (!libState.asyncUpdate) { throw new Error(errorMessages.ASYNC_UPDATES_NOT_ENABLED) }
    return libState.asyncUpdate({ arg, cache, eager, ...args })
  } else {
    setNewStateAndNotifyListeners({ stateActions: [...args.stateActions, { name: args.prop, arg }] });
  }
}
