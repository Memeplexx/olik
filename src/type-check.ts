import { Actual, Primitive } from "./type";
import { StoreInternal } from "./type-internal";


export const is = {
  date: (arg: unknown): arg is Date => arg instanceof Date,
  actual: (arg: unknown): arg is Actual => arg !== null && arg !== undefined,
  number: (arg: unknown): arg is number => typeof (arg) === 'number',
  string: (arg: unknown): arg is string => typeof (arg) === 'string',
  boolean: (arg: unknown): arg is boolean => typeof (arg) === 'boolean',
  primitive: (arg: unknown): arg is Primitive => ['number', 'string', 'boolean'].includes(typeof arg),
  function: <Input, Output>(arg: unknown): arg is ((a: Input) => Output) => typeof arg === 'function',
  record: <Value>(arg: unknown): arg is { [key: string]: Value } => typeof arg === 'object' && arg !== null && !Array.isArray(arg) && !(arg instanceof Date),
  array: <T = Actual>(arg: unknown): arg is Array<T> => Array.isArray(arg),
  null: (arg: unknown): arg is null => arg === null,
  undefined: (arg: unknown): arg is undefined => arg === undefined,
  storeInternal: (arg: unknown): arg is StoreInternal => is.record(arg) && !!arg['$stateActions'],
}

export const mustBe = (Object.keys(is) as Array<keyof typeof is> ).reduce((acc, key) => {
  (acc as Record<string, unknown>)[key] = (arg: unknown) => {
    if (!(is[key] as (arg: unknown) => arg is unknown)(arg)) {
      throw new Error(`Expected ${key} but got ${typeof arg}`);
    }
    return arg;
  };
  return acc;
}, {} as typeof is);

export const newRecord = <V = unknown>() => ({} as Record<string, V>);
