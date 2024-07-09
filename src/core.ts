import { augmentations, comparatorsPropMap, errorMessages, libPropMap, libState, testState, updatePropMap } from './constant';
import { readState } from './read';
import { BasicRecord, ChangeListener, DeepReadonly, DeepReadonlyArray, OnChange, OnArray, SortOrder, StateAction, Store } from './type';
import { StoreInternal } from './type-internal';
import { constructTypeStrings } from './utility';
import { copyNewState } from './write-copy';


const emptyObj = {} as StoreInternal;
const { selection, core } = augmentations;
const map = { ...comparatorsPropMap, $at: true };
const recurseProxy = (stateActions?: StateAction[]): StoreInternal => new Proxy(emptyObj, {
  get: (_, prop: string) => {
    if (prop === '$stateActions')
      return stateActions ?? [];
    if (prop === '$state')
      return !stateActions?.length ? libState.state : state(stateActions, prop);
    if (prop in updatePropMap)
      return update(stateActions ?? [], prop);
    if (prop in selection)
      return selection[prop](recurseProxy(stateActions ?? []));
    if (prop in core)
      return core[prop](recurseProxy(stateActions ?? []));
    if (prop in map)
      return comparator(stateActions ?? [], prop);
    if (prop === '$onChange')
      return onChange(stateActions ?? [], prop);
    if (prop === '$onArray')
      return onArray(stateActions ?? [], prop);
    if (prop === '$ascending' || prop === '$descending')
      return memoizeSortBy(stateActions ?? [], prop);
    return basicProp(stateActions ?? [], prop);
  }
});

export function createStore<S extends BasicRecord>(
  initialState: S
): Store<S> {
  validateState('', initialState);
  initializeLibState(initialState);
  return (libState.store = recurseProxy()) as unknown as Store<S>;
}

const onArray = (stateActions: StateAction[], name: string) => {
  const path = constructTypeStrings(stateActions, false); // double check how path is calculated!!!!!!!
  const construct = (changeArrayListeners: ChangeListener[], isInsert = false) => {
    const toProxy = (listener => {
      const unsubscribe = () => {
        const changeListenerIndex = changeArrayListeners.findIndex(cl => cl.path === path)!;
        const { listeners } = changeArrayListeners[changeListenerIndex];
        if (listeners.length === 1)
          changeArrayListeners.splice(changeListenerIndex, 1);
        else
          listeners.splice(listeners.findIndex(l => l === listener), 1);
      }
      const listeners = changeArrayListeners.find(cl => cl.path === path)?.listeners;
      if (listeners)
        listeners.push(listener);
      else
        changeArrayListeners.push({
          actions: [...stateActions, { name }],
          listeners: [listener],
          unsubscribe,
          cachedState: undefined,
          path,
        })
      return unsubscribe;
    }) as OnArray<unknown>['$onArray']['$inserted'];
    return new Proxy(toProxy, {
      get: (_, prop: string) => {
        if (prop === '$onChange') {
          return (listener => {
            if (!libState.changeArrayListenerToListenerMap.has(listener))
              libState.changeArrayListenerToListenerMap.set(listener, []);
            const entry = libState.changeArrayListenerToListenerMap.get(listener)!;
            entry.push(listener);
            return toProxy(listener)
          }) as OnArray<unknown>['$onArray']['$inserted']
        }
        if (prop === '$state') {
          const result = libState.changedArrayPayloads.get(path);
          if (result !== undefined) return result;
          return isInsert ? state(stateActions, '$state') : [];
        }
      }
    })
  }
  return ({
    $inserted: construct(libState.changeArrayInsertListeners, true),
    $deleted: construct(libState.changeArrayDeleteListeners),
    $updated: construct(libState.changeArrayUpdateListeners),
  }) as OnArray<unknown>['$onArray'];
}

const onChange = (stateActions: StateAction[], name: string) => ((listener, options) => {
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
  if (options?.fireImmediately) {
    const s = state(stateActions, name) as DeepReadonly<unknown>;
    listener(s, s);
  }
  return unsubscribe;
}) as OnChange<unknown>['$onChange'];

const memoizeSortBy = (stateActions: StateAction[], name: SortOrder) => {
  if (!libState.sortModule)
    throw new Error(errorMessages.SORT_MODULE_NOT_CONFIGURED);
  if (stateActions.some(sa => sa.name === '$withId'))
    return libState.sortModule!.sortObject!(stateActions ?? [], name);
  return libState.sortModule!.sortPrimitive!(stateActions ?? [], name);
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

const basicProp = (stateActions: StateAction[], name: string) => {
  return recurseProxy([...stateActions, { name }]);
}

const comparator = (stateActions: StateAction[], name: string) => (arg?: unknown) => {
  return recurseProxy([...stateActions, { name, arg }]);
}

const update = (stateActions: StateAction[], name: string) => (arg: unknown) => {
  if (libState.devtools)
    libState.stacktraceError = new Error();
  return setNewStateAndNotifyListeners([...stateActions, { name, arg }]);
}

export const setNewStateAndNotifyListeners = (stateActions: StateAction[]) => {
  const { state: oldState, devtools, disableDevtoolsDispatch, changeArrayInsertListeners, changeArrayDeleteListeners, changeArrayUpdateListeners } = libState;
  if (devtools && !disableDevtoolsDispatch) {
    const type = constructTypeStrings(stateActions, true);
    const typeOrig = constructTypeStrings(stateActions, false);
    testState.currentActionType = type;
    testState.currentActionTypeOrig = type !== typeOrig ? typeOrig : undefined;
    testState.currentActionPayload = stateActions.at(-1)!.arg;
    devtools.dispatch({ stateActions, actionType: testState.currentActionType });
  }
  libState.state = copyNewState(oldState!, stateActions, { index: 0 }) as BasicRecord;
  libState.changeListeners.forEach(listener => {
    const { actions, cachedState } = listener;
    const selectedOldState = cachedState !== undefined ? cachedState : readState(oldState, actions);
    const selectedNewState = readState(libState.state, actions);
    const arraysDoNotMatch = (Array.isArray(selectedOldState) && Array.isArray(selectedNewState))
      && (selectedNewState.length !== selectedOldState.length || selectedOldState.some((el, i) => el !== selectedNewState[i]));
    if (arraysDoNotMatch || selectedOldState !== selectedNewState) {
      listener.cachedState = selectedNewState;
      listener.listeners.forEach(listener => listener(selectedNewState as DeepReadonly<unknown>, selectedOldState as DeepReadonly<unknown>));
    }
  });
  const construct = (elements: Map<string, unknown[]>, listeners: ChangeListener[]) => {
    listeners.forEach(listener => {
      const { path } = listener;
      const payload = (elements.get(path) ?? []) as DeepReadonlyArray<unknown>;
      if (!payload.length)
        return;
      const { actions, cachedState } = listener;
      const selectedOldState = (cachedState !== undefined ? cachedState : readState(oldState, actions)) as DeepReadonlyArray<unknown>;
      const selectedNewState = readState(libState.state, actions) as DeepReadonlyArray<unknown>;
      if (selectedOldState !== selectedNewState) {
        listener.cachedState = selectedNewState;
        listener.listeners.forEach(cl => {
          cl(payload, selectedOldState)
          const listeners = libState.changeArrayListenerToListenerMap.get(cl)!;
          if (listeners) {
            libState.changedArrayPayloads.set(path, payload);
            listeners.forEach(l => l(payload, {}))
          }
        })
      }
    });
    elements.clear();
  }
  construct(libState.insertedElements, changeArrayInsertListeners);
  construct(libState.updatedElements, changeArrayUpdateListeners);
  construct(libState.deletedElements, changeArrayDeleteListeners);
}

const initializeLibState = (initialState: BasicRecord) => {
  if (libState.initialState)
    return;
  libState.state = libState.initialState = initialState;
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
