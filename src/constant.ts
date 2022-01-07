import { StoreLike } from '.';
import { Augmentations, EnableAsyncActionsArgs, EnableNestedStoreArgs, NestStoreRef } from './type';
import { StoreInternal, WindowAugmentedWithReduxDevtools } from './type-internal';

export const errorMessages = {
  FIND_RETURNS_NO_MATCHES: 'Could not find array element',
  ASYNC_PAYLOAD_INSIDE_TRANSACTION: 'Transactions do not currently support asynchronous payloads',
  DEVTOOL_DISPATCHED_INVALID_JSON: 'Invalid action dispatched from the devtools. Please dispatch a valid plain javascript object. All keys and values that are strings must be enclosed in double-quotes',
  INVALID_CONTAINER_FOR_COMPONENT_STORES: `The state which your container store manages must be an object in order for it to host your nested store`,
  INVALID_EXISTING_STORE_FOR_MERGING: `The state which your existing store manages must be a non-array object in order to support merging`,
  INVALID_MERGING_STORE: `The store you're merging must be an non-array object in order for it to merge`,
  INVALID_STATE_INPUT: (illegal: any) => `State must be serializable as JSON. Value of '${illegal.toString()}' is not permitted`,
  ASYNC_UPDATES_NOT_ENABLED: 'Cannot perform an async update until you enable it. Simply import and invoke `enableAsyncActionPayloads()` wherever your application initializes',
  NESTED_STORES_NOT_ENABLED: 'Cannot nest this store until you enable nesting. Simply import and invoke `enableNesting()` wherever your application initializes',
} as const;

export const libState = {
  stores: {} as { [storeName: string]: StoreInternal<any> },
  isInsideTransaction: false,
  onInternalDispatch: () => null,
  asyncUpdate: undefined as undefined | ((args: EnableAsyncActionsArgs) => Promise<any>),
  nestStore: undefined as undefined | ((args: EnableNestedStoreArgs) => any),
  detachNestedStore: undefined as undefined | ((args: StoreLike<any>) => any),
}

export const testState = {
  currentActionForReduxDevtools: { } as { [type: string]: string },
  fakeWindowObjectForReduxDevtools: null as null | WindowAugmentedWithReduxDevtools,
  logLevel: 'none' as ('debug' | 'none'),
}

export const augmentations: Augmentations = {
  selection: {},
  future: {},
  derivation: {},
  async: promise => promise(),
};

export const comparisons = {
  eq: (val, arg) => val === arg,
  in: (val, arg) => arg.includes(val),
  ni: (val, arg) => !arg.includes(val),
  gt: (val, arg) => val > arg,
  lt: (val, arg) => val < arg,
  gte: (val, arg) => val >= arg,
  lte: (val, arg) => val <= arg,
  match: (val, arg) => arg.test(val),
} as { [comparator: string]: (val: any, arg: any) => boolean };
