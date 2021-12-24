import { augmentations, libState } from './constant';
import { readState } from './read';
import { OptionsForMakingAStore, StateAction, Store } from './type';
import { StoreInternals } from './type-internal';
import { deepFreeze, validateState } from './utility';
import { processUpdate, updateState } from './write';


export const createStore = <S>(
  args: OptionsForMakingAStore<S>
): Store<S> => {
  Object.freeze(args);
  validateState(args.state);
  const internals = {
    storeName: args.name,
    state: JSON.parse(JSON.stringify(args.state)),
    changeListeners: [],
    currentAction: { type: '' },
  } as StoreInternals<S>;
  const initialize = (s: any, topLevel: boolean, stateActions: StateAction[]): any => {
    if (typeof s !== 'object') { return null; }
    return new Proxy(s, {
      get: (target, prop: string) => {
        stateActions = topLevel ? new Array<StateAction>() : stateActions;
        if (topLevel && internals.nestedStoreInfo) {
          return libState.stores[internals.nestedStoreInfo.containerStoreName].nested[internals.nestedStoreInfo.storeName][internals.nestedStoreInfo.instanceName!][prop];
        } else if (topLevel && internals.mergedStoreInfo) {
          return (libState.stores[internals.mergedStoreInfo] as any)[prop];
        } else if (['replace', 'patch', 'deepMerge', 'remove', 'increment', 'removeAll', 'replaceAll', 'patchAll', 'incrementAll', 'insertOne', 'insertMany', 'withOne', 'withMany'].includes(prop)) {
          return processUpdate(args.name, stateActions, prop, args.batchActions);
        } else if ('invalidateCache' === prop) {
          return () => {
            const actionType = stateActions.map(sa => sa.actionType).join('.');
            const newStateActions = [
              { type: 'property', name: 'cache', actionType: 'cache' },
              { type: 'property', name: actionType, actionType: actionType },
              { type: 'action', name: 'remove', actionType: 'remove()' },
            ] as StateAction[];
            try {
              updateState({ storeName: args.name, batchActions: args.batchActions, stateActions: newStateActions });
            } catch (e) {
              /* This can happen if a cache has already expired */
            }
          }
        } else if ('internals' === prop) {
          return internals;
        } else if ('upsertMatching' === prop) {
          stateActions.push({ type: 'upsertMatching', name: prop, actionType: prop });
          return initialize({}, false, stateActions);
        } else if ('state' === prop) {
          return deepFreeze(readState(internals.state, [...stateActions, { type: 'action', name: prop }], { index: 0 }));
        } else if ('onChange' === prop) {
          return (changeListener: (arg: any) => any) => {
            const stateActionsCopy = [...stateActions, { type: 'action', name: prop }] as StateAction[];
            const element = { actions: stateActionsCopy, listener: changeListener };
            internals.changeListeners.push(element);
            return { unsubscribe: () => { internals.changeListeners.splice(internals.changeListeners.findIndex(e => e === element), 1); } }
          }
        } else if (['and', 'or'].includes(prop)) {
          stateActions.push({ type: 'searchConcat', name: prop, actionType: prop });
          return initialize({}, false, stateActions);
        } else if (['eq', 'ne', 'in', 'ni', 'gt', 'gte', 'lt', 'lte', 'match'].includes(prop)) {
          return (arg: any) => {
            stateActions.push({ type: 'comparator', name: prop, arg, actionType: `${prop}(${arg})` });
            return initialize({}, false, stateActions);
          }
        } else if (['find', 'filter'].includes(prop)) {
          stateActions.push({ type: 'search', name: prop, actionType: prop });
          return initialize({}, false, stateActions);
        } else if (augmentations.selection[prop]) {
          return augmentations.selection[prop](initialize({}, false, stateActions));
        } else {
          stateActions.push({ type: 'property', name: prop, actionType: prop });
          return initialize({}, false, stateActions);
        }
      }
    });
  };
  return libState.stores[args.name] = Object.assign(initialize({}, true, []));
}
