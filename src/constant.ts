import { Augmentations, ChangeListener, EnableAsyncActionsArgs, OlikAction, RecursiveRecord, Store } from './type';
import { StoreInternal, WindowAugmentedWithOlikDevtools } from './type-internal';



export const errorMessages = {
  FIND_RETURNS_NO_MATCHES: 'Could not find array element',
  ASYNC_PAYLOAD_INSIDE_TRANSACTION: 'Transactions do not currently support asynchronous payloads',
  INVALID_STATE_INPUT: (illegal: { toString(): string }) => `State must be serializable to JSON. Value of '${illegal.toString()}' is not permitted`,
  ASYNC_UPDATES_NOT_ENABLED: 'Cannot perform an async update until you enable it. Please import and invoke `importOlikAsyncModule()` before creating your store',
  DOLLAR_USED_IN_STATE: `Your state cannot contain any properties which begin with a '$' symbol because this syntax is reserved for library functions`,
  KEY_ALREADY_IN_USE: (illegal: string) => `The key '${illegal}' is already in use in the application store. Please choose a different key for your inner store`,
} as const;

export const libState: {
  store: undefined | StoreInternal,
  detached: string[],
  innerStores: Map<string, Store<unknown>>,
  isInsideTransaction: boolean,
  onInternalDispatch: (action: OlikAction) => void,
  asyncUpdate: undefined | ((args: EnableAsyncActionsArgs) => Promise<unknown>),
  olikDevtools: undefined | { dispatch: (args: { insideTransaction?: boolean }) => unknown, init: () => void, trace: boolean },
  state: undefined | RecursiveRecord,
  changeListeners: ChangeListener[],
  currentActions: OlikAction[],
  initialState: undefined | RecursiveRecord,
  disableDevtoolsDispatch?: boolean,
  derivations: Map<Array<unknown>, unknown>,
  stacktraceError: null | Error,
} = {
  store: undefined,
  detached: [],
  innerStores: new Map<string, Store<unknown>>(),
  isInsideTransaction: false,
  onInternalDispatch: () => null,
  asyncUpdate: undefined,
  olikDevtools: undefined,
  state: undefined,
  changeListeners: [],
  currentActions: [],
  initialState: undefined,
  derivations: new Map<Array<unknown>, unknown>(),
  stacktraceError: null,
}

export const testState: {
  currentActionsForOlikDevtools: OlikAction[],
  fakeWindowObjectForOlikDevtools: null | WindowAugmentedWithOlikDevtools,
  logLevel: 'debug' | 'none',
  isTest: boolean,
} = {
  currentActionsForOlikDevtools: [],
  fakeWindowObjectForOlikDevtools: null,
  logLevel: 'none',
  isTest: false,
}

export const augmentations: Augmentations = {
  selection: {},
  future: {},
  derivation: {},
  core: {},
  async: promise => promise(),
};

export const comparisons = {
  $eq: <T>(val: T, arg: T) => val === arg,
  $in: <T>(val: T, arg: Array<T>) => arg.includes(val),
  $ni: <T>(val: T, arg: Array<T>) => !arg.includes(val),
  $gt: <T>(val: T, arg: T) => val > arg,
  $lt: <T>(val: T, arg: T) => val < arg,
  $gte: <T>(val: T, arg: T) => val >= arg,
  $lte: <T>(val: T, arg: T) => val <= arg,
  $match: (val: string, arg: RegExp) => arg.test(val),
  $contains: (val: string, arg: string) => val.includes(arg),
} as { [comparator: string]: (val: unknown, arg: unknown) => boolean };

export const booleanNumberString = ['boolean', 'number', 'string'];
export const updateFunctions = ['$set', '$patch', '$patchDeep', '$delete', '$setNew', '$add', '$subtract', '$clear', '$push', '$withOne', '$withMany', '$toggle'];
export const comparators = Object.keys(comparisons);
export const andOr = ['$and', '$or'];
export const findFilter = ['$find', '$filter'];
export const reader = ['$onChange', '$state'];
export const mergeMatching = ['$mergeMatching'];
export const anyLibProp = [...updateFunctions, ...findFilter, ...andOr, ...comparators, ...reader, ...mergeMatching];
