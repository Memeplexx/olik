import { DeepMerge } from './type';
import { booleanNumberString, errorMessages, libState } from './constant';
import { OptionsForMergingAStore } from './type';
import { StoreInternal } from './type-internal';

export const mergeStoreIfPossible = <S>(
  { store, nameOfStoreToMergeInto }: OptionsForMergingAStore<S>
) => {
  const existingStore = libState.stores[nameOfStoreToMergeInto];
  const state = store.$state;
  const internals = (store as StoreInternal<any>).$internals;
  internals.mergedStoreInfo = { nameOfStoreToMergeInto, isMerged: !!existingStore };
  if (!existingStore) { return; }
  const wrapperState = existingStore.$state;
  const stateIsInvalid = (s: any) => booleanNumberString.some(type => typeof (s) === type) || Array.isArray(s);
  if (stateIsInvalid(wrapperState)) {
    throw new Error(errorMessages.INVALID_EXISTING_STORE_FOR_MERGING);
  }
  if (stateIsInvalid(state)) {
    throw new Error(errorMessages.INVALID_MERGING_STORE);
  }
  delete libState.stores[internals.storeName];
  const changeListeners = internals.changeListeners;
  changeListeners
    .forEach(({ actions, listener }) => {
      let node = existingStore as any;
      actions.slice(0, actions.length - 1)
        .forEach(a => node = a.type === 'comparator' ? node[a.name](a.arg) : node[a.name]);
      node.$onChange(listener);
    });
    changeListeners.length = 0;
  (existingStore as any as DeepMerge<any>).$deepMerge(state);
}