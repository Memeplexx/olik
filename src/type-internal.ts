import { DeleteNode, DevtoolsAction, OnChange, SetNewNode, StateAction, BasicRecord } from './type';



export type StoreInternal 
  = SetNewNode
  & DeleteNode<1>
  & OnChange<unknown>
  & {
    [key in keyof BasicRecord]: StoreInternal & ((arg: unknown) => StoreInternal)
  }
  & {
    $state: BasicRecord
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
  fakeDevtoolsMessage: null | Omit<DevtoolsAction, 'source'>,
  currentActionType: undefined | string,
  currentActionTypeOrig: undefined | string,
  currentActionPayload: undefined | unknown,
}

export type Cursor = { index: number };
