import { libState } from './constant';
import { Store } from './type';
import { StoreInternal } from './type-internal';

export const mergeStoreIfPossible = (
  store: Store<any>,
  nameOfStoreToMergeInto: string
) => {
  const state = store.read();
  const storeArg = (store as StoreInternal<any>);
  storeArg.setStoreName(nameOfStoreToMergeInto);
  delete libState.appStores[storeArg.getStoreName()];

  const appStore = libState.appStores[nameOfStoreToMergeInto];

  Array.from(storeArg.getChangeListeners().entries())
    .forEach(([stateActions, performAction]) => {
      let node = appStore as any;
      stateActions.slice(0, stateActions.length - 1)
        .forEach(a => node = a.type === 'comparator' ? node[a.name](a.arg) : node[a.name]);
      node.onChange(performAction);
    });

  (appStore as any).deepMerge(state);
}