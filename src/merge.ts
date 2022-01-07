import { errorMessages, libState } from './constant';
import { OptionsForMergingAStore } from './type';
import { StoreInternal } from './type-internal';

export const mergeStoreIfPossible = <S>(
  { store, nameOfStoreToMergeInto }: OptionsForMergingAStore<S>
) => {
  const appStore = libState.stores[nameOfStoreToMergeInto];
  const state = store.state;
  const internals = (store as StoreInternal<any>).internals;
  internals.mergedStoreInfo = { nameOfStoreToMergeInto, isMerged: !!appStore };
  if (!appStore) { return; }
  const wrapperState = appStore.state;
  if (['number', 'boolean', 'string'].some(type => typeof (wrapperState) === type) || Array.isArray(wrapperState)) {
    throw new Error(errorMessages.INVALID_EXISTING_STORE_FOR_MERGING);
  }
  if (['number', 'boolean', 'string'].some(type => typeof (state) === type) || Array.isArray(state)) {
    throw new Error(errorMessages.INVALID_MERGING_STORE);
  }
  delete libState.stores[internals.storeName];
  const changeListeners = internals.changeListeners;
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