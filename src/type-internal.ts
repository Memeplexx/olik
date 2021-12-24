import { ChangeListener, Read, StoreLike } from "./type"

export type DevtoolsInstance = {
  init: (state: any) => any,
  subscribe: (listener: (message: { type: string, payload: any, state?: any, source: string }) => any) => any,
  unsubscribe: () => any,
  send: (action: { }, state: any) => any
}

export type WindowAugmentedWithReduxDevtools = {
  __REDUX_DEVTOOLS_EXTENSION__: {
    connect: (options?: any) => DevtoolsInstance;
    disconnect: () => any;
    send: (action: { type: string, payload?: any }, state: any, options: { name: string }) => any;
    _mockInvokeSubscription: (message: { type: string, payload: any, state?: any, source: any }) => any,
    _subscribers: Array<(message: { type: string, payload: any, state?: any, source: any }) => any>,
  }
}

export interface PreviousAction {
  type: string,
  payloads: any[],
  timeoutHandle: number,
}

export interface NestedStoreInfo {
  storeName: string,
  instanceName: string | number,
  containerStoreName: string,
}

export type StoreInternal<S> = StoreLike<S> & {
  nested: any,
  setState(state: S): void,
  getChangeListeners(): ChangeListener[],
  getStoreName(): string,
  setNestedStoreInfo(info?: NestedStoreInfo): void,
  getNestedStoreInfo(): NestedStoreInfo | undefined,
  setMergedStoreInfo(info: string): void,
  getCurrentAction(): { [key: string]: any },
  setCurrentAction(action: { [key: string]: any }): void,
  getReduxDevtoolsInstance(): DevtoolsInstance,
  setReduxDevtoolsInstance(instance: DevtoolsInstance): void,
};

export interface QuerySpec {
  query: (e: any) => boolean,
  concat: 'and' | 'or' | 'last'
};
