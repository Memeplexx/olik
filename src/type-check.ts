import { anyLibProp, comparators, concatenations, readFunctions, updateFunctions } from "./constant";
import { Primitive, ValidJson, ValueOf } from "./type";
import { StoreInternal } from "./type-internal";
import { doThrow, newRecord } from "./utility";


const libPropMap = anyLibProp.reduce((acc, e) => { acc[e] = true; return acc; }, newRecord());
const readPropMap = readFunctions.reduce((acc, e) => { acc[e] = true; return acc; }, newRecord());
const updatePropMap = updateFunctions.reduce((acc, e) => { acc[e] = true; return acc; }, newRecord());
const comparatorsPropMap = comparators.reduce((acc, e) => { acc[e] = true; return acc; }, newRecord());
const concatPropMap = concatenations.reduce((acc, e) => { acc[e] = true; return acc; }, newRecord());

export const is = {
  date: (arg: unknown): arg is Date => arg instanceof Date,
  number: (arg: unknown): arg is number => typeof (arg) === 'number',
  string: (arg: unknown): arg is string => typeof (arg) === 'string',
  boolean: (arg: unknown): arg is boolean => typeof (arg) === 'boolean',
  primitive: (arg: unknown): arg is Primitive => is.number(arg) || is.string(arg) || is.boolean(arg),
  function: <Input, Output>(arg: unknown): arg is ((a: Input) => Output) => typeof arg === 'function',
  record: <T = ValidJson>(arg: unknown): arg is { [key: string]: T } => typeof arg === 'object' && !is.null(arg) && !is.array(arg) && !is.date(arg),
  array: <T = ValidJson>(arg: unknown): arg is Array<T> => Array.isArray(arg),
  null: (arg: unknown): arg is null => arg === null,
  undefined: (arg: unknown): arg is undefined => arg === undefined,
  storeInternal: (arg: unknown): arg is StoreInternal => is.record(arg) && !!arg['$stateActions'],
  anyComparatorProp: (arg: unknown): arg is ValueOf<typeof comparators> => arg as string in comparatorsPropMap,
  anyConcatenationProp: (arg: unknown): arg is ValueOf<typeof concatenations> => arg as string in concatPropMap,
  anyUpdateFunction: (arg: unknown): arg is ValueOf<typeof updateFunctions> => arg as string in updatePropMap,
  anyReadFunction: (arg: unknown): arg is ValueOf<typeof readFunctions> => arg as string in readPropMap,
  anyLibProp: <T extends ValueOf<typeof anyLibProp>[]>(toCheck: unknown): toCheck is T => toCheck as string in libPropMap,
}

export const as = {
  string: (arg: unknown): string => is.string(arg) ? arg : doThrow(),
  number: (arg: unknown): number => is.number(arg) ? arg : doThrow(),
  record: <T = ValidJson>(arg: unknown): { [key: string]: T } => is.record<T>(arg) ? arg : doThrow(),
  array: <T = ValidJson>(arg: unknown): Array<T> => is.array<T>(arg) ? arg : doThrow(),
  json: (arg: unknown): ValidJson => is.record(arg) || is.array(arg) || is.primitive(arg) || is.date(arg) || is.null(arg) ? arg : doThrow(),
  storeInternal: (arg: unknown): StoreInternal => is.storeInternal(arg) ? arg : doThrow(),
  anyUpdateFunction: (arg: unknown): ValueOf<typeof updateFunctions> => is.anyUpdateFunction(arg) ? arg : doThrow(),
}

export function assertIsArray<T = ValidJson>(value: unknown): asserts value is Array<T> {
  as.array<T>(value);
}
