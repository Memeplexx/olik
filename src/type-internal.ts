import { Actual, DeleteNode, OlikDevtoolsExtension, OnChange, SetNewNode, StateAction } from './type';


export type WindowAugmentedWithOlikDevtools = {
  __OLIK_DEVTOOLS_EXTENSION__: OlikDevtoolsExtension;
}

export type StoreInternal 
  = Record<string, unknown>
  & SetNewNode
  & DeleteNode<1>
  & OnChange<unknown>
  & {
    [key in keyof Record<string, unknown>]: StoreInternal & ((arg: unknown) => StoreInternal)
  }
  & {
    $state: Record<string, unknown> & { cache?: Record<string, string> };
  }
  & {
    $stateActions: StateAction[],
  };

export interface QuerySpec {
  query: (e: unknown) => boolean,
  concat: '$and' | '$or' | '$last'
}

export type OlikDevtoolsExtensionInternal = {
  _mockInvokeSubscription: (message: { type: string, payload: unknown, state?: unknown, source: unknown }) => unknown,
  _subscribers: Array<(message: { type: string, payload: unknown, state?: unknown, source: unknown }) => unknown>,
} & OlikDevtoolsExtension;

export type CopyNewStateArgs = {
  currentState: unknown,
  stateToUpdate: Actual,
  stateActions: ReadonlyArray<StateAction>,
  cursor: { index: number }
}