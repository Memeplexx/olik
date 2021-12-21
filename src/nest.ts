import { errorMessages, libState } from './constant';
import { NestStoreRef, Store } from './type';
import { StoreInternal } from './type-internal';

export const nestStoreIfPossible = <S>(
  store: Store<S>,
  arg: {
    instanceName: string | number,
    containerStoreName: string,
  }
): NestStoreRef => {
  const storeArg = store as any as StoreInternal<any>;
  const appStore = libState.appStores[arg.containerStoreName || document.title];
  if (!appStore) { return { detach: () => null }; }
  const wrapperState = appStore.read();
  if (['number', 'boolean', 'string'].some(type => typeof (wrapperState) === type) || Array.isArray(wrapperState)) {
    throw new Error(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
  }
  const nestedStoreName = storeArg.getStoreName();
  appStore.nested[nestedStoreName][arg.instanceName].replace(storeArg.read());
  storeArg.getChangeListeners()
    .forEach(({ actions, listener }) => {
      let node = appStore.nested[nestedStoreName][arg.instanceName];
      actions.slice(0, actions.length - 1)
        .forEach(a => node = a.type === 'comparator' ? node[a.name](a.arg) : node[a.name]);
      node.onChange(listener);
    })
  // TODO: delete old listeners?
  storeArg.setNestedStoreInfo({ storeName: nestedStoreName, instanceName: arg.instanceName, containerStoreName: arg.containerStoreName });
  delete libState.appStores[nestedStoreName];
  return {
    detach: () => {
      const state = appStore.read().nested[nestedStoreName];
      if ((Object.keys(state).length === 1) && state[arg.instanceName]) {
        appStore.nested[nestedStoreName].remove();
      } else {
        appStore.nested[nestedStoreName][arg.instanceName].remove();
      }
      storeArg.setNestedStoreInfo();
    }
  }
}
