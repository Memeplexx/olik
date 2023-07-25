import { ChangeListener, DeleteNode, OlikAction, OlikDevtoolsExtension, OnChange, RecursiveRecord, SetNewNode } from './type';


export type WindowAugmentedWithOlikDevtools = {
  __OLIK_DEVTOOLS_EXTENSION__: OlikDevtoolsExtension;
}

export interface StoreInternals {
  state: RecursiveRecord,
  changeListeners: ChangeListener[],
  currentAction: OlikAction,
  initialState: RecursiveRecord,
  disableDevtoolsDispatch?: boolean;
}

export type StoreInternal 
  = RecursiveRecord
  & SetNewNode
  & DeleteNode<1>
  & OnChange<unknown>
  & {
    [key in keyof RecursiveRecord]: StoreInternal & ((arg: unknown) => StoreInternal)
  }
  & {
    $internals: StoreInternals,
  }
  & {
    $state: RecursiveRecord & { cache?: Record<string, string> };
  };

export interface QuerySpec {
  query: (e: unknown) => boolean,
  concat: '$and' | '$or' | '$last'
}

export type OlikDevtoolsExtensionInternal = {
  _mockInvokeSubscription: (message: { type: string, payload: unknown, state?: unknown, source: unknown }) => unknown,
  _subscribers: Array<(message: { type: string, payload: unknown, state?: unknown, source: unknown }) => unknown>,
} & OlikDevtoolsExtension;