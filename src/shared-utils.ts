import { DeepReadonly, Selector, Trackability, UpdateOptions } from './shapes-external';
import { PathReader, StoreState } from './shapes-internal';
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

export function copyPayload<C>(payload: C) {
  return {
    payloadFrozen: deepFreeze(deepCopy(payload)) as C,
    payloadCopied: deepCopy(payload) as C,
  };
}

export const validateSelectorFn = (
  functionName: 'select' | 'getProp',
  storeState: StoreState<any>,
  selector?: (element: any) => any,
) => {
  if (storeState.bypassSelectorFunctionCheck) { return; }
  const fnToString = (selector || '').toString();
  const illegalChars = expressionsNotAllowedInSelectorFunction
    .filter(c => c.test(fnToString));
  if (illegalChars.length) {
    throw new Error(errorMessages.ILLEGAL_CHARACTERS_WITHIN_SELECTOR(functionName));
  }
}

export const toIsoString = (date: Date) => {
  var tzo = -date.getTimezoneOffset(),
    dif = tzo >= 0 ? '+' : '-',
    pad = function (num: number) {
      var norm = Math.floor(Math.abs(num));
      return (norm < 10 ? '0' : '') + norm;
    };
  return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds()) +
    dif + pad(tzo / 60) +
    ':' + pad(tzo % 60);
}

export const processAsyncPayload = <S, C, X extends C & Array<any>, T extends Trackability>(
  selector: Selector<S, C, X>,
  payload: any | (() => Promise<any>),
  pathReader: PathReader<S>,
  storeResult: (selector?: (s: DeepReadonly<S>) => C) => any,
  processPayload: (payload: C) => void,
  updateOptions: UpdateOptions<T>,
  suffix: string,
) => {
  if (!!payload && typeof (payload) === 'function') {
    if (libState.transactionState !== 'none') {
      libState.transactionState = 'none';
      throw new Error(errorMessages.PROMISES_NOT_ALLOWED_IN_TRANSACTIONS)
    }
    if (['array', 'string', 'number', 'boolean'].some(t => t === typeof (storeResult().read()))) {
      throw new Error(errorMessages.INVALID_CONTAINER_FOR_CACHED_DATA);
    }
    const asyncPayload = payload as (() => Promise<C>);
    pathReader.readSelector(selector);
    const bypassPromiseFor = ((updateOptions || {}) as any).bypassPromiseFor || 0;
    const fullPath = pathReader.pathSegments.join('.') + (pathReader.pathSegments.length ? '.' : '') + suffix;
    if (libState.activePromises[fullPath]) { // prevent duplicate simultaneous requests
      return libState.activePromises[fullPath];
    }
    const expirationDate = (storeResult().read().promiseBypassTimes || {})[fullPath];
    if (expirationDate && (new Date(expirationDate).getTime() > new Date().getTime())) {
      return Promise.resolve(storeResult(selector as any).read());
    }
    const result = asyncPayload()
      .then(res => {
        const involvesCaching = !!updateOptions && !(typeof (updateOptions) === 'string') && bypassPromiseFor;
        if (involvesCaching) {
          libState.transactionState = 'started';
        }
        processPayload(res);
        if (involvesCaching && bypassPromiseFor) {
          const cacheExpiry = toIsoString(new Date(new Date().getTime() + bypassPromiseFor));
          libState.transactionState = 'last';
          if (!storeResult().read().promiseBypassTimes) {
            storeResult(s => (s as any).promiseBypassTimes).replace({
              ...(storeResult().read().promiseBypassTimes || { [fullPath]: cacheExpiry }),
            })
          } else if (!storeResult().read().promiseBypassTimes[fullPath]) {
            storeResult(s => (s as any).promiseBypassTimes).insert({ [fullPath]: cacheExpiry });
          } else {
            storeResult(s => (s as any).promiseBypassTimes[fullPath]).replace(cacheExpiry);
          }
          try {
            setTimeout(() => {
              storeResult(s => (s as any).promiseBypassTimes).remove(fullPath);
            }, bypassPromiseFor);
          } catch (e) {
            // ignoring
          }
        }
        return storeResult(selector as any).read();
      }).finally(() => delete libState.activePromises[fullPath]);
    libState.activePromises[fullPath] = result;
    return result;
  } else {
    processPayload(payload as C);
  }
}

