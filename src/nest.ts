import { errorMessages, libState } from './constant';
import { NestStoreRef, OptionsForNestedAStore } from './type';
import { StoreInternal } from './type-internal';

export const nestStoreIfPossible = <S>(
  { store, instanceName, containerName }: OptionsForNestedAStore<S>,
): NestStoreRef => {
  const storeArg = store as StoreInternal<any>;
  const nestedState = storeArg.state;
  const appStore = libState.stores[containerName || document.title];
  const internals = storeArg.internals;
  const nestedStoreName = internals.storeName;
  internals.nestedStoreInfo = { storeName: nestedStoreName, instanceName, containerName, isNested: !!appStore };
  if (!appStore) {
    delete libState.stores[nestedStoreName];
    const storeName = `${nestedStoreName} | ${instanceName}`;
    storeArg.internals.storeName = storeName;
    libState.stores[storeName] = storeArg;
    return { detach: () => null };
  }
  const wrapperState = appStore.state;
  if (['number', 'boolean', 'string'].some(type => typeof (wrapperState) === type) || Array.isArray(wrapperState)) {
    throw new Error(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
  }
  appStore.nested[nestedStoreName][instanceName].replace(nestedState);
  internals.changeListeners
    .forEach(({ actions, listener }) => {
      let node = appStore.nested[nestedStoreName][instanceName];
      actions.slice(0, actions.length - 1)
        .forEach(a => node = a.type === 'comparator' ? node[a.name](a.arg) : node[a.name]);
      node.onChange(listener);
    })
  // TODO: delete old listeners?
  delete libState.stores[nestedStoreName];
  return {
    detach: () => {
      const state = appStore.state.nested[nestedStoreName];
      if ((Object.keys(state).length === 1) && state[instanceName]) {
        appStore.nested[nestedStoreName].remove();
      } else {
        appStore.nested[nestedStoreName][instanceName].remove();
      }
      internals.nestedStoreInfo = undefined;
    }
  }
}
