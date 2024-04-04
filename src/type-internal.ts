import { Actual, DeleteNode, DevtoolsAction, OnChange, SetNewNode, StateAction } from './type';



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

export type CopyNewStateArgs = {
  currentState: unknown,
  stateToUpdate: Actual,
  stateActions: ReadonlyArray<StateAction>,
  cursor: { index: number }
}

export type CopyNewStateArgsAndPayload = CopyNewStateArgs & {
  payloadStringified?: unknown,
  payloadSanitized: unknown,
  payloadIncoming?: unknown,
  type: string,
}

export type TestState = {
  logLevel: 'debug' | 'none',
  isTest: boolean,
  isPerf: boolean,
  fakeDevtoolsMessage: null | Omit<DevtoolsAction, 'source'>,
}

export type StoreArgs<P = string> = {
  stateActions: StateAction[],
  prop: P,
  recurseProxy: (stateActions: StateAction[]) => StoreInternal,
}