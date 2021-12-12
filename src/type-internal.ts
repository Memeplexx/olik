import { ChangeListeners, Store } from "./type"

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
  timestamp: number,
  type: string,
  payloads: any[],
  debounceTimeout: number,
}

export type StoreInternal<S> = Store<S> & {
  nested: any,
  setState(state: S): void,
  getState(): S,
  getChangeListeners(): ChangeListeners,
  getStoreName(): string,
  setNestedStoreInfo(info?: { storeName: string, instanceName: string | number, containerStoreName: string }): void,
}

export interface QuerySpec {
  query: (e: any) => boolean,
  concat: 'and' | 'or' | 'last'
};
