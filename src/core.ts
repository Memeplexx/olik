import { augmentations, errorMessages, libState } from './constant';
import { integrateStoreWithReduxDevtools } from './devtools';
import { readState } from './read';
import { Deferred, OptionsForMakingAComponentStore, OptionsForMakingAnApplicationStore, StateAction, Store, ComponentStore } from './type';
import { deepFreeze } from './utility';
import { processUpdate, updateState } from './write';

export const createApplicationStore = <S>(
  initialState: S,
  options: OptionsForMakingAnApplicationStore
    = { name: document.title, replaceExistingStoreIfItExists: true, disabledDevtoolsIntegration: false }
): Store<S> => {
  libState.appStates[options.name!] = deepFreeze(initialState);
  libState.logLevel = 'none';
  const store = readSelector(options.name!);
  if ((!libState.appStores[options.name!] || options.replaceExistingStoreIfItExists) && !options.disabledDevtoolsIntegration) {
    integrateStoreWithReduxDevtools({ store, devtools: { name: options.name } })
  }
  libState.appStores[options.name!] = store;
  return store;
}

export const createComponentStore = <L>(
  state: L,
  options: OptionsForMakingAComponentStore,
): ComponentStore<L> => {
  if (!options.applicationStoreName) { options.applicationStoreName = document.title };
  const appStore = libState.appStores[options.applicationStoreName!] as any;
  const removeFromApplicationStore = () => {
    const state = appStore.read().cmp[options.componentName];
    if ((Object.keys(state).length === 1) && state[options.instanceName!]) {
      appStore.cmp[options.componentName].remove();
    } else {
      appStore.cmp[options.componentName][options.instanceName].remove();
    }
  }
  if (!libState.appStores[options.applicationStoreName]) {
    const devtoolsStoreName = `${options.componentName} : ${options.instanceName as string}`;
    return createApplicationStore(state, { name: devtoolsStoreName }) as any as ComponentStore<L>;
  } else if (options.instanceName === Deferred) {
    const componentStore = createApplicationStore(state, { disabledDevtoolsIntegration: true }) as any as ComponentStore<L>;
    return new Proxy({}, {
      get: function (target, prop: string) {
        if ('removeFromApplicationStore' === prop) {
          removeFromApplicationStore();
        } else if ('setDeferredInstanceName' === prop) {
          return (instanceName: string | number) => {
            appStore.cmp[options.componentName][instanceName].replace(componentStore.read());
            Array.from(((componentStore as any).getChangeListeners() as Map<StateAction[], (arg: any) => any>).entries())
              .forEach(([stateActions, performAction]) => {
                let node = appStore.cmp[options.componentName][instanceName];
                stateActions.slice(0, stateActions.length - 1).forEach(a => {
                  if (a.type === 'comparator') {
                    node = node[a.name](a.arg)
                  } else { /* must be of type 'search' or 'property */
                    node = node[a.name];
                  }
                }); 
                node.onChange(performAction);
              });
            options.instanceName = instanceName;
          }
        } else if (options.instanceName === Deferred) {
          return (componentStore as any)[prop];
        }
        return appStore.cmp[options.componentName][options.instanceName][prop];
      }
    }) as ComponentStore<L>;
  } else {
    const wrapperState = appStore.read();
    if (['number', 'boolean', 'string'].some(type => typeof (wrapperState) === type) || Array.isArray(wrapperState)) {
      throw new Error(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
    }
    appStore.cmp[options.componentName][options.instanceName].replace(state);
    return new Proxy({}, {
      get: function (target, prop: string) {
        if (prop === 'removeFromApplicationStore') {
          removeFromApplicationStore();
        }
        return appStore.cmp[options.componentName][options.instanceName][prop];
      }
    }) as ComponentStore<L>;
  }
}

const readSelector = (storeName: string) => {
  const changeListeners = new Map<StateAction[], (arg: any) => any>();
  const initialize = (s: any, topLevel: boolean, stateActions: StateAction[]): any => {
    if (typeof s !== 'object') { return null as any; }
    return new Proxy(s, {
      get: function (target, prop: string) {
        stateActions = topLevel ? new Array<StateAction>() : stateActions;
        if (['replace', 'patch', 'deepMerge', 'remove', 'increment', 'removeAll', 'replaceAll', 'patchAll', 'incrementAll', 'insertOne', 'insertMany', 'withOne', 'withMany'].includes(prop)) {
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
        } else if ('removeFromApplicationStore' === prop) {
          return () => { /* no-op */ }
        } else if ('getChangeListeners' === prop) {
          return () => changeListeners;
        } else if ('upsertMatching' === prop) {
          stateActions.push({ type: 'upsertMatching', name: prop, actionType: prop });
          return initialize({}, false, stateActions);
        } else if ('read' === prop) {
          return () => deepFreeze(readState(libState.appStates[storeName], [...stateActions, { type: 'action', name: prop }], { index: 0 }));
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
