import { Augmentations, StateAction } from "./type"
import { DevtoolsInstance, PreviousAction, WindowAugmentedWithReduxDevtools } from "./type-internal";

export const errorMessages = {
  FIND_RETURNS_NO_MATCHES: 'Could not find array element',
  ASYNC_PAYLOAD_INSIDE_TRANSACTION: 'Transactions do not currently support asynchronous payloads',
  DEVTOOL_DISPATCHED_INVALID_JSON: 'Please dispatch a valid object and ensure that all keys are enclosed in double-quotes',
  DEVTOOL_DISPATCHED_WITH_NO_ACTION: (type: string) => `Cannot dispatch ${type} because there is no action to perform, eg. replace()`,
  INVALID_CONTAINER_FOR_COMPONENT_STORES: `Could not to attach a component store to your application store because the root of your application store is either a primitive or an array`,
  INVALID_STATE_INPUT: (illegal: any) => `State must be serializable as JSON. Value of '${illegal.toString()}' is not permitted`,
}

export const libState = {
  appStates: {} as { [storeName: string]: any },
  appStores: {} as { [storeName: string]: any }, // note: don't change 'any' to Store<any> else the typescript engined seems to slow right down.
  devtoolsRegistry: {} as { [name: string]: DevtoolsInstance },
  currentAction: {} as { [key: string]: any },
  insideTransaction: false,
  windowObject: null as null | WindowAugmentedWithReduxDevtools,
  devtoolsDispatchListener: null as null | ((action: { }) => any),
  dispatchToDevtools: true,
  onDispatchListener: () => null,
  previousAction: {
    type: '',
    timestamp: 0,
    payloads: [],
    debounceTimeout: 0,
  } as PreviousAction,
}

export const testState = {
  currentActionForDevtools: { },
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

export const devtoolsDebounce = 200;