import { errorMessages, libState } from "./constant";
import { Readable, StateAction, Store } from "./type";

export const nestStoreIfPossible = (
  arg: {
    store: Readable<any>,
    instanceName: string | number,
    containerStoreName: string,
  }
) => {
  const appStore = libState.appStores[arg.containerStoreName || document.title] as any;
  if (!appStore) { return { detach: () => null }; }
  const wrapperState = appStore.read();
  if (['number', 'boolean', 'string'].some(type => typeof (wrapperState) === type) || Array.isArray(wrapperState)) {
    throw new Error(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
  }
  const nestedStoreName = (arg.store as any).getStoreName();
  appStore.cmp[nestedStoreName][arg.instanceName].replace(arg.store.read());
  Array.from(((arg.store as any).getChangeListeners() as Map<StateAction[], (arg: any) => any>).entries())
    .forEach(([stateActions, performAction]) => {
      let node = appStore.cmp[nestedStoreName][arg.instanceName];
      stateActions.slice(0, stateActions.length - 1).forEach(a => {
        if (a.type === 'comparator') {
          node = node[a.name](a.arg)
        } else { /* must be of type 'search' or 'property */
          node = node[a.name];
        }
      });
      node.onChange(performAction);
    });
  (arg.store as any).setNestedStoreInfo({ storeName: nestedStoreName, instanceName: arg.instanceName, containerStoreName: arg.containerStoreName });
  delete libState.appStores[nestedStoreName];
  return {
    detach: () => {
      const state = appStore.read().cmp[nestedStoreName];
      if ((Object.keys(state).length === 1) && state[arg.instanceName]) {
        appStore.cmp[nestedStoreName].remove();
      } else {
        appStore.cmp[nestedStoreName][arg.instanceName].remove();
      }
      (arg.store as any).setNestedStoreInfo();
    }
  }
}
