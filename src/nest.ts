import { errorMessages, libState } from './constant';
import { StateAction, Store } from './type';
import { StoreInternal } from './type-internal';

export const nestStoreIfPossible = (
  arg: {
    store: Store<any>,
    instanceName: string | number,
    containerStoreName: string,
  }
) => {
  const store = arg.store as StoreInternal<any>;
  const appStore = libState.appStores[arg.containerStoreName || document.title];
  if (!appStore) { return { detach: () => null }; }
  const wrapperState = appStore.read();
  if (['number', 'boolean', 'string'].some(type => typeof (wrapperState) === type) || Array.isArray(wrapperState)) {
    throw new Error(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
  }
  const nestedStoreName = store.getStoreName();
  appStore.nested[nestedStoreName][arg.instanceName].replace(store.read());
  Array.from(store.getChangeListeners().entries())
    .forEach(([stateActions, performAction]) => {
      let node = appStore.nested[nestedStoreName][arg.instanceName];
      stateActions.slice(0, stateActions.length - 1)
        .forEach(a => node = a.type === 'comparator' ? node[a.name](a.arg) : node[a.name]);
      node.onChange(performAction);
    });
  store.setNestedStoreInfo({ storeName: nestedStoreName, instanceName: arg.instanceName, containerStoreName: arg.containerStoreName });
  delete libState.appStores[nestedStoreName];
  return {
    detach: () => {
      const state = appStore.read().nested[nestedStoreName];
      if ((Object.keys(state).length === 1) && state[arg.instanceName]) {
        appStore.nested[nestedStoreName].remove();
      } else {
        appStore.nested[nestedStoreName][arg.instanceName].remove();
      }
      store.setNestedStoreInfo();
    }
  }
}
