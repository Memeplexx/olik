import { Augmentations, BasicRecord, LibState, ValueOf } from './type';
import { TestState } from './type-internal';



export const errorMessages = {
  AT_RETURNS_NO_MATCHES: (index: number) => `No array element at index ${index}`,
  FIND_RETURNS_NO_MATCHES: 'Could not find array element',
  AT_INDEX_OUT_OF_BOUNDS: (index: number) => `Index ${index} is out of bounds`,
  INVALID_STATE_INPUT: (key: string | number, illegal: { toString(): string }) => `State must be serializable to JSON. Value of ${key === '' ? `'${illegal.toString()}'` : `{${key}: '${illegal.toString()}'}`} is not permitted`,
  ASYNC_UPDATES_NOT_ENABLED: 'Cannot perform an async update until you enable it. Please import and invoke `importOlikAsyncModule()` before creating your store',
  INVALID_PATCH_DEEP_STRUCTURE: 'Only Objects can be patched onto other objects',
  LIB_PROP_USED_IN_STATE: (key: string) => `The key '${key}' is a reserved library property and cannot be used in the state`,
} as const;

export const libState: LibState = {
  store: undefined,
  asyncUpdate: undefined,
  devtools: undefined,
  state: undefined,
  changeListeners: [],
  initialState: undefined,
  derivations: new Map(),
  stacktraceError: null,
}

export const testState: TestState = {
  logLevel: 'none',
  isTest: false,
  fakeDevtoolsMessage: null,
  currentActionType: undefined,
  currentActionPayload: undefined,
  currentActionTypeOrig: undefined,
  currentActionPayloadPaths: undefined,
}

export const augmentations: Augmentations = {
  selection: {},
  future: {},
  derivation: {},
  core: {},
  async: promise => promise(),
};

export const updateFunctions = ['$set', '$setUnique', '$patch', '$patchDeep', '$delete', '$setNew', '$add', '$subtract', '$clear', '$push', '$pushMany', '$with', '$toggle', '$merge', '$deDuplicate', '$setKey'] as const;
export const readFunctions = ['$onChange', '$state'] as const;
export const concatenations = ['$and', '$or', '$find', '$filter', '$distinct', '$mergeMatching'] as const;
export const otherFunctions = ['$at', '$invalidateCache', '$stateActions'] as const;
export const comparators = ['$eq', '$in', '$ni', '$gt', '$lt', '$gte', '$lte', '$match', '$contains', '$containsIgnoreCase', '$isContainedIn', '$isContainedInIgnoreCase', '$isTrue', '$isFalse', '$isTruthy', '$isFalsy'] as const;
export const anyLibProp = [...updateFunctions, ...readFunctions, ...concatenations, ...comparators, ...otherFunctions] as const;

const emptyObject = {} as BasicRecord;
export const libPropMap = anyLibProp.reduce((acc, e) => { acc[e] = true; return acc; }, { ...emptyObject });
export const readPropMap = readFunctions.reduce((acc, e) => { acc[e] = true; return acc; }, { ...emptyObject });
export const updatePropMap = updateFunctions.reduce((acc, e) => { acc[e] = true; return acc; }, { ...emptyObject });
export const comparatorsPropMap = comparators.reduce((acc, e) => { acc[e] = true; return acc; }, { ...emptyObject });
export const concatPropMap = concatenations.reduce((acc, e) => { acc[e] = true; return acc; }, { ...emptyObject });

export const comparisons = {
  $eq: (val: unknown, arg: unknown) => val === arg,
  $in: (val: unknown, arg: unknown) => (arg as Array<unknown>).includes(val),
  $ni: (val: unknown, arg: unknown) => !(arg as Array<unknown>).includes(val),
  $gt: (val: unknown, arg: unknown) => (val as number) > (arg as number),
  $lt: (val: unknown, arg: unknown) => (val as number) < (arg as number),
  $gte: (val: unknown, arg: unknown) => (val as number) >= (arg as number),
  $lte: (val: unknown, arg: unknown) => (val as number) <= (arg as number),
  $match: (val: unknown, arg: unknown) => (arg as RegExp).test(val as string),
  $contains: (val: unknown, arg: unknown) => (val as Array<unknown>).includes(arg),
  $containsIgnoreCase: (val: unknown, arg: unknown) => (val as string).toLowerCase().includes((arg as string).toLowerCase()),
  $isContainedIn: (val: unknown, arg: unknown) => (arg as Array<unknown>).includes(val),
  $isContainedInIgnoreCase: (val: unknown, arg: unknown) => (arg as string).toLowerCase().includes((val as string).toLowerCase()),
  $isTrue: (val: unknown) => val === true,
  $isFalse: (val: unknown) => val === false,
  $isTruthy: (val: unknown) => !!val,
  $isFalsy: (val: unknown) => !val,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as const satisfies { [comparator in ValueOf<typeof comparators> & string]: (val: any, arg?: any) => boolean };

