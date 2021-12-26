import { augmentations, libState } from './constant';
import { readState } from './read';
import { OptionsForMakingAStore, StateAction, Store } from './type';
import { StoreInternals } from './type-internal';
import { deepFreeze, validateState, removeStaleCacheReferences } from './utility';
import { processPotentiallyAsyncUpdate, setNewStateAndCallChangeListeners } from './write';


export const createStore = <S>(
  { name, state, batchActions }: OptionsForMakingAStore<S>
): Store<S> => {
  validateState(state);
  removeStaleCacheReferences(state);
  const internals = {
    storeName: name,
    state: JSON.parse(JSON.stringify(state)),
    changeListeners: [],
    currentAction: { type: '' },
    batchedAction: {
      type: '',
      payloads: [],
      timeoutHandle: 0,
    }
  } as StoreInternals<S>;
  const recurseProxy = (s: any, topLevel: boolean, stateActions: StateAction[]): any => {
    if (typeof s !== 'object') { return null; }
    return new Proxy(s, {
      get: (target, prop: string) => {
        stateActions = topLevel ? new Array<StateAction>() : stateActions;
        if (topLevel && internals.nestedStoreInfo) {
          const { nestedStoreInfo: { containerStoreName, instanceName, storeName } } = internals;
          return libState.stores[containerStoreName].nested[storeName][instanceName!][prop];
        } else if (topLevel && internals.mergedStoreInfo) {
          return (libState.stores[internals.mergedStoreInfo] as any)[prop];
        } else if (['replace', 'patch', 'deepMerge', 'remove', 'increment', 'removeAll', 'replaceAll', 'patchAll', 'incrementAll', 'insertOne', 'insertMany', 'withOne', 'withMany'].includes(prop)) {
          return processPotentiallyAsyncUpdate({ storeName: name, stateActions, prop, batchActions });
        } else if ('invalidateCache' === prop) {
          return () => {
            const actionType = stateActions.map(sa => sa.actionType).join('.');
            const newStateActions = [
              { type: 'property', name: 'cache', actionType: 'cache' },
              { type: 'property', name: actionType, actionType },
              { type: 'action', name: 'remove', actionType: 'remove()' },
            ] as StateAction[];
            try {
              setNewStateAndCallChangeListeners({ storeName: name, batchActions, stateActions: newStateActions });
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
  return libState.stores[name] = Object.assign(recurseProxy({}, true, []));
}
