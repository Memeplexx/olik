import { augmentations, libState, testState } from './constant';
import { readState } from './read';
import { OptionsForMakingAStore, StateAction, UpdatableArray, UpdatableObject, UpdatablePrimitive } from './type';
import { deepFreeze, validateState } from './utility';
import { processUpdate, updateState } from './write';


type Store<S> = Omit<S extends Array<any> ? UpdatableArray<S, 'isFilter', 'notQueried'>
  : S extends object ? UpdatableObject<S, 'isFind', 'queried'>
  : UpdatablePrimitive<S, 'isFind', 'queried'>, 'remove'>;
// NOTE: It seems necessary for the above copy of the Store<S> definition to exist here
// (rather than making use of the existing Store<S> definition) otherwise the typescript 
// compiler seems to inexplicably hang.

export const createStore = <S>(
  args: OptionsForMakingAStore<S>
): Store<S> => {
  validateState(args.state);
  testState.logLevel = 'none';
  const store = readSelector(args.name);
  store.setState(deepFreeze(args.state));
  libState.appStores[args.name] = store;
  return store;
}

const readSelector = (storeName: string) => {
  const changeListeners = new Map<StateAction[], (arg: any) => any>();
  let nestedStoreInfo: undefined | { instanceName?: string | number, containerStoreName: string, storeName: string };
  let state: any;
  const initialize = (s: any, topLevel: boolean, stateActions: StateAction[]): any => {
    if (typeof s !== 'object') { return null; }
    return new Proxy(s, {
      get: function (target, prop: string) {
        stateActions = topLevel ? new Array<StateAction>() : stateActions;
        if (topLevel && nestedStoreInfo) {
          return libState.appStores[nestedStoreInfo.containerStoreName].nested[nestedStoreInfo.storeName][nestedStoreInfo.instanceName!][prop];
        } else if (['replace', 'patch', 'deepMerge', 'remove', 'increment', 'removeAll', 'replaceAll', 'patchAll', 'incrementAll', 'insertOne', 'insertMany', 'withOne', 'withMany'].includes(prop)) {
          return processUpdate(storeName, stateActions, prop, changeListeners);
        } else if ('invalidateCache' === prop) {
          return () => {
            const actionType = stateActions.map(sa => sa.actionType).join('.');
            const newStateActions = [
              { type: 'property', name: 'cache', actionType: 'cache' },
              { type: 'property', name: actionType, actionType: actionType },
              { type: 'action', name: 'remove', actionType: 'remove()' },
            ] as StateAction[];
            try {
              updateState(storeName, newStateActions, changeListeners);
            } catch (e) {
              /* This can happen if a cache has already expired */
            }
          }
        } else if ('getChangeListeners' === prop) {
          return () => changeListeners;
        } else if ('getStoreName' === prop) {
          return () => storeName;
        } else if ('setNestedStoreInfo' === prop) {
          return (info: any) => nestedStoreInfo = info;
        } else if ('setState' === prop) {
          return (newState: any) => state = newState;
        } else if ('getState' === prop) {
          return () => state;
        } else if ('upsertMatching' === prop) {
          stateActions.push({ type: 'upsertMatching', name: prop, actionType: prop });
          return initialize({}, false, stateActions);
        } else if ('read' === prop) {
          return () => deepFreeze(readState(state, [...stateActions, { type: 'action', name: prop }], { index: 0 }));
        } else if ('onChange' === prop) {
          return (changeListener: (arg: any) => any) => {
            const stateActionsCopy = [...stateActions, { type: 'action', name: prop }] as StateAction[];
            changeListeners.set(stateActionsCopy, changeListener);
            return { unsubscribe: () => { changeListeners.delete(stateActionsCopy); } }
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
  return initialize({}, true, []);
}
