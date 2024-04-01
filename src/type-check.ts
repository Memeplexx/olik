import { anyLibProp, comparators, readFunctions, updateFunctions } from "./constant";
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
  anyUpdateFunction: (arg: unknown): arg is ValueOf<typeof updateFunctions> => (updateFunctions as unknown as string[]).includes(arg as string),
  anyReadFunction: (arg: unknown): arg is ValueOf<typeof readFunctions> => (readFunctions as unknown as string[]).includes(arg as string),
  anyLibProp: (arg: unknown): arg is ValueOf<typeof anyLibProp> => (anyLibProp as unknown as string[]).includes(arg as string),
}

export const newRecord = <V = unknown>() => ({} as Record<string, V>);

export function assertIsString(value: unknown): asserts value is string {
  if (is.string(value)) return;
  throw new Error();
}

export function assertIsNumber(value: unknown): asserts value is number {
  if (is.number(value)) return;
  throw new Error();
}

export function assertIsArray<T = Actual>(value: unknown): asserts value is Array<T> {
  if (is.array<T>(value)) return;
  throw new Error();
}

export function assertIsRecord<T = Actual>(value: unknown): asserts value is { [key: string]: T } {
  if (is.record<T>(value)) return;
  throw new Error();
}

export function assertIsRecordOrUndefined<T = Actual>(value: unknown): asserts value is { [key: string]: T } | undefined {
  if (is.record<T>(value) || is.undefined(value)) return;
  throw new Error();
}

export function assertIsArrayOrRecord<T = Actual>(value: unknown): asserts value is Array<T> | { [key: string]: T } {
  if (is.arrayOrRecord<T>(value)) return;
  throw new Error();
}

export function assertIsComparatorProp(value: unknown): asserts value is ValueOf<typeof comparators> {
  if (is.anyComparatorProp(value)) return;
  throw new Error();
}

export function assertIsUpdateFunction(value: unknown): asserts value is ValueOf<typeof updateFunctions> {
  if (is.anyUpdateFunction(value)) return;
  throw new Error();
}

export function assertIsAnyLibProp(value: unknown): asserts value is ValueOf<typeof anyLibProp> {
  if (is.anyLibProp(value)) return;
  throw new Error();
}

export function assertIsStoreInternal(value: unknown): asserts value is StoreInternal {
  if (is.storeInternal(value)) return;
  throw new Error();
}

export function assertIsBoolean(value: unknown): asserts value is boolean {
  if (is.boolean(value)) return;
  throw new Error();
}
