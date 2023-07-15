import { Actual, Primitive } from "./type";



const checks = {
  actual: (arg: unknown) => arg !== null && arg !== undefined,
  number: (arg: unknown) => typeof (arg) === 'number',
  string: (arg: unknown) => typeof (arg) === 'string',
  primitive: (arg: unknown) => ['number', 'string', 'boolean'].includes(typeof arg),
  function: (arg: unknown) => typeof arg === 'function',
  record: (arg: unknown) => typeof arg === 'object' && arg !== null && !Array.isArray(arg),
}

const checkElseThrow = <T>(check: (val: unknown) => boolean) => {
  return (value: unknown) => {
    if (!check(value)) {
      throw new Error();
    }
    return value as T;
  }
}

const checkArrayMustBe = {
  actual: checkElseThrow<Array<Actual>>(checks.actual),
  number: checkElseThrow<Array<number>>(checks.number),
  string: checkElseThrow<Array<string>>(checks.string),
  primitive: checkElseThrow<Array<Primitive>>(checks.primitive),
  function: checkElseThrow(checks.function),
  record: checkElseThrow<Array<Record<string, unknown>>>(checks.record),
} satisfies { [key in keyof typeof checks]: (arg: unknown) => unknown }

const checkMustBe = {
  actual: checkElseThrow<Actual>(checks.actual),
  number: checkElseThrow<number>(checks.number),
  string: checkElseThrow<string>(checks.string),
  primitive: checkElseThrow<Primitive>(checks.primitive),
  function: <Input, Output>(value: unknown) => checkElseThrow<(a: Input) => Output>(() => checks.function(value)),
  record: checkElseThrow<Record<string, unknown>>(checks.record),
} satisfies { [key in keyof typeof checks]: (arg: unknown) => unknown }

export const mustBe = {
  ...checkMustBe,
  arrayOf: new Proxy<typeof checkArrayMustBe>({} as typeof checkArrayMustBe, {
    get: (target, prop: keyof typeof checkArrayMustBe) => {
      return (arg: Array<unknown>) => {
        if (arg === null || arg === undefined || !Array.isArray(arg)) {
          throw new Error();
        }
        if (arg.length > 0) { // only check first element in array
          if (!checks[prop](arg[0])) {
            throw new Error();
          }
        }
        return arg;
      }
    }
  }),
  recordOf: new Proxy({}, {
    get: (target, prop: keyof typeof checks) => {
      return (arg: Record<string, unknown>) => {
        if (arg === null || arg === undefined || !checks.record(arg)) {
          throw new Error();
        }
        const keys = Object.keys(arg);
        if (keys.length > 0) { // only check first element in object
          if (!checks[prop](arg[keys[0]])) {
            throw new Error();
          }
        }
        return arg;
      }
    }
  }) as { [key in keyof typeof checkMustBe]: (arg: unknown) => Record<string, ReturnType<typeof checkMustBe[key]>> }
}

// const e = mustBe.recordOf.number({k: 3})
// const ee = mustBe.recordOf.function('');


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




const checkIs = {
  actual: (arg: unknown): arg is Actual => checks.actual(arg),
  number: (arg: unknown): arg is number => checks.number(arg),
  string: (arg: unknown): arg is string => checks.string(arg),
  primitive: (arg: unknown): arg is Primitive => checks.primitive(arg),
  function: <Input, Output>(arg: unknown): arg is ((input: Input) => Output) => checks.function(arg),
  record: (arg: unknown): arg is Record<string, unknown> => checks.record(arg),
} satisfies { [key in keyof typeof checks]: (arg: unknown) => boolean }

const checkArrayIs = {
  actual: (arg: unknown): arg is Array<Actual> => checks.actual(arg),
  number: (arg: unknown): arg is Array<number> => checks.number(arg),
  string: (arg: unknown): arg is Array<string> => checks.string(arg),
  primitive: (arg: unknown): arg is Array<Primitive> => checks.primitive(arg),
  function: <Input, Output>(arg: unknown): arg is (input: Input) => Output => checks.function(arg),
  record: (arg: unknown): arg is Array<Record<string, unknown>> => checks.record(arg),
} satisfies { [key in keyof typeof checks]: (arg: unknown) => boolean }

export const is = {
  ...checkIs,
  arrayOf: new Proxy({}, {
    get: (target, prop: keyof typeof checkArrayIs) => {
      return (arg: Array<unknown>) => {
        if (arg === null || arg === undefined || !Array.isArray(arg)) {
          return false
        }
        if (arg.length > 0) { // only check first element in array
          return checks[prop](arg[0]);
        }
        return arg;
      }
    }
  }) as typeof checkArrayIs
}

const arg = 2 as unknown;
if (is.number(arg)) {
  arg.toFixed()
}
if (is.record(arg)) {
  arg.one;
}
if (is.arrayOf.number(arg)) {
  arg[0].toFixed()
}
if (is.arrayOf.record(arg)) {
  arg[0].one;
}

const arg2 = ['1', 2] as unknown;
if (is.arrayOf.number(arg2)) {
  console.log(arg2[0].toFixed())
}

mustBe.arrayOf.string(arg2)[0]






// const thing = {};
// console.log(typeof thing === 'object' && thing !== null && !Array.isArray(thing));