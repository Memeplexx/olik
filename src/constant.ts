import { Augmentations, LibState } from './type';
import { TestState } from './type-internal';



export const errorMessages = {
  AT_RETURNS_NO_MATCHES: (index: number) => `No array element at index ${index}`,
  FIND_RETURNS_NO_MATCHES: 'Could not find array element',
  INVALID_STATE_INPUT: (illegal: { toString(): string }) => `State must be serializable to JSON. Value of '${illegal.toString()}' is not permitted`,
  ASYNC_UPDATES_NOT_ENABLED: 'Cannot perform an async update until you enable it. Please import and invoke `importOlikAsyncModule()` before creating your store',
  DOLLAR_USED_IN_STATE: `Your state cannot contain any properties which begin with a '$' symbol because this syntax is reserved for library functions`,
} as const;

export const libState: LibState = {
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

export const testState: TestState = {
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
  $containsIgnoreCase: (val: string, arg: string) => val.toLowerCase().includes(arg.toLowerCase()),
  $isContainedIn: (val: string, arg: string) => arg.includes(val),
  $isContainedInIgnoreCase: (val: string, arg: string) => arg.toLowerCase().includes(val.toLowerCase()),
  $isTrue: (val: boolean) => val === true,
  $isFalse: (val: boolean) => val === false,
  $isTruthy: <T>(val: T) => !!val,
  $isFalsy: <T>(val: T) => !val,
} as { [comparator: string]: (val: unknown, arg: unknown) => boolean };

export const updateFunctions = ['$set', '$setUnique', '$patch', '$patchDeep', '$delete', '$setNew', '$add', '$subtract', '$clear', '$push', '$pushMany', '$with', '$toggle', '$merge', '$deDuplicate', '$setKey'];
export const comparators = Object.keys(comparisons);
export const anyLibProp = [...updateFunctions, ...comparators, '$and', '$or', '$onChange', '$state', '$mergeMatching', '$at', '$find', '$filter'];
