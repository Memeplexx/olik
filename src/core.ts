import { augmentations, errorMessages, libState } from './constant';
import { readState } from './read';
import { Readable, StateAction, Store, StoreAugment, StoreDef, ValidJsonObject } from './type';
import { comparatorsPropMap, concatPropMap, libPropMap, updatePropMap } from './type-check';
import { StoreInternal } from './type-internal';
import { constructTypeString } from './utility';
import { setNewStateAndNotifyListeners } from './write-complete';


export const createInnerStore = <S extends ValidJsonObject>(state: S) => ({
  usingAccessor: <C extends Readable<unknown>>(accessor: (store: Store<S>) => C): C & (C extends never ? unknown : StoreAugment<C>) => {
    if (libState.store)
      libState.store.$patchDeep(state);
    const created = createStore(state);
    libState.store = created as unknown as StoreInternal;
    const store = libState.store as Store<S>;
    return new Proxy({}, {
      get: (_, prop: string) => accessor(store)[prop as keyof C]
    }) as C & (C extends never ? unknown : StoreAugment<C>);
  }
})

const emptyObj = {} as StoreInternal;
const { selection, core } = augmentations;
const recurseProxy = (stateActions?: StateAction[]): StoreInternal => new Proxy(emptyObj, {
  get: (_, prop: string) => {
    if ('$stateActions' === prop)
      return stateActions ?? [];
    if ('$state' === prop)
      return !stateActions ? libState.state : state(stateActions, prop);
    if (updatePropMap[prop])
      return processUpdateFunction(stateActions ?? [], prop);
    const selectAugmentation = selection[prop];
    if (selectAugmentation)
      return selectAugmentation(recurseProxy(stateActions ?? []));
    const coreAugmentation = core[prop];
    if (coreAugmentation)
      return coreAugmentation(recurseProxy(stateActions ?? []));
    if (!libPropMap[prop] || concatPropMap[prop])
      return basicProp(stateActions ?? [], prop);
    if ('$at' === prop || comparatorsPropMap[prop])
      return comparator(stateActions ?? [], prop);
    if ('$onChange' === prop)
      return onChange(stateActions ?? [], prop);
    if ('$invalidateCache' === prop)
      return invalidateCache(stateActions ?? []);
  }
});

export function createStore<S extends ValidJsonObject>(
  initialState: S
): StoreDef<S> {
  removeStaleCacheReferences(initialState);
  initializeLibState(initialState);
  return (libState.store = recurseProxy()) as unknown as StoreDef<S>;
}

const onChange = (stateActions: StateAction[], prop: string) => (listener: (arg: unknown) => unknown) => {
  const { changeListeners } = libState;
  const unsubscribe = () => {
    const changeListenerIndex = changeListeners.findIndex(cl => cl.path === path)!;
    const changeListener = changeListeners[changeListenerIndex];
    if (changeListener.listeners.length === 1) {
      changeListeners.splice(changeListenerIndex, 1);
    } else {
      changeListener.listeners.splice(changeListener.listeners.findIndex(l => l === listener), 1);
    }
  }
  const path = stateActions.map(sa => constructTypeString(sa, false)).join('.') // double check!!!!!!!
  const changeListener = changeListeners.find(cl => cl.path === path);
  if (changeListener) {
    changeListener.listeners.push(listener);
  } else {
    changeListeners.push({
      actions: [...stateActions, { name: prop }],
      listeners: [listener],
      unsubscribe,
      cachedState: undefined,
      path,
    })
  }
  
  return { unsubscribe }
}

const state = (stateActions: StateAction[], prop: string) => {
  const { state } = libState;
  const tryFetchResult = (stateActions: StateAction[]): unknown => {
    try {
      return readState(state, stateActions);
    } catch (e) {
      stateActions.pop();
      return tryFetchResult(stateActions);
    }
  }
  const result = tryFetchResult([...stateActions, { name: prop }]);
  return typeof (result) === 'undefined' ? null : result;
}

const initializeLibState = (initialState: ValidJsonObject) => {
  if (libState.initialState)
    return;
  libState.state = libState.initialState = initialState;
}

const removeStaleCacheReferences = (state: ValidJsonObject) => {
  if (!state.cache)
    return;
  state.cache = Object.fromEntries(Object.entries(state.cache).filter(([, value]) => new Date(value).getTime() > Date.now()));
}

const basicProp = (stateActions: StateAction[], prop: string) => {
  stateActions.push({ name: prop });
  return recurseProxy(stateActions);
}

const comparator = (stateActions: StateAction[], prop: string) => (arg?: unknown) => {
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
  if (typeof (arg) === 'function') {
    if (!libState.asyncUpdate)
      throw new Error(errorMessages.ASYNC_UPDATES_NOT_ENABLED);
    return libState.asyncUpdate(stateActions, prop, options ?? {}, arg);
  } else {
    stateActions.push({ name: prop, arg });
    setNewStateAndNotifyListeners(stateActions);
  }
}
