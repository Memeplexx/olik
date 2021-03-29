import { FunctionReturning } from './shapes-external';
import { errorMessages, expressionsNotAllowedInSelectorFunction } from './shared-consts';
import { libState } from './shared-state';

export function deepFreeze<T extends Object>(o: T): T {
  Object.freeze(o);
  if (isEmpty(o)) { return o; }
  (Object.getOwnPropertyNames(o) as Array<keyof T>).forEach(prop => {
    if (o.hasOwnProperty(prop)
      && o[prop] !== null
      && (typeof (o[prop]) === 'object' || typeof (o[prop]) === 'function')
      && !Object.isFrozen(o[prop])) {
      deepFreeze(o[prop]);
    }
  });
  return o;
}

export function isEmpty(arg: any) {
  return arg === null || arg === undefined;
}

export function deepCopy<T>(o: T): T;
export function deepCopy(o: any): any {
  let newO;
  let i: any;
  if (typeof o !== 'object') { return o; }
  if (!o) { return o; }
  if ('[object Array]' === Object.prototype.toString.apply(o)) {
    newO = [];
    for (i = 0; i < o.length; i += 1) {
      newO[i] = deepCopy(o[i]);
    }
    return newO;
  }
  newO = {} as any;
  for (i in o) {
    if (o.hasOwnProperty(i)) {
      newO[i] = deepCopy(o[i]);
    }
  }
  return newO;
}

export function validateState(state: any) {
  const throwError = () => {
    throw new Error(errorMessages.INVALID_STATE_INPUT);
  };
  if (
    state !== null
    && !['boolean', 'number', 'string'].some(type => typeof state === type)
  ) {
    if (!Array.isArray(state)) {
      if (typeof state !== "object") {
        throwError();
      }
      const proto = Object.getPrototypeOf(state);
      if (proto != null && proto !== Object.prototype) {
        throwError();
      }
    }
    Object.keys(state).forEach(key => validateState(state[key]));
  }
}

export function copyObject<T>(oldObj: T, newObj: T, segs: string[], action: (newNode: any) => any): any {
  const seg = (segs as (keyof T)[]).shift();
  if (seg) {
    if (Array.isArray(oldObj)) {
      return (oldObj as any as any[]).map((e, i) => +seg === i
        ? { ...(oldObj as any)[i], ...copyObject((oldObj as any)[i], (newObj as any)[i], segs, action) }
        : e);
    }
    return { ...oldObj, [seg]: copyObject(oldObj[seg], newObj[seg], segs, action) };
  } else {
    return action(oldObj);
  }
}

export function createPathReader<S extends Object>(state: S) {
  return (() => {
    const mutableStateCopy = deepCopy(state);
    const pathSegments = new Array<string>();
    const initialize = (state: S): S => {
      if (typeof (state) !== 'object') { // may happen if we have a top-level primitive
        return null as any as S;
      }
      return new Proxy(state, {
        get: function (target, prop: any) {
          if (!(target as any)[prop]) { // to support queries on empty array elements
            (target as any)[prop] = {};
          }
          const val = (target as any)[prop];
          if (val !== null && typeof (val) === 'object') {
            pathSegments.push(prop);
            return initialize(val);
          } else if (typeof (val) === 'function') {
            return function (...args: any[]) {
            };
          }
          pathSegments.push(prop);
          return val;
        },
      });
    }
    const proxy = initialize(mutableStateCopy);
    const readSelector = <C>(selector: (state: S) => C) => {
      pathSegments.length = 0;
      selector(proxy);
      return pathSegments;
    }
    return { readSelector, mutableStateCopy, pathSegments }
  })();
}

export function copyPayload<C>(payload: C | FunctionReturning<C>) {
  const isFunction = typeof (payload) === 'function';
  return {
    payloadFrozen: (isFunction ? null : deepFreeze(deepCopy(payload))) as C,
    payloadCopied: (isFunction ? null : deepCopy(payload)) as C,
    payloadFunction: (isFunction ? payload as FunctionReturning<C> : null) as FunctionReturning<C>,
  };
}

export const validateSelectorFn = (
  functionName: 'select' | 'getProp',
  selector?: (element: any) => any,
) => {
  if (libState.bypassSelectorFunctionCheck) { return; }
  const fnToString = (selector || '').toString();
  const illegalChars = expressionsNotAllowedInSelectorFunction
    .filter(c => c.test(fnToString));
  if (illegalChars.length) {
    throw new Error(errorMessages.ILLEGAL_CHARACTERS_WITHIN_SELECTOR(functionName));
  }
}
