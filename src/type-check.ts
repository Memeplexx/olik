import { anyLibProp, comparators, concatenations, readFunctions, updateFunctions } from "./constant";
import { Actual, Primitive, ValueOf } from "./type";
import { StoreInternal } from "./type-internal";
import { doThrow } from "./utility";


export const is = {
  date: (arg: unknown): arg is Date => arg instanceof Date,
  actual: (arg: unknown): arg is Actual => arg !== null && arg !== undefined,
  number: (arg: unknown): arg is number => typeof (arg) === 'number',
  string: (arg: unknown): arg is string => typeof (arg) === 'string',
  boolean: (arg: unknown): arg is boolean => typeof (arg) === 'boolean',
  primitive: (arg: unknown): arg is Primitive => is.number(arg) || is.string(arg) || is.boolean(arg),
  function: <Input, Output>(arg: unknown): arg is ((a: Input) => Output) => typeof arg === 'function',
  record: <T = Actual>(arg: unknown): arg is { [key: string]: T } => typeof arg === 'object' && !is.null(arg) && !is.array(arg) && !is.date(arg),
  array: <T = Actual>(arg: unknown): arg is Array<T> => Array.isArray(arg),
  null: (arg: unknown): arg is null => arg === null,
  undefined: (arg: unknown): arg is undefined => arg === undefined,
  storeInternal: (arg: unknown): arg is StoreInternal => is.record(arg) && !!arg['$stateActions'],
  anyComparatorProp: (arg: unknown): arg is ValueOf<typeof comparators> => (comparators as unknown as string[]).includes(arg as string),
  anyConcatenationProp: (arg: unknown): arg is ValueOf<typeof concatenations> => (concatenations as unknown as string[]).includes(arg as string),
  anyUpdateFunction: (arg: unknown): arg is ValueOf<typeof updateFunctions> => (updateFunctions as unknown as string[]).includes(arg as string),
  anyReadFunction: (arg: unknown): arg is ValueOf<typeof readFunctions> => (readFunctions as unknown as string[]).includes(arg as string),
  libArg: <T extends ValueOf<typeof anyLibProp>[]>(toCheck: unknown, ...mustBeWithin: T): toCheck is T => ((!mustBeWithin.length ? anyLibProp : mustBeWithin) as unknown as string[])
    .includes(toCheck as unknown as string),
}

export const as = {
  string: (arg: unknown): string => is.string(arg) ? arg : doThrow(),
  number: (arg: unknown): number => is.number(arg) ? arg : doThrow(),
  record: <T = Actual>(arg: unknown): { [key: string]: T } => is.record<T>(arg) ? arg : doThrow(),
  array: <T = Actual>(arg: unknown): Array<T> => is.array<T>(arg) ? arg : doThrow(),
  storeInternal: (arg: unknown): StoreInternal => is.storeInternal(arg) ? arg : doThrow(),
  anyUpdateFunction: (arg: unknown): ValueOf<typeof updateFunctions> => is.anyUpdateFunction(arg) ? arg : doThrow(),
}

export function assertIsNumber(value: unknown): asserts value is number {
  as.number(value);
}

export function assertIsArray<T = Actual>(value: unknown): asserts value is Array<T> {
  as.array<T>(value);
}

export function assertIsRecord<T = Actual>(value: unknown): asserts value is { [key: string]: T } {
  as.record<T>(value);
}

export function assertIsUpdateFunction(value: unknown): asserts value is ValueOf<typeof updateFunctions> {
  as.anyUpdateFunction(value);
}
