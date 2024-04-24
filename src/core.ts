import { augmentations, errorMessages, libState } from './constant';
import { readState } from './read';
import { Readable, StateAction, Store, StoreAugment } from './type';
import { as, is } from './type-check';
import { StoreArgs, StoreInternal } from './type-internal';
import { deepFreeze } from './utility';
import { setNewStateAndNotifyListeners } from './write-complete';


export const createInnerStore = <S extends Record<string, unknown>>(state: S) => ({
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

export function createStore<S extends Record<string, unknown>>(
  initialState: S
): Store<S> & (S extends never ? unknown : StoreAugment<S>) {
  validateState(initialState);
  removeStaleCacheReferences(initialState);
  initializeLibState(initialState);
  const recurseProxy = (stateActions: StateAction[], topLevel = false): StoreInternal => new Proxy({} as StoreInternal, {
    get: (_, prop: string) => {
      stateActions = topLevel ? [] : stateActions;
      const args = { stateActions, prop, recurseProxy };
      if ('$stateActions' === prop)
        return stateActions;
      if ('$at' === prop || is.anyComparatorProp(prop))
        return comparator(args);
      if ('$invalidateCache' === prop)
        return invalidateCache(args);
      if ('$state' === prop)
        return state(args);
      if ('$onChange' === prop)
        return onChange(args);
      if (augmentations.selection[prop])
        return augmentations.selection[prop](recurseProxy(stateActions));
      if (augmentations.core[prop])
        return augmentations.core[prop](recurseProxy(stateActions));
      if (is.anyUpdateFunction(prop))
        return processUpdateFunction(args);
      if (!is.libArg(prop) || is.anyConcatenationProp(prop))
        return basicProp(args);
    }
  });
  return (libState.store = recurseProxy([], true)) as Store<S>;
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

const onChange = (args: StoreArgs) => (listener: (arg: unknown) => unknown) => {
  const unsubscribe = () => libState.changeListeners.splice(libState.changeListeners.findIndex(e => e === changeListener), 1);
  const changeListener = { actions: [...args.stateActions, { name: args.prop }], listener, unsubscribe };
  libState.changeListeners.push(changeListener);
  return { unsubscribe }
}

const state = (args: StoreArgs) => {
  const tryFetchResult = (stateActions: StateAction[]): unknown => {
    try {
      return readState({ state: libState.state, stateActions });
    } catch (e) {
      stateActions.pop();
      return tryFetchResult(stateActions);
    }
  }
  const result = tryFetchResult([...args.stateActions, { name: args.prop }]);
  return is.undefined(result) ? null : deepFreeze(result);
}

const initializeLibState = (initialState: Record<string, unknown>) => {
  if (libState.initialState) 
    return;
  libState.state = libState.initialState = initialState;
}

const removeStaleCacheReferences = (state: Record<string, unknown>) => {
  if (!state.cache) 
    return;
  state.cache = Object.fromEntries(Object.entries(as.record<string>(state.cache)).filter(([, value]) => new Date(value).getTime() > Date.now()));
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
  if (libState.devtools)
    libState.stacktraceError = new Error();
  if ('$delete' === args.prop) {
    const stateActionsStr = args.stateActions.map(sa => sa.name).join('.');
    libState.changeListeners
      .filter(l => l.actions.map(a => a.name).join('.').startsWith(stateActionsStr))
      .forEach(l => l.unsubscribe());
  }
  if ('$setKey' === args.prop) {
    const stateActionsStr = args.stateActions.map(sa => sa.name).join('.');
    libState.changeListeners
      .filter(l => l.actions.map(a => a.name).join('.').startsWith(stateActionsStr))
      .forEach(l => l.actions[l.actions.length - 2].name = as.string(arg));
  }
  if (is.function(arg)) {
    if (!libState.asyncUpdate) 
      throw new Error(errorMessages.ASYNC_UPDATES_NOT_ENABLED);
    return libState.asyncUpdate({ arg, cache, eager, ...args })
  } else {
    setNewStateAndNotifyListeners({ stateActions: [...args.stateActions, { name: args.prop, arg }] });
  }
}
