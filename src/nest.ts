import { StoreLike } from '.';
import { errorMessages, libState } from './constant';
import { StoreInternal } from './type-internal';

export const importOlikNestingModule = () => {

  const complete = (store: any) => {
    store.state = store.state;
    store.onChange((state: any) => store.state = state);
    return store;
  }

  libState.nestStore = ({ containerName, storeName, instanceId }) => {
    const storeArg = libState.stores[storeName] as StoreInternal<any>;
    const appStore = libState.stores[containerName];
    const nestedStoreName = storeArg.internals.storeName;
    if (!appStore) {
      delete libState.stores[storeName];
      const storeNameNew = `${nestedStoreName} | ${instanceId}`;
      libState.stores[storeNameNew] = storeArg;
      storeArg.internals.storeName = storeNameNew;
      storeArg.internals.nestedStoreInfo = { nestedStoreName: storeNameNew, instanceId, containerName, isNested: false };
      return complete(storeArg);
    }
    const wrapperState = appStore.$state;
    if (['number', 'boolean', 'string'].some(type => typeof (wrapperState) === type) || Array.isArray(wrapperState)) {
      throw new Error(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
    }
    appStore.nested[nestedStoreName].$insert({ [instanceId]: storeArg.$state });
    // appStore.nested[nestedStoreName][instanceId].$insert(storeArg.$state);
    delete libState.stores[nestedStoreName];
    storeArg.internals.storeName = containerName;
    storeArg.internals.nestedStoreInfo = { nestedStoreName: storeName, instanceId, containerName, isNested: true };
    return complete(storeArg);
  }

  libState.detachNestedStore = store => {
    const storeArg = store as StoreInternal<any>;
    if (!storeArg.internals.nestedStoreInfo?.isNested) { return; }
    const appStore = libState.stores[storeArg.internals.nestedStoreInfo?.containerName];
    const nestedStoreName = storeArg.internals.nestedStoreInfo.nestedStoreName;
    const instanceId = storeArg.internals.nestedStoreInfo.instanceId
    const state = appStore.$state.nested[nestedStoreName];
    if ((Object.keys(state).length === 1) && state[instanceId]) {
      appStore.nested[nestedStoreName].$remove();
    } else {
      appStore.nested[nestedStoreName][instanceId].$remove();
    }
    storeArg.internals.nestedStoreInfo = undefined;
  }
}

export const detachNestedStore = (store: StoreLike<any>) => libState.detachNestedStore?.(store);
