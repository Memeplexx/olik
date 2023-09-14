import { libState, testState } from './constant';
import { Store } from './type';
import { is } from './type-check';


export const deepFreeze = <T>(o: T): T => {
  Object.freeze(o);
  if (o == null || o === undefined) { return o; }
  (<Array<keyof typeof o>>Object.keys(o)).forEach(prop => {
    if (is.record(o) || Array.isArray(o)) {
      deepFreeze(o[prop]);
    }
  })
  return o;
}

export const getStore = <S>() => libState.store as Store<S>;

export const getInnerStores = () => libState.innerStores;

export const resetLibraryState = () => {
  testState.logLevel = 'none';
  libState.store = undefined;
  libState.isInsideTransaction = false;
  libState.innerStores.clear();
  libState.state = undefined;
  libState.changeListeners = [];
  libState.currentActions = [];
  libState.initialState = undefined;
  libState.disableDevtoolsDispatch = false;
  libState.derivations = new Map();
};

export const deserialize = <R>(arg?: string | null): R => {

  // IS THE STRING NULL OR UNDEFINED?
  if (arg === null || arg === undefined) {
    return <R>arg
  }

  // IS THE STRING 'undefined'?
  if (arg === 'undefined') {
    return <R>undefined
  }

  // IS THE STRING EMPTY?
  if (arg === '') {
    return <R>arg
  }

  // IS THE STRING A NUMBER?
  if (!isNaN(Number(arg))) {
    return <R>parseFloat(arg)
  }

  // IS THE STRING A BOOLEAN?
  if (arg === 'true') {
    return <R>true
  }
  if (arg === 'false') {
    return <R>false
  }

  // IS THE STRING JSON?
  try {
    const potentiallyParsableJson = arg
      // wrap all strings wrapped in single quotes with double quotes
      .replace(/'([^']+)'/g, '"$1"')
      // wrap all unquoted keys in double quotes
      .replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":')
      // remove all trailing commas
      .replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')

    return JSON.parse(potentiallyParsableJson)
  } catch (e) {

    // WE'VE RUN OUT OF OPTIONS, JUST RETURN THE STRING
    return <R>arg
  }
}


export function serialize(val: unknown, depth: number, onGetObjID?: (val: object) => string): string {
  depth = isNaN(+depth) ? 1 : depth;
  const recursMap = new WeakMap();
  function _build(val: unknown, depth: number, o?: unknown, a?: boolean, r?: boolean) {
    return !val || typeof val != 'object' ? val
      : (r = recursMap.has(val),
        recursMap.set(val, true),
        a = Array.isArray(val),
        r ? (o = onGetObjID && onGetObjID(val) || null) : JSON.stringify(val, function (k, v) {
          if (a || depth > 0) {
            if (!k) { return (a = Array.isArray(v), val = v); }
            !o && (o = a ? [] : {});
            (o as Record<string, unknown>)[k] = _build(v, a ? depth : depth - 1);
          }
        }),
        o === void 0 ? (a ? [] : {}) : o);
  }
  return JSON.stringify(_build(val, depth));
}