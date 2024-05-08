import { DeleteNode, DevtoolsAction, OnChange, SetNewNode, StateAction, ValidJson, ValidJsonObject } from './type';



export type StoreInternal 
  = ValidJson
  & SetNewNode
  & DeleteNode<1>
  & OnChange<unknown>
  & {
    [key in keyof ValidJsonObject]: StoreInternal & ((arg: unknown) => StoreInternal)
  }
  & {
    $state: ValidJsonObject
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
  currentActionPayloadPaths?: Record<string, string>,
}

export type Cursor = { index: number };
