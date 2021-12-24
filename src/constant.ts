import { Augmentations, StateAction, Store } from "./type"
import { DevtoolsInstance, PreviousAction, StoreInternal, WindowAugmentedWithReduxDevtools } from "./type-internal";

export const errorMessages = {
  FIND_RETURNS_NO_MATCHES: 'Could not find array element',
  ASYNC_PAYLOAD_INSIDE_TRANSACTION: 'Transactions do not currently support asynchronous payloads',
  DEVTOOL_DISPATCHED_INVALID_JSON: 'Please dispatch a valid object and ensure that all keys are enclosed in double-quotes',
  DEVTOOL_DISPATCHED_WITH_NO_ACTION: (type: string) => `Cannot dispatch ${type} because there is no action to perform, eg. replace()`,
  INVALID_CONTAINER_FOR_COMPONENT_STORES: `The state which your container store manages must be an object in order for it to host your nested store`,
  INVALID_EXISTING_STORE_FOR_MERGING: `The state which your existing store manages must be a non-array object in order to support merging`,
  INVALID_MERGING_STORE: `The store you're merging must be an non-array object in order for it to merge`,
  INVALID_STATE_INPUT: (illegal: any) => `State must be serializable as JSON. Value of '${illegal.toString()}' is not permitted`,
  CANNOT_SET_DEFERRED_INSTANCE_NAME: 'Cannot set a deferred instance name unless the component store was initialized with an instanceName of Deferred',
  CANNOT_SET_DEFERRED_INSTANCE_NAME_AGAIN: 'Cannot invoke setDeferredInstanceName() more than once',
} as const;

export const libState = {
  appStores: {} as { [storeName: string]: StoreInternal<any> },
  insideTransaction: false,
  reduxDevtoolsDispatcher: null as null | ((action: { }) => any),
  dispatchToDevtools: true,
  onDispatchListener: () => null,
  batchedAction: {
    type: '',
    payloads: [],
    timeoutHandle: 0,
  } as PreviousAction,
}

export const testState = {
  currentActionForDevtools: { },
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
