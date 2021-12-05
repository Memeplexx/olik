import { augmentations, libState } from './constant';
import { integrateStoreWithReduxDevtools } from './devtools';
import { readState } from './read';
import { OptionsForMakingAComponentStore, OptionsForMakingAnApplicationStore, StateAction, Store } from './type';
import { processUpdate, updateState } from './write';

export const createApplicationStore = <S>(
  initialState: S, 
  options: OptionsForMakingAnApplicationStore = { name: document.title, replaceExistingStoreIfItExists: true }
): Store<S> => {
  libState.appStates[options.name] = initialState;
  libState.changeListeners[options.name] = new Map();
  libState.logLevel = 'none';
  const store = readSelector(options.name);
  if (!libState.appStores[options.name] || options.replaceExistingStoreIfItExists) {
    integrateStoreWithReduxDevtools({ store, devtools: { name: options.name } })
  }
  libState.appStores[options.name] = store;
  return store;
}

export const createComponentStore = <L>(
  state: L,
  options: OptionsForMakingAComponentStore,
) => {
  
}

const readSelector = (storeName: string) => {
  const initialize = (s: any, topLevel: boolean, stateActions: StateAction[]): any => {
    if (typeof s !== 'object') { return null as any; }
    return new Proxy(s, {
      get: function (target, prop: string) {
        stateActions = topLevel ? new Array<StateAction>() : stateActions;
        if (['replace', 'patch', 'remove', 'increment', 'removeAll', 'replaceAll', 'patchAll', 'incrementAll', 'insertOne', 'insertMany', 'withOne', 'withMany'].includes(prop)) {
          return processUpdate(storeName, stateActions, prop);
        } else if ('invalidateCache' === prop) {
          return () => {
            const actionType = stateActions.map(sa => sa.actionType).join('.');
            updateState(storeName, [
              { type: 'property', name: 'cache', actionType: 'cache' },
              { type: 'property', name: actionType, actionType: actionType },
              { type: 'action', name: 'remove', actionType: 'remove()' },
            ]);
          }
        } else if ('upsertMatching' === prop) {
          stateActions.push({ type: 'upsertMatching', name: prop, actionType: prop });
          return initialize({}, false, stateActions);
        } else if ('read' === prop) {
          return () => readState(libState.appStates[storeName], [...stateActions, { type: 'action', name: prop }], { index: 0 }, true)
        } else if ('onChange' === prop) {
          return (changeListener: (arg: any) => any) => {
            const stateActionsCopy = [...stateActions, { type: 'action', name: prop }] as StateAction[];
            libState.changeListeners[storeName].set(stateActionsCopy, changeListener);
            return { unsubscribe: () => { libState.changeListeners[storeName].delete(stateActionsCopy); } }
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
