import { comparators, libState, testState, updateFunctions } from './constant';
import { Readable, Store } from './type';
import { is, newRecord } from './type-check';


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

export const resetLibraryState = () => {
  testState.logLevel = 'none';
  testState.fakeDevtoolsMessage = null;
  libState.store = undefined;
  libState.state = undefined;
  libState.changeListeners = [];
  libState.currentAction = undefined;
  libState.initialState = undefined;
  libState.disableDevtoolsDispatch = false;
  libState.derivations = new Map();
  libState.olikDevtools = undefined;
};

export const isoDateRegexp = new RegExp(/^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)$/);

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

  // IS THE STRING A DATE?
  if (isoDateRegexp.test(arg)) {
    return <R>new Date(arg)
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

export const enqueueMicroTask = (fn: () => void) => {
  Promise.resolve().then(fn)
}

export const toIsoStringInCurrentTz = (date: Date) => {
  const tzo = -date.getTimezoneOffset();
  const dif = tzo >= 0 ? '+' : '-';
  const pad = (num: number) => {
    const norm = Math.floor(Math.abs(num));
    return (norm < 10 ? '0' : '') + norm;
  };
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + 'T' + pad(date.getHours())
    + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds()) + dif + pad(tzo / 60) + ':' + pad(tzo % 60);
}

export const getStateOrStoreState = <T, A extends T | Readable<T>>(arg: A) => {
  return is.storeInternal(arg) ? arg.$state : arg;
}

const regexp = new RegExp([...comparators, ...updateFunctions, '$at'].map(c => `^\\${c}$`).join('|'), 'g');
export const fixCurrentAction = (action: { name: string, arg?: unknown }, nested: boolean): string => {
  return action.name.replace(regexp, match => {
    if (is.anyUpdateFunction(match)) {
      return `${match}()`;
    }
    if (is.undefined(action.arg)) {
      return `${match}()`;
    }
    if (is.storeInternal(action.arg)) {
      if (!nested) {
        return `${match}(${JSON.stringify(action.arg.$state)})`;
      }
      return `${match}( ${action.arg.$stateActions.map(sa => fixCurrentAction(sa, nested)).join('.')} = ${JSON.stringify(action.arg.$state)} )`;
    }
    return `${match}(${JSON.stringify(action.arg)})`;
  });
}

// Note: consumed by devtools
export const getPayloadOrigAndSanitized = <T>(payload: T): { found: boolean, payloadSanitized: T, payloadOriginal: T } => {
  // is this a standard non-array non-store object?
  if (is.record(payload) && !is.storeInternal(payload)) {
    return {
      found: Object.keys(payload).some(key => is.storeInternal(payload[key])),
      payloadSanitized: Object.keys(payload).reduce((prev, key) => Object.assign(prev, { [key]: getStateOrStoreState(payload[key]) }), newRecord()) as T,
      payloadOriginal: Object.keys(payload).reduce((prev, key) => Object.assign(prev, { [key]: stringifyPotentialPayloadStore(payload[key]) }), newRecord()) as T,
    }
  // else is this a potential store?
  } else {
    return {
      found: is.storeInternal(payload),
      payloadSanitized: getStateOrStoreState(payload) as T,
      payloadOriginal: stringifyPotentialPayloadStore(payload) as T
    }
  }
}

// Note: consumed by devtools
export const stringifyPotentialPayloadStore = (arg: unknown) => {
  if (is.storeInternal(arg)) {
    return `${arg.$stateActions.map(sa => fixCurrentAction(sa, true)).join('.')} = ${JSON.stringify(arg.$state)}`;
  }
  return arg;
}
