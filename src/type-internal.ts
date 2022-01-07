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

export interface BatchedAction {
  type: string,
  payloads: any[],
  timeoutHandle: number,
}

export interface NestedStoreInfo {
  storeName: string,
  instanceName: string | number,
  containerName: string,
  isNested: boolean,
}

export interface MergedStoreInfo {
  nameOfStoreToMergeInto: string,
  isMerged: boolean;
}

export interface StoreInternals<S> {
  storeName: string,
  state: S,
  changeListeners: ChangeListener[],
  nestedStoreInfo?: NestedStoreInfo,
  mergedStoreInfo?: MergedStoreInfo;
  currentAction: { [key: string]: any },
  batchedAction: BatchedAction,
  reduxDevtools?: {
    instance: DevtoolsInstance,
    dispatcher: (action: any) => any,
    disableDispatch: boolean,
  },
}

export type StoreInternal<S> = StoreLike<S> & {
  nested: any,
  internals: StoreInternals<S>,
};

export interface QuerySpec {
  query: (e: any) => boolean,
  concat: 'and' | 'or' | 'last'
};
