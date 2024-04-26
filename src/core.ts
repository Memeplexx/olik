import { augmentations, errorMessages, libState } from './constant';
import { readState } from './read';
import { Readable, StateAction, Store, StoreAugment, StoreDef, ValidJsonObject } from './type';
import { as, is } from './type-check';
import { StoreInternal } from './type-internal';
import { setNewStateAndNotifyListeners } from './write-complete';


export const createInnerStore = <S extends ValidJsonObject>(state: S) => ({
  usingAccessor: <C extends Readable<unknown>>(accessor: (store: Store<S>) => C): C & (C extends never ? unknown : StoreAugment<C>) => {
    if (libState.store)
      libState.store.$patchDeep(state);
    const created = createStore(state);
    libState.store = as.storeInternal(created);
    const store = libState.store as Store<S>;
    return new Proxy({}, {
      get: (_, prop: string) => accessor(store)[prop as keyof C]
    }) as C & (C extends never ? unknown : StoreAugment<C>);
  }
})

export function createStore<S extends ValidJsonObject>(
  initialState: S
): StoreDef<S> {
  validateState(initialState);
  removeStaleCacheReferences(initialState);
  initializeLibState(initialState);
  const emptyObj = {} as StoreInternal;
  const recurseProxy = (stateActionsIncoming?: StateAction[]): StoreInternal => new Proxy(emptyObj, {
    get: (_, prop: string) => {
      const stateActions = stateActionsIncoming ?? [];
      if (augmentations.selection[prop])
        return augmentations.selection[prop](recurseProxy(stateActions));
      if (augmentations.core[prop])
        return augmentations.core[prop](recurseProxy(stateActions));
      if ('$state' === prop)
        return state(stateActions, prop);
      if (!is.libArg(prop) || is.anyConcatenationProp(prop))
        return basicProp(stateActions, prop, recurseProxy);
      if ('$stateActions' === prop)
        return stateActions;
      if ('$at' === prop || is.anyComparatorProp(prop))
        return comparator(stateActions, prop, recurseProxy);
      if ('$invalidateCache' === prop)
        return invalidateCache(stateActions);
      if ('$onChange' === prop)
        return onChange(stateActions, prop);
      if (is.anyUpdateFunction(prop))
        return processUpdateFunction(stateActions, prop);
    }
  });
  return (libState.store = recurseProxy()) as unknown as StoreDef<S>;
}

const validateState = (state: unknown) => {
  if (!is.actual(state) || is.primitive(state))
    return;
  if (!is.array(state) && !is.record(state) && !is.date(state))
    throw new Error(errorMessages.INVALID_STATE_INPUT(state));
  Object.entries(state).forEach(([key, val]) => {
    if (key.startsWith('$'))
      throw new Error(errorMessages.DOLLAR_USED_IN_STATE);
    validateState(val);
  });
}

const onChange = (stateActions: StateAction[], prop: string) => (listener: (arg: unknown) => unknown) => {
  const unsubscribe = () => libState.changeListeners.splice(libState.changeListeners.findIndex(e => e === changeListener), 1);
  const changeListener = { actions: [...stateActions, { name: prop }], listener, unsubscribe };
  libState.changeListeners.push(changeListener);
  return { unsubscribe }
}

const state = (stateActions: StateAction[], prop: string) => {
  const tryFetchResult = (stateActions: StateAction[]): unknown => {
    try {
      return readState(libState.state, stateActions);
    } catch (e) {
      stateActions.pop();
      return tryFetchResult(stateActions);
    }
  }
  const result = tryFetchResult([...stateActions, { name: prop }]);
  return is.undefined(result) ? null : result;
}

const initializeLibState = (initialState: Record<string, unknown>) => {
  if (libState.initialState)
    return;
  libState.state = libState.initialState = Object.freeze(initialState);
}

const removeStaleCacheReferences = (state: Record<string, unknown>) => {
  if (!state.cache)
    return;
  state.cache = Object.fromEntries(Object.entries(as.record<string>(state.cache)).filter(([, value]) => new Date(value).getTime() > Date.now()));
}

const basicProp = (stateActions: StateAction[], prop: string, recurseProxy: (stateActions: StateAction[]) => StoreInternal) => {
  stateActions.push({ name: prop });
  return recurseProxy(stateActions);
}

const comparator = (stateActions: StateAction[], prop: string, recurseProxy: (stateActions: StateAction[]) => StoreInternal) => (arg?: unknown) => {
  stateActions.push({ name: prop, arg });
  return recurseProxy(stateActions);
}

const invalidateCache = (stateActions: StateAction[]) => () => {
  try {
    setNewStateAndNotifyListeners([
      { name: 'cache' },
      { name: stateActions.map(sa => sa.name).join('.') },
      { name: '$delete' },
    ]);
  } catch (e) {
    /* This can happen if a cache has already expired */
  }
};

const processUpdateFunction = (stateActions: StateAction[], prop: string) => (arg: unknown, options: { cache?: number, eager?: unknown }) => {
  if (libState.devtools)
    libState.stacktraceError = new Error();
  if ('$delete' === prop) {
    const stateActionsStr = stateActions.map(sa => sa.name).join('.');
    libState.changeListeners
      .filter(l => l.actions.map(a => a.name).join('.').startsWith(stateActionsStr))
      .forEach(l => l.unsubscribe());
  }
  if ('$setKey' === prop) {
    const stateActionsStr = stateActions.map(sa => sa.name).join('.');
    libState.changeListeners
      .filter(l => l.actions.map(a => a.name).join('.').startsWith(stateActionsStr))
      .forEach(l => l.actions[l.actions.length - 2].name = as.string(arg));
  }
  if (is.function(arg)) {
    if (!libState.asyncUpdate)
      throw new Error(errorMessages.ASYNC_UPDATES_NOT_ENABLED);
    return libState.asyncUpdate(stateActions, prop, options ?? {}, arg);
  } else {
    stateActions.push({ name: prop, arg });
    setNewStateAndNotifyListeners(stateActions);
  }
}
