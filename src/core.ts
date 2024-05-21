import { augmentations, comparatorsPropMap, errorMessages, libPropMap, libState, updatePropMap } from './constant';
import { readState } from './read';
import { BasicRecord, StateAction, StoreDef } from './type';
import { StoreInternal } from './type-internal';
import { constructTypeStrings } from './utility';
import { setNewStateAndNotifyListeners } from './write-complete';


const emptyObj = {} as StoreInternal;
const { selection, core } = augmentations;
const map = { ...comparatorsPropMap, $at: true };
const recurseProxy = (stateActions?: StateAction[]): StoreInternal => new Proxy(emptyObj, {
  get: (_, prop: string) => {
    if ('$stateActions' === prop)
      return stateActions ?? [];
    if ('$state' === prop)
      return !stateActions?.length ? libState.state : state(stateActions, prop);
    if (prop in updatePropMap)
      return processUpdateFunction(stateActions ?? [], prop);
    if (prop in selection)
      return selection[prop](recurseProxy(stateActions ?? []));
    if (prop in core)
      return core[prop](recurseProxy(stateActions ?? []));
    if (prop in map)
      return comparator(stateActions ?? [], prop);
    if ('$onChange' === prop)
      return onChange(stateActions ?? [], prop);
    return basicProp(stateActions ?? [], prop);
  }
});

export function createStore<S extends BasicRecord>(
  initialState: S
): StoreDef<S> {
  validateState('', initialState);
  removeStaleCacheReferences(initialState);
  initializeLibState(initialState);
  return (libState.store = recurseProxy()) as unknown as StoreDef<S>;
}

const onChange = (stateActions: StateAction[], name: string) => (listener: (arg: unknown) => unknown) => {
  const { changeListeners } = libState;
  const unsubscribe = () => {
    const changeListenerIndex = changeListeners.findIndex(cl => cl.path === path)!;
    const { listeners } = changeListeners[changeListenerIndex];
    if (listeners.length === 1)
      changeListeners.splice(changeListenerIndex, 1);
    else
      listeners.splice(listeners.findIndex(l => l === listener), 1);
  }
  const path = constructTypeStrings(stateActions, false); // double check how path is calculated!!!!!!!
  const listeners = changeListeners.find(cl => cl.path === path)?.listeners;
  if (listeners)
    listeners.push(listener);
  else
    changeListeners.push({
      actions: [...stateActions, { name }],
      listeners: [listener],
      unsubscribe,
      cachedState: undefined,
      path,
    })
  return { unsubscribe }
}

const state = (stateActions: StateAction[], name: string) => {
  const { state } = libState;
  const tryFetchResult = (stateActions: StateAction[]): unknown => {
    try {
      return readState(state, stateActions);
    } catch (e) {
      stateActions.splice(-2, 1);
      return tryFetchResult(stateActions);
    }
  }
  const result = tryFetchResult([...stateActions, { name }]);
  return typeof (result) === 'undefined' ? null : result;
}

const initializeLibState = (initialState: BasicRecord) => {
  if (libState.initialState)
    return;
  libState.state = libState.initialState = initialState;
}

const removeStaleCacheReferences = (state: BasicRecord) => {
  if (!state.cache)
    return;
  state.cache = Object.fromEntries(Object.entries(state.cache).filter(([, value]) => new Date(value).getTime() > Date.now()));
}

const basicProp = (stateActions: StateAction[], name: string) => {
  return recurseProxy([...stateActions, { name }]);
}

const comparator = (stateActions: StateAction[], name: string) => (arg?: unknown) => {
  return recurseProxy([...stateActions, { name, arg }]);
}

const processUpdateFunction = (stateActions: StateAction[], name: string) => (arg: unknown) => {
  if (libState.devtools)
    libState.stacktraceError = new Error();
  setNewStateAndNotifyListeners([...stateActions, { name, arg }]);
}

export const validateState = (key: string | number, state: unknown): void => {
  if (state === null || typeof state === 'string' || typeof state === 'number' || typeof state === 'boolean')
    return;
  if (typeof (state) === 'undefined' || typeof (state) === 'bigint' || typeof (state) === 'function' || typeof (state) === 'symbol' || state instanceof Set || state instanceof Map || state instanceof Promise || state instanceof Error || state instanceof RegExp)
    throw new Error(errorMessages.INVALID_STATE_INPUT(key, state ?? 'undefined'));
  if (Array.isArray(state))
    return state.forEach((e, i) => validateState(i, e));
  return Object.keys(state).forEach(key => {
    if (key in libPropMap)
      throw new Error(errorMessages.LIB_PROP_USED_IN_STATE(key));
    validateState(key, state[key as keyof typeof state]);
  });
}
