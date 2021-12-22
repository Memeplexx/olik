import { augmentations, libState } from './constant';
import { readState } from './read';
import { ChangeListener, OptionsForMakingAStore, StateAction, Store } from './type';
import { NestedStoreInfo } from './type-internal';
import { deepFreeze, validateState } from './utility';
import { processUpdate, updateState } from './write';


export const createStore = <S>(
  args: OptionsForMakingAStore<S>
): Store<S> => {
  validateState(args.state);
  const changeListeners = new Array<ChangeListener>();
  let nestedStoreInfo: undefined | NestedStoreInfo;
  let mergedStoreInfo: undefined | string;
  let state = JSON.parse(JSON.stringify(args.state));
  let name = args.name;
  const initialize = (s: any, topLevel: boolean, stateActions: StateAction[]): any => {
    if (typeof s !== 'object') { return null; }
    return new Proxy(s, {
      get: function (target, prop: string) {
        stateActions = topLevel ? new Array<StateAction>() : stateActions;
        if (topLevel && nestedStoreInfo) {
          return libState.appStores[nestedStoreInfo.containerStoreName].nested[nestedStoreInfo.storeName][nestedStoreInfo.instanceName!][prop];
        } else if (topLevel && mergedStoreInfo) {
          return (libState.appStores[mergedStoreInfo] as any)[prop];
        } else if (['replace', 'patch', 'deepMerge', 'remove', 'increment', 'removeAll', 'replaceAll', 'patchAll', 'incrementAll', 'insertOne', 'insertMany', 'withOne', 'withMany'].includes(prop)) {
          return processUpdate(name, stateActions, prop, changeListeners);
        } else if ('invalidateCache' === prop) {
          return () => {
            const actionType = stateActions.map(sa => sa.actionType).join('.');
            const newStateActions = [
              { type: 'property', name: 'cache', actionType: 'cache' },
              { type: 'property', name: actionType, actionType: actionType },
              { type: 'action', name: 'remove', actionType: 'remove()' },
            ] as StateAction[];
            try {
              updateState(name, newStateActions, changeListeners);
            } catch (e) {
              /* This can happen if a cache has already expired */
            }
          }
        } else if ('getChangeListeners' === prop) {
          return () => changeListeners;
        } else if ('setMergedStoreInfo' === prop) {
          return (info: string) => mergedStoreInfo = info;
        } else if ('getStoreName' === prop) {
          return () => name;
        } else if ('setNestedStoreInfo' === prop) {
          return (info: NestedStoreInfo) => nestedStoreInfo = info;
        } else if ('getNestedStoreInfo' === prop) {
          return () => nestedStoreInfo;
        } else if ('setState' === prop) {
          return (newState: any) => state = newState;
        } else if ('upsertMatching' === prop) {
          stateActions.push({ type: 'upsertMatching', name: prop, actionType: prop });
          return initialize({}, false, stateActions);
        } else if ('state' === prop) {
          return deepFreeze(readState(state, [...stateActions, { type: 'action', name: prop }], { index: 0 }));
        } else if ('onChange' === prop) {
          return (changeListener: (arg: any) => any) => {
            const stateActionsCopy = [...stateActions, { type: 'action', name: prop }] as StateAction[];
            const element = { actions: stateActionsCopy, listener: changeListener };
            changeListeners.push(element);
            return { unsubscribe: () => { changeListeners.splice(changeListeners.findIndex(e => e === element), 1); } }
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
  return libState.appStores[args.name] = initialize({}, true, []);
}
