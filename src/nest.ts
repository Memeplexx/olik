import { StoreLike } from '.';
import { errorMessages, libState } from './constant';
import { StoreInternal } from './type-internal';

export const enableNesting = () => {

  const complete = (store: any) => {
    store.state = store.state;
    store.onChange((state: any) => store.state = state );
    return store;
  }

  libState.nestStore = ({ containerName, storeName }) => {
    const storeArg = libState.stores[storeName] as StoreInternal<any>;
    const nestedState = storeArg.state;
    const appStore = libState.stores[containerName || document.title];
    const nestedStoreName = storeArg.internals.storeName;
    let instanceId = 0;
    if (appStore?.state?.nested?.[storeName]) {
      const keys = Array.from(Object.keys(appStore.state.nested[storeName])) as any as number[];
      instanceId = !keys.length ? 0 : +(keys.sort((a, b) => b - a)[0]) + 1;
    }
    storeArg.internals.nestedStoreInfo = { storeName: nestedStoreName, instanceId, containerName, isNested: !!appStore };
    if (!appStore) {
      delete libState.stores[nestedStoreName];
      const storeName = `${nestedStoreName} | ${instanceId}`;
      storeArg.internals.storeName = storeName;
      libState.stores[storeName] = storeArg;
      return complete(storeArg);
    }
    const wrapperState = appStore.state;
    if (['number', 'boolean', 'string'].some(type => typeof (wrapperState) === type) || Array.isArray(wrapperState)) {
      throw new Error(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
    }
    appStore.nested[nestedStoreName][instanceId].replace(nestedState);
    delete libState.stores[nestedStoreName];
    return complete(storeArg);
  }

  libState.detachNestedStore = store => {
    const storeArg = store as StoreInternal<any>;
    if (!storeArg.internals.nestedStoreInfo?.isNested) { return; }
    const appStore = libState.stores[storeArg.internals.nestedStoreInfo?.containerName];
    const nestedStoreName = storeArg.internals.storeName;
    const instanceName = storeArg.internals.nestedStoreInfo.instanceId
    const state = appStore.state.nested[nestedStoreName];
    if ((Object.keys(state).length === 1) && state[instanceName]) {
      appStore.nested[nestedStoreName].remove();
    } else {
      appStore.nested[nestedStoreName][instanceName].remove();
    }
    storeArg.internals.nestedStoreInfo = undefined;
  }
}

export const detachNestedStore = (store: StoreLike<any>) => libState.detachNestedStore?.(store);
