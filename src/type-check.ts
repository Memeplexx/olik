import { Actual, Primitive } from "./type";


const checks = {
  actual: (arg: unknown): arg is Actual => arg !== null && arg !== undefined,
  number: (arg: unknown): arg is number => typeof (arg) === 'number',
  string: (arg: unknown): arg is string => typeof (arg) === 'string',
  boolean: (arg: unknown): arg is boolean => typeof (arg) === 'boolean',
  primitive: (arg: unknown): arg is Primitive => ['number', 'string', 'boolean'].includes(typeof arg),
  function: <Input, Output>(arg: unknown): arg is ((a: Input) => Output) => typeof arg === 'function',
  record: <Value>(arg: unknown): arg is { [key: string]: Value } => typeof arg === 'object' && arg !== null && !Array.isArray(arg),
  array: (arg: unknown): arg is Array<unknown> => Array.isArray(arg),
}

const mustBeArrayOf = new Proxy({}, {
  get: (_, prop: keyof typeof checks) => {
    return (arg: Array<unknown>) => {
      if (arg === null || arg === undefined || !Array.isArray(arg)) { throw new Error(); }
      if (arg.length > 0) { // only check first element in array
        mustBe.function(mustBe[prop])(arg[0]);
      }
      return arg;
    }
  }
});

const mustBeRecordOf = new Proxy({}, {
  get: (_, prop: keyof typeof checks) => {
    return (arg: Record<string, unknown>) => {
      if (arg === null || arg === undefined || !checks.record(arg)) { throw new Error(); }
      const values = Object.values(arg);
      if (values.length > 0) { // only check first element in object
        mustBe.function(mustBe[prop])(values[0]);
      }
      return arg;
    }
  }
});

export const mustBe = new Proxy({}, {
  get: (_, prop: keyof typeof checks | 'arrayOf' | 'recordOf') => {
    if (prop === 'arrayOf') {
      return mustBeArrayOf;
    } else if (prop === 'recordOf') {
      return mustBeRecordOf;
    } else {
      const value = checks[prop] as (arg: unknown) => unknown;
      return ((arg: unknown) => {
        if (!value(arg)) {
          throw new Error();
        }
        return arg;
      });
    }
  }
}) as { [key in keyof typeof checks]: typeof checks[key] extends (arg: unknown) => arg is infer H ?
  key extends 'function' ? <Input, Output>(a: unknown) => ((i: Input) => Output) 
  : key extends 'record' ? <Value>(a: unknown) => { [k: string]: Value }
  :  ((a: unknown) => H) 
  : never }
  & {
    arrayOf: { [key in keyof typeof checks]: typeof checks[key] extends (arg: unknown) => arg is infer H ? ((a: unknown) => Array<H>) : never },
    recordOf: { [key in keyof typeof checks]: typeof checks[key] extends (arg: unknown) => arg is infer H ?
      key extends 'function' ? <Input, Output>(a: unknown) => { [k: string]: (i: Input) => Output } : ((a: unknown) => { [k: string]: H })
      : never }
  }

const isArrayOf = new Proxy({}, {
  get: (_, prop: keyof typeof checks) => {
    return (arg: Array<unknown>) => {
      if (arg === null || arg === undefined || !Array.isArray(arg)) {
        return false
      }
      if (arg.length > 0) { // only check first element in array
        return mustBe.function(is[prop])(arg[0]);
      }
      return arg;
    }
  }
}) as { [key in keyof typeof checks]: typeof checks[key] extends (arg: unknown) => arg is infer H ? ((a: unknown) => a is H[]) : never };

export const is = {
  ...checks,
  arrayOf: isArrayOf,
}

export const either = (arg: unknown) => {
  return {
    else: (val: Actual) => {
      if (checks.actual(arg)) {
        return arg as Actual;
      }
      return val;
    }
  }
}