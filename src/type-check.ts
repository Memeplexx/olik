import { Actual, Primitive } from "./type";


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
}

export const either = (arg: unknown) => {
  return {
    else: (val: Actual) => {
      return arg !== undefined ? arg as Actual : val;
    }
  }
}