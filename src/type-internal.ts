import { ChangeListener, DeleteNode, OlikAction, OlikDevtoolsExtension, OnChange, RecursiveRecord, SetNewNode } from './type';


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

export interface StoreInternals<S extends RecursiveRecord> {
  state: S,
  changeListeners: ChangeListener[],
  nestedStoreInfo?: NestedStoreInfo,
  mergedStoreInfo?: MergedStoreInfo;
  currentAction: OlikAction,
  initialState: S;
  // olikDevtools?: {
  //   instance: DevtoolsInstance,
  //   disableDispatch: boolean,
  // },
}

export type StoreInternal 
  = RecursiveRecord
  & SetNewNode
  & DeleteNode<1>
  & OnChange<unknown>
  & {
    [key in keyof RecursiveRecord]: StoreInternal & ((arg: unknown) => unknown)
  }
  & {
    $internals: StoreInternals<RecursiveRecord>,
  }
  & {
    $state: RecursiveRecord & { cache: Record<string, string> };
  };

export interface QuerySpec {
  query: (e: unknown) => boolean,
  concat: 'and' | 'or' | 'last'
}

export type OlikDevtoolsExtensionInternal = {
  _mockInvokeSubscription: (message: { type: string, payload: unknown, state?: unknown, source: unknown }) => unknown,
  _subscribers: Array<(message: { type: string, payload: unknown, state?: unknown, source: unknown }) => unknown>,
} & OlikDevtoolsExtension;