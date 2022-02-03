import { StoreLike } from '.';
import { booleanNumberString, errorMessages, libState, testState } from './constant';
import { StoreInternal } from './type-internal';

export const importOlikNestingModule = () => {

  const complete = (store: any) => {
    store.$state = store.$state;
    store.$onChange((state: any) => store.$state = state);
    return store;
  }

  libState.nestStore = ({ containerName, storeName, instanceId }) => {
    const storeArg = libState.stores[storeName] as StoreInternal<any>;
    const appStore = libState.stores[containerName];
    const nestedStoreName = storeArg.$internals.storeName;
    if (!appStore) {
      delete libState.stores[storeName];
      const storeNameNew = `${nestedStoreName} | ${instanceId}`;
      libState.stores[storeNameNew] = storeArg;
      storeArg.$internals.storeName = storeNameNew;
      storeArg.$internals.nestedStoreInfo = { nestedStoreName: storeNameNew, instanceId, containerName, isNested: false };
      return complete(storeArg);
    }
    const wrapperState = appStore.$state;
    if (booleanNumberString.some(type => typeof (wrapperState) === type) || Array.isArray(wrapperState)) {
      throw new Error(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
    }
    appStore.nested[nestedStoreName][instanceId].$insert(storeArg.$state);
    delete libState.stores[nestedStoreName];
    storeArg.$internals.storeName = containerName;
    storeArg.$internals.nestedStoreInfo = { nestedStoreName: storeName, instanceId, containerName, isNested: true };
    return complete(storeArg);
  }

  libState.detachNestedStore = args => {
    const { containerName, instanceId, nestedStoreName } = args.nestedStoreInfo!;
    const hostStore = libState.stores[containerName];
    const state = hostStore.nested?.[nestedStoreName]?.$state;
    if (!state) { return; }
    if ((Object.keys(state).length === 1) && state[instanceId]) {
      hostStore.nested[nestedStoreName].$remove();
    } else {
      hostStore.nested[nestedStoreName][instanceId].$remove();
    }
    const changeListenerPath = `nested.${nestedStoreName}.${instanceId}.onChange`;
    hostStore.$internals.changeListeners
      .filter(c => c.actions.map(a => a.name).join('.') === changeListenerPath)
      .forEach(c => c.unsubscribe());
    args.nestedStoreInfo = undefined;
  }
}

