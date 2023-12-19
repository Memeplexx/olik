import { Augmentations, ChangeListener, EnableAsyncActionsArgs, OlikAction } from './type';
import { StoreInternal, WindowAugmentedWithOlikDevtools } from './type-internal';



export const errorMessages = {
  FIND_RETURNS_NO_MATCHES: 'Could not find array element',
  INVALID_STATE_INPUT: (illegal: { toString(): string }) => `State must be serializable to JSON. Value of '${illegal.toString()}' is not permitted`,
  ASYNC_UPDATES_NOT_ENABLED: 'Cannot perform an async update until you enable it. Please import and invoke `importOlikAsyncModule()` before creating your store',
  DOLLAR_USED_IN_STATE: `Your state cannot contain any properties which begin with a '$' symbol because this syntax is reserved for library functions`,
} as const;

export type DerivationKey = { key: string, state: unknown, from?: DerivationKey[] }

export const libState: {
  store: undefined | StoreInternal,
  onInternalDispatch: (action: OlikAction) => void,
  asyncUpdate: undefined | ((args: EnableAsyncActionsArgs) => Promise<unknown>),
  olikDevtools: undefined | { dispatch: (args: { insideTransaction?: boolean }) => unknown, init: () => void, trace: boolean },
  state: undefined | Record<string, unknown>,
  changeListeners: ChangeListener[],
  currentAction: undefined | OlikAction,
  initialState: undefined | Record<string, unknown>,
  disableDevtoolsDispatch?: boolean,
  derivations: Map<DerivationKey, unknown>,
  stacktraceError: null | Error,
} = {
  store: undefined,
  onInternalDispatch: () => null,
  asyncUpdate: undefined,
  olikDevtools: undefined,
  state: undefined,
  changeListeners: [],
  currentAction: undefined,
  initialState: undefined,
  derivations: new Map(),
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
