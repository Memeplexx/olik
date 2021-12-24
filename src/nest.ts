import { errorMessages, libState } from './constant';
import { NestStoreRef, OptionsForNestedAStore } from './type';
import { StoreInternal } from './type-internal';

export const nestStoreIfPossible = <S>(
  { store, instanceName, containerStoreName }: OptionsForNestedAStore<S>,
): NestStoreRef => {
  const storeArg = store as StoreInternal<any>;
  const appStore = libState.stores[containerStoreName || document.title];
  if (!appStore) { return { detach: () => null }; }
  const wrapperState = appStore.state;
  if (['number', 'boolean', 'string'].some(type => typeof (wrapperState) === type) || Array.isArray(wrapperState)) {
    throw new Error(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
  }
  const internals = storeArg.internals;
  const nestedStoreName = internals.storeName;
  appStore.nested[nestedStoreName][instanceName].replace(storeArg.state);
  internals.changeListeners
    .forEach(({ actions, listener }) => {
      let node = appStore.nested[nestedStoreName][instanceName];
      actions.slice(0, actions.length - 1)
        .forEach(a => node = a.type === 'comparator' ? node[a.name](a.arg) : node[a.name]);
      node.onChange(listener);
    })
  // TODO: delete old listeners?
  internals.nestedStoreInfo = { storeName: nestedStoreName, instanceName, containerStoreName };
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
