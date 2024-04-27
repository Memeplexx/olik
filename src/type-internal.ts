import { DeleteNode, DevtoolsAction, OnChange, SetNewNode, StateAction } from './type';



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

export type TestState = {
  logLevel: 'debug' | 'none',
  isTest: boolean,
  isPerf: boolean,
  fakeDevtoolsMessage: null | Omit<DevtoolsAction, 'source'>,
  currentActionType: undefined | string,
  currentActionTypeOrig: undefined | string,
  currentActionPayload: undefined | unknown,
  currentActionPayloadPaths?: Record<string, string>,
}

export type Cursor = { index: number };
