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


// credit: https://github.com/debitoor/safe-json-stringify/blob/master/index.js
export const serialize = (arg: unknown) => {
  const hasProp = Object.prototype.hasOwnProperty;
  const throwsMessage = (err: unknown) => {
    return '[Throws: ' + (err ? (err as { message: unknown }).message : '?') + ']';
  }
  const safeGetValueFromPropertyOnObject = (obj: Record<string, unknown>, property: string) => {
    if (hasProp.call(obj, property)) {
      try {
        return obj[property];
      } catch (err) {
        return throwsMessage(err);
      }
    }
    return obj[property];
  }
  const ensureProperties = (obj: unknown) => {
    const seen = new Array<unknown>(); // store references to objects we have seen before
    const visit = (obj: unknown): unknown => {
      if (obj === null || typeof obj !== 'object') { return obj; }
      if (seen.indexOf(obj) !== -1) { return '[Circular]'; }
      seen.push(obj);
      if ('toJSON' in obj && typeof obj.toJSON === 'function') {
        try {
          const fResult = visit(obj.toJSON());
          seen.pop();
          return fResult;
        } catch (err) {
          return throwsMessage(err);
        }
      }
      if (Array.isArray(obj)) {
        const aResult = obj.map(visit);
        seen.pop();
        return aResult;
      }
      const result: Record<string, unknown> = Object.keys(obj).reduce((result, prop) => {
        // prevent faulty defined getter properties
        result[prop] = visit(safeGetValueFromPropertyOnObject(obj as Record<string, unknown>, prop));
        return result;
      }, {} as Record<string, unknown>);
      seen.pop();
      return result;
    };
    return visit(obj);
  }
  return JSON.stringify(ensureProperties(arg));
}
