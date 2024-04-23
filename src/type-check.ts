import { anyLibProp, comparators, concatenations, readFunctions, updateFunctions } from "./constant";
import { Actual, Primitive, ValueOf } from "./type";
import { StoreInternal } from "./type-internal";


export const is = {
  date: (arg: unknown): arg is Date => arg instanceof Date,
  actual: (arg: unknown): arg is Actual => arg !== null && arg !== undefined,
  number: (arg: unknown): arg is number => typeof (arg) === 'number',
  string: (arg: unknown): arg is string => typeof (arg) === 'string',
  boolean: (arg: unknown): arg is boolean => typeof (arg) === 'boolean',
  primitive: (arg: unknown): arg is Primitive => ['number', 'string', 'boolean'].includes(typeof arg),
  function: <Input, Output>(arg: unknown): arg is ((a: Input) => Output) => typeof arg === 'function',
  record: <T = Actual>(arg: unknown): arg is { [key: string]: T } => typeof arg === 'object' && arg !== null && !Array.isArray(arg) && !(arg instanceof Date),
  array: <T = Actual>(arg: unknown): arg is Array<T> => Array.isArray(arg),
  arrayOrRecord: <T = Actual>(arg: unknown): arg is Array<T> | { [key: string]: T } => is.array(arg) || is.record(arg),
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
  string: (arg: unknown): string => {
    if (!is.string(arg)) throw new Error();
    return arg as string;
  },
  number: (arg: unknown): number => {
    if (!is.number(arg)) throw new Error();
    return arg as number;
  },
  record: <T = Actual>(arg: unknown): { [key: string]: T } => {
    if (!is.record<T>(arg)) throw new Error();
    return arg as { [key: string]: T };
  },
  array: <T = Actual>(arg: unknown): Array<T> => {
    if (!is.array<T>(arg)) throw new Error();
    return arg as Array<T>;
  },
  storeInternal: (arg: unknown): StoreInternal => {
    if (!is.storeInternal(arg)) throw new Error();
    return arg as StoreInternal;
  },
}

export const newRecord = <V = unknown>() => ({} as Record<string, V>);

export function assertIsNumber(value: unknown): asserts value is number {
  as.number(value);
}

export function assertIsArray<T = Actual>(value: unknown): asserts value is Array<T> {
  as.array<T>(value);
}

export function assertIsRecord<T = Actual>(value: unknown): asserts value is { [key: string]: T } {
  as.record<T>(value);
}
