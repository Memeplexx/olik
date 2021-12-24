import { StoreLike } from '.';
import { errorMessages, libState } from './constant';
import { NestStoreRef } from './type';
import { StoreInternal } from './type-internal';

export const nestStoreIfPossible = <S>(
  arg: {
    store: StoreLike<S>,
    instanceName: string | number,
    containerStoreName: string,
  }
): NestStoreRef => {
  const storeArg = arg.store as StoreInternal<any>;
  const appStore = libState.appStores[arg.containerStoreName || document.title];
  if (!appStore) { return { detach: () => null }; }
  const wrapperState = appStore.state;
  if (['number', 'boolean', 'string'].some(type => typeof (wrapperState) === type) || Array.isArray(wrapperState)) {
    throw new Error(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
  }
  const internals = storeArg.internals;
  const nestedStoreName = internals.storeName;
  appStore.nested[nestedStoreName][arg.instanceName].replace(storeArg.state);
  internals.changeListeners
    .forEach(({ actions, listener }) => {
      let node = appStore.nested[nestedStoreName][arg.instanceName];
      actions.slice(0, actions.length - 1)
        .forEach(a => node = a.type === 'comparator' ? node[a.name](a.arg) : node[a.name]);
      node.onChange(listener);
    })
  // TODO: delete old listeners?
  internals.nestedStoreInfo = { storeName: nestedStoreName, instanceName: arg.instanceName, containerStoreName: arg.containerStoreName };
  delete libState.appStores[nestedStoreName];
  return {
    detach: () => {
      const state = appStore.state.nested[nestedStoreName];
      if ((Object.keys(state).length === 1) && state[arg.instanceName]) {
        appStore.nested[nestedStoreName].remove();
      } else {
        appStore.nested[nestedStoreName][arg.instanceName].remove();
      }
      internals.nestedStoreInfo = undefined;
    }
  }
}
