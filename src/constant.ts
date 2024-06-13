import { Augmentations, BasicRecord, LibState, ValueOf } from './type';
import { TestState } from './type-internal';



export const errorMessages = {
  AT_RETURNS_NO_MATCHES: (index: number) => `No array element at index ${index}`,
  FIND_RETURNS_NO_MATCHES: 'Could not find array element',
  AT_INDEX_OUT_OF_BOUNDS: (index: number) => `Index ${index} is out of bounds`,
  INVALID_STATE_INPUT: (key: string | number, illegal: { toString(): string }) => `State must be serializable to JSON. Value of ${key === '' ? `'${illegal.toString()}'` : `{${key}: '${illegal.toString()}'}`} is not permitted`,
  SORT_MODULE_NOT_CONFIGURED: 'Cannot sort until you configure the sort module. Please import and invoke `configureSortModule()` before attempting to sort',
  INVALID_PATCH_DEEP_STRUCTURE: (patch: unknown) => `Cannot patch an object with the supplied value '${patch}'. Only Objects can be patched onto other objects`,
  LIB_PROP_USED_IN_STATE: (key: string) => `The key '${key}' is a reserved library property and cannot be used in the state`,
} as const;

export const libState: LibState = {
  store: undefined,
  devtools: undefined,
  sortModule: undefined,
  state: undefined,
  changeListeners: [],
  initialState: undefined,
  stacktraceError: null,
  insertedElements: new Map(),
  updatedElements: new Map(),
  deletedElements: new Map(),
  changeArrayListeners: [],
  // updatedArrays: new Map(),
}

export const testState: TestState = {
  logLevel: 'none',
  isTest: false,
  fakeDevtoolsMessage: null,
  currentActionType: undefined,
  currentActionPayload: undefined,
  currentActionTypeOrig: undefined,
}

export const augmentations: Augmentations = {
  selection: {},
  derivation: {},
  core: {},
  async: promise => promise(),
};

export const updateFunctions = ['$set', '$patch', '$patchDeep', '$delete', '$setNew', '$add', '$subtract', '$clear', '$slice', '$push', '$pushMany', '$with', '$toggle', '$merge', '$setKey'] as const;
export const readFunctions = ['$onChange', '$state'] as const;
export const concatenations = ['$and', '$or', '$find', '$filter', '$distinct', '$mergeMatching'] as const;
export const otherFunctions = ['$at', '$stateActions', '$memoizeSortBy'] as const;
export const comparators = ['$eq', '$in', '$ni', '$gt', '$lt', '$gte', '$lte', '$match', '$contains', '$containsIgnoreCase', '$isContainedIn', '$isContainedInIgnoreCase', '$isTrue', '$isFalse', '$isTruthy', '$isFalsy'] as const;
export const anyLibProp = [...updateFunctions, ...readFunctions, ...concatenations, ...comparators, ...otherFunctions] as const;

export const libPropMap = anyLibProp.reduce((acc, e) => { acc[e] = true; return acc; }, {} as BasicRecord);
export const readPropMap = readFunctions.reduce((acc, e) => { acc[e] = true; return acc; }, {} as BasicRecord);
export const updatePropMap = updateFunctions.reduce((acc, e) => { acc[e] = true; return acc; }, {} as BasicRecord);
export const comparatorsPropMap = comparators.reduce((acc, e) => { acc[e] = true; return acc; }, {} as BasicRecord);
export const concatPropMap = concatenations.reduce((acc, e) => { acc[e] = true; return acc; }, {} as BasicRecord);

export const comparisons = {
  $eq: (val, arg) => val === arg,
  $in: (val, arg) => (arg as Array<unknown>).includes(val),
  $ni: (val, arg) => !(arg as Array<unknown>).includes(val),
  $gt: (val, arg) => (val as number) > (arg as number),
  $lt: (val, arg) => (val as number) < (arg as number),
  $gte: (val, arg) => (val as number) >= (arg as number),
  $lte: (val, arg) => (val as number) <= (arg as number),
  $match: (val, arg) => (arg as RegExp).test(val as string),
  $contains: (val, arg) => (val as Array<unknown>).includes(arg),
  $containsIgnoreCase: (val, arg) => (val as string).toLowerCase().includes((arg as string).toLowerCase()),
  $isContainedIn: (val, arg) => (arg as Array<unknown>).includes(val),
  $isContainedInIgnoreCase: (val, arg) => (arg as string).toLowerCase().includes((val as string).toLowerCase()),
  $isTrue: (val) => val === true,
  $isFalse: (val) => val === false,
  $isTruthy: (val) => !!val,
  $isFalsy: (val) => !val,
} as const satisfies { [comparator in ValueOf<typeof comparators> & string]: (val: unknown, arg?: unknown) => boolean };

