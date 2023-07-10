import { ChangeListener, DevtoolsInstance, OlikAction, OlikDevtoolsExtension, StoreLike } from './type';


export type WindowAugmentedWithOlikDevtools = {
  __OLIK_DEVTOOLS_EXTENSION__: OlikDevtoolsExtension;
}

export interface NestedStoreInfo {
  nestedStoreName: string,
  instanceId: number | string,
  isNested: boolean,
}

export interface MergedStoreInfo {
  isMerged: boolean;
}

export interface StoreInternals<S> {
  state: S,
  changeListeners: ChangeListener[],
  nestedStoreInfo?: NestedStoreInfo,
  mergedStoreInfo?: MergedStoreInfo;
  currentAction: OlikAction,
  initialState: any;
  // olikDevtools?: {
  //   instance: DevtoolsInstance,
  //   disableDispatch: boolean,
  // },
}

export type StoreInternal<S> = StoreLike<S> & {
  nested: any,
  $internals: StoreInternals<S>,
}

export interface QuerySpec {
  query: (e: any) => boolean,
  concat: 'and' | 'or' | 'last'
}

export type OlikDevtoolsExtensionInternal = {
  _mockInvokeSubscription: (message: { type: string, payload: any, state?: any, source: any }) => any,
  _subscribers: Array<(message: { type: string, payload: any, state?: any, source: any }) => any>,
} & OlikDevtoolsExtension;