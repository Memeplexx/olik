import { Store } from '.';
import { errorMessages, libState } from './constant';
import { StoreInternal } from './type-internal';

export const mergeStoreIfPossible = <S>(
  store: Store<S>,
  nameOfStoreToMergeInto: string
) => {
  const appStore = libState.appStores[nameOfStoreToMergeInto];
  if (!appStore) { return; }
  const wrapperState = appStore.read();
  if (['number', 'boolean', 'string'].some(type => typeof (wrapperState) === type) || Array.isArray(wrapperState)) {
    throw new Error(errorMessages.INVALID_EXISTING_STORE_FOR_MERGING);
  }
  const state = store.read();
  if (['number', 'boolean', 'string'].some(type => typeof (state) === type) || Array.isArray(state)) {
    throw new Error(errorMessages.INVALID_MERGING_STORE);
  }
  const storeArg = (store as any as StoreInternal<any>);
  delete libState.appStores[storeArg.getStoreName()];
  const changeListeners = storeArg.getChangeListeners();
  storeArg.setMergedStoreInfo(nameOfStoreToMergeInto);
  changeListeners
    .forEach(({ actions, listener }) => {
      let node = appStore as any;
      actions.slice(0, actions.length - 1)
        .forEach(a => node = a.type === 'comparator' ? node[a.name](a.arg) : node[a.name]);
      node.onChange(listener);
    });
    changeListeners.length = 0;
  (appStore as any).deepMerge(state);
}