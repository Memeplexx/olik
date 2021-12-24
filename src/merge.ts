import { StoreLike } from '.';
import { errorMessages, libState } from './constant';
import { StoreInternal } from './type-internal';

export const mergeStoreIfPossible = <S>(
  arg: {
    store: StoreLike<S>,
    nameOfStoreToMergeInto: string,
  }
) => {
  const appStore = libState.appStores[arg.nameOfStoreToMergeInto];
  if (!appStore) { return; }
  const wrapperState = appStore.state;
  if (['number', 'boolean', 'string'].some(type => typeof (wrapperState) === type) || Array.isArray(wrapperState)) {
    throw new Error(errorMessages.INVALID_EXISTING_STORE_FOR_MERGING);
  }
  const state = arg.store.state;
  if (['number', 'boolean', 'string'].some(type => typeof (state) === type) || Array.isArray(state)) {
    throw new Error(errorMessages.INVALID_MERGING_STORE);
  }
  const internals = (arg.store as StoreInternal<any>).internals;
  delete libState.appStores[internals.storeName];
  const changeListeners = internals.changeListeners;
  internals.mergedStoreInfo = arg.nameOfStoreToMergeInto;
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