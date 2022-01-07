import { augmentations, errorMessages, libState } from './constant';
import { readState } from './read';
import { OptionsForMakingAStore, StateAction, Store } from './type';
import { StoreInternals } from './type-internal';
import { deepFreeze } from './utility';
import { processPotentiallyAsyncUpdate } from './write';
import { setNewStateAndNotifyListeners } from './write-complete';


export const createStore = <S>(
  args: OptionsForMakingAStore<S>
): Store<S> => {
  validateState(args.state);
  removeStaleCacheReferences(args.state);
  const internals = {
    storeName: args.name,
    state: JSON.parse(JSON.stringify(args.state)),
    changeListeners: [],
    currentAction: { type: '' },
    batchedAction: {
      type: '',
      payloads: [],
      timeoutHandle: 0,
    },
  } as StoreInternals<S>;
  const recurseProxy = (s: any, topLevel: boolean, stateActions: StateAction[]): any => {
    if (typeof s !== 'object') { return null; }
    return new Proxy(s, {
      get: (target, prop: string) => {
        stateActions = topLevel ? new Array<StateAction>() : stateActions;
        if (topLevel && !!internals.nestedStoreInfo?.isNested) {
          const { nestedStoreInfo: { containerName, instanceName, storeName } } = internals;
          return libState.stores[containerName].nested[storeName][instanceName][prop];
        } else if (topLevel && internals.mergedStoreInfo?.isMerged) {
          return (libState.stores[internals.mergedStoreInfo.nameOfStoreToMergeInto] as any)[prop];
        } else if (['replace', 'patch', 'deepMerge', 'remove', 'increment', 'removeAll', 'replaceAll', 'patchAll', 'incrementAll', 'insertOne', 'insertMany', 'withOne', 'withMany'].includes(prop)) {
          return processPotentiallyAsyncUpdate({ storeName: internals.storeName, stateActions, prop, batchActions: args.batchActions });
        } else if ('invalidateCache' === prop) {
          return () => {
            const actionType = stateActions.map(sa => sa.actionType).join('.');
            const newStateActions = [
              { type: 'property', name: 'cache', actionType: 'cache' },
              { type: 'property', name: actionType, actionType },
              { type: 'action', name: 'remove', actionType: 'remove()' },
            ] as StateAction[];
            try {
              setNewStateAndNotifyListeners({ storeName: internals.storeName, batchActions: args.batchActions, stateActions: newStateActions });
            } catch (e) {
              /* This can happen if a cache has already expired */
            }
          }
        } else if ('internals' === prop) {
          return internals;
        } else if ('upsertMatching' === prop) {
          stateActions.push({ type: 'upsertMatching', name: prop, actionType: prop });
          return recurseProxy({}, false, stateActions);
        } else if ('state' === prop) {
          return deepFreeze(readState({ state: internals.state, stateActions: [...stateActions, { type: 'action', name: prop }], cursor: { index: 0 } }));
        } else if ('onChange' === prop) {
          return (listener: (arg: any) => any) => {
            const stateActionsCopy = [...stateActions, { type: 'action', name: prop }] as StateAction[];
            const element = { actions: stateActionsCopy, listener };
            internals.changeListeners.push(element);
            return { unsubscribe: () => internals.changeListeners.splice(internals.changeListeners.findIndex(e => e === element), 1) }
          }
        } else if (['and', 'or'].includes(prop)) {
          stateActions.push({ type: 'searchConcat', name: prop, actionType: prop });
          return recurseProxy({}, false, stateActions);
        } else if (['eq', 'ne', 'in', 'ni', 'gt', 'gte', 'lt', 'lte', 'match'].includes(prop)) {
          return (arg: any) => {
            stateActions.push({ type: 'comparator', name: prop, arg, actionType: `${prop}(${arg})` });
            return recurseProxy({}, false, stateActions);
          }
        } else if (['find', 'filter'].includes(prop)) {
          stateActions.push({ type: 'search', name: prop, actionType: prop });
          return recurseProxy({}, false, stateActions);
        } else if (augmentations.selection[prop]) {
          return augmentations.selection[prop](recurseProxy({}, false, stateActions));
        } else {
          stateActions.push({ type: 'property', name: prop, actionType: prop });
          return recurseProxy({}, false, stateActions);
        }
      }
    });
  };
  libState.stores[args.name] = recurseProxy({}, true, []);
  libState.stores[args.name].state = args.state;
  libState.stores[args.name].onChange(state => { if (libState.stores[internals.storeName]) { libState.stores[internals.storeName].state = state } });
  return libState.stores[args.name] as any;
}

export const validateState = (state: any) => {
  const throwError = (illegal: any) => {
    throw new Error(errorMessages.INVALID_STATE_INPUT(illegal));
  };
  if (
    state !== null
    && !['boolean', 'number', 'string'].some(type => typeof state === type)
  ) {
    if (!Array.isArray(state)) {
      if (typeof state !== "object") {
        throwError(state);
      }
      const proto = Object.getPrototypeOf(state);
      if (proto != null && proto !== Object.prototype) {
        throwError(state);
      }
    }
    Object.keys(state).forEach(key => validateState(state[key]));
  }
}

export const removeStaleCacheReferences = (state: any) => {
  if (!state.cache) { return; }
  for (let key in state.cache) {
    if (new Date(state.cache[key]).getTime() <= Date.now()) {
      delete state.cache[key];
    }
  }
}