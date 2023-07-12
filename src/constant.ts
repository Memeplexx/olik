import { Augmentations, EnableAsyncActionsArgs, OlikAction } from './type';
import { StoreInternal, WindowAugmentedWithOlikDevtools } from './type-internal';

export const errorMessages = {
  FIND_RETURNS_NO_MATCHES: 'Could not find array element',
  ASYNC_PAYLOAD_INSIDE_TRANSACTION: 'Transactions do not currently support asynchronous payloads',
  DEVTOOL_DISPATCHED_INVALID_JSON: 'Invalid action dispatched from the devtools. Please dispatch a valid plain javascript object. All keys and values that are strings must be enclosed in double-quotes',
  INVALID_CONTAINER_FOR_COMPONENT_STORES: `The state which your container store manages must be an object in order for it to host your nested store`,
  INVALID_STATE_INPUT: (illegal: any) => `State must be serializable as JSON. Value of '${illegal.toString()}' is not permitted`,
  ASYNC_UPDATES_NOT_ENABLED: 'Cannot perform an async update until you enable it. Please import and invoke `importOlikAsyncModule()` before creating your store',
  DOLLAR_USED_IN_STATE: `Your state cannot contain any properties which begin with a '$' symbol as this syntax is reserved for library functions`,
  KEY_ALREADY_IN_USE: (illegal: string) => `The key '${illegal}' is already in use in the application store. Please choose a different key for your inner store`,
} as const;

export const libState = {
  store: undefined as any as StoreInternal<any>,
  detached: [] as string[],
  innerStores: new Map<string, StoreInternal<any>>(),
  isInsideTransaction: false,
  onInternalDispatch: () => null,
  asyncUpdate: undefined as undefined | ((args: EnableAsyncActionsArgs) => Promise<any>),
  olikDevtools: undefined as undefined | { dispatch: ( stateReader: (state: any) => any, mutator: string ) => any, init: () => void },
}

export const testState = {
  currentActionForOlikDevtools: {} as OlikAction,
  fakeWindowObjectForOlikDevtools: null as null | WindowAugmentedWithOlikDevtools,
  logLevel: 'none' as ('debug' | 'none'),
}

export const augmentations: Augmentations = {
  selection: {},
  future: {},
  derivation: {},
  core: {},
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

export const booleanNumberString = ['boolean', 'number', 'string'];
export const updateFunctions = ['$set', '$setSome', '$setSomeDeep', '$delete', '$setNew', '$add', '$subtract', '$clear', '$push', '$withOne', '$withMany', '$toggle'];
export const comparators = ['$eq', '$ne', '$in', '$ni', '$gt', '$gte', '$lt', '$lte', '$match'];
export const andOr = ['$and', '$or'];
export const findFilter = ['$find', '$filter'];
