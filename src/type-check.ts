import { anyLibProp, comparators, concatenations, readFunctions, updateFunctions } from "./constant";
import { BasicRecord, Primitive, ValueOf } from "./type";
import { StoreInternal } from "./type-internal";



const emptyObject = {} as BasicRecord;
export const libPropMap = anyLibProp.reduce((acc, e) => { acc[e] = true; return acc; }, { ...emptyObject });
export const readPropMap = readFunctions.reduce((acc, e) => { acc[e] = true; return acc; }, { ...emptyObject });
export const updatePropMap = updateFunctions.reduce((acc, e) => { acc[e] = true; return acc; }, { ...emptyObject });
export const comparatorsPropMap = comparators.reduce((acc, e) => { acc[e] = true; return acc; }, { ...emptyObject });
export const concatPropMap = concatenations.reduce((acc, e) => { acc[e] = true; return acc; }, { ...emptyObject });

export const is = {
  date: (arg: unknown): arg is Date => arg instanceof Date,
  number: (arg: unknown): arg is number => typeof (arg) === 'number',
  string: (arg: unknown): arg is string => typeof (arg) === 'string',
  boolean: (arg: unknown): arg is boolean => typeof (arg) === 'boolean',
  primitive: (arg: unknown): arg is Primitive => is.number(arg) || is.string(arg) || is.boolean(arg),
  function: <Input, Output>(arg: unknown): arg is ((a: Input) => Output) => typeof arg === 'function',
  record: <T>(arg: unknown): arg is { [key: string]: T } => typeof arg === 'object' && !is.null(arg) && !is.array(arg) && !is.date(arg),
  array: <T>(arg: unknown): arg is Array<T> => Array.isArray(arg),
  null: (arg: unknown): arg is null => arg === null,
  undefined: (arg: unknown): arg is undefined => arg === undefined,
  storeInternal: (arg: unknown): arg is StoreInternal => is.record(arg) && !!arg['$stateActions'],
  anyComparatorProp: (arg: unknown): arg is ValueOf<typeof comparators> => !!comparatorsPropMap[arg as string],
  anyConcatenationProp: (arg: unknown): arg is ValueOf<typeof concatenations> => !!concatPropMap[arg as string],
  anyUpdateFunction: (arg: unknown): arg is ValueOf<typeof updateFunctions> => !!updatePropMap[arg as string],
  anyReadFunction: (arg: unknown): arg is ValueOf<typeof readFunctions> => !!readPropMap[arg as string],
  anyLibProp: <T extends ValueOf<typeof anyLibProp>[]>(arg: unknown): arg is T => !!libPropMap[arg as string],
}

export const doThrow = () => { throw new Error(); }
export const as = {
  string: (arg: unknown): string => is.string(arg) ? arg : doThrow(),
  number: (arg: unknown): number => is.number(arg) ? arg : doThrow(),
  record: <T>(arg: unknown): { [key: string]: T } => is.record<T>(arg) ? arg : doThrow(),
  array: <T>(arg: unknown): Array<T> => is.array<T>(arg) ? arg : doThrow(),
  storeInternal: (arg: unknown): StoreInternal => is.storeInternal(arg) ? arg : doThrow(),
  anyUpdateFunction: (arg: unknown): ValueOf<typeof updateFunctions> => is.anyUpdateFunction(arg) ? arg : doThrow(),
}
