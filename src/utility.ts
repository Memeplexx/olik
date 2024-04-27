import { comparators, libState, testState, updateFunctions } from './constant';
import { perf } from './performance';
import { DeepReadonlyArray, Store } from './type';
import { is } from './type-check';
import { StoreInternal } from './type-internal';


export const getStore = <S>() => libState.store as Store<S>;

export const doThrow = () => { throw new Error(); }

export const newRecord = <V = unknown>() => ({} as Record<string, V>);

export const newArray = <T>() => new Array<T>() as DeepReadonlyArray<T>;

export const objectKeys = <T extends object>(o: T): Array<keyof T> => Object.keys(o) as Array<keyof T>;

export const enqueueMicroTask = (fn: () => void) => Promise.resolve().then(fn);

export const tupleIncludes = <Element extends string, Array extends readonly [...Element[]]>(element: Element, tuple: Array) => tuple.some(f => element.includes(f));

export const resetLibraryState = () => {
  testState.logLevel = 'none';
  testState.fakeDevtoolsMessage = null;
  testState.currentActionType = undefined;
  testState.currentActionTypeOrig = undefined;
  testState.currentActionPayload = undefined;
  testState.currentActionPayloadPaths = undefined;
  libState.store = undefined;
  libState.state = undefined;
  libState.changeListeners = [];
  libState.initialState = undefined;
  libState.disableDevtoolsDispatch = false;
  libState.derivations = new Map();
  libState.devtools = undefined;
  perf.clear();
};

export const isoDateRegexp = new RegExp(/^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)$/);

export const deserialize = <R>(arg?: string | null): R => {

  // IS THE STRING NULL OR UNDEFINED?
  if (is.null(arg) || is.undefined(arg))
    return <R>arg

  // IS THE STRING 'undefined'?
  if (arg === 'undefined')
    return <R>undefined

  // IS THE STRING EMPTY?
  if (arg === '')
    return <R>undefined

  // IS THE STRING A NUMBER?
  if (!isNaN(Number(arg)))
    return <R>parseFloat(arg)

  // IS THE STRING A BOOLEAN?
  if (arg === 'true')
    return <R>true
  if (arg === 'false')
    return <R>false

  // IS THE STRING A DATE?
  if (isoDateRegexp.test(arg))
    return <R>new Date(arg)

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

const regexp = new RegExp([...comparators, ...updateFunctions, '$at'].map(c => `^\\${c}$`).join('|'), 'g');
export const fixCurrentAction = (action: { name: string, arg?: unknown }, nested: boolean): string => {
  return action.name.replace(regexp, match => {
    if (is.anyUpdateFunction(match))
      return `${match}()`;
    if (is.undefined(action.arg))
      return `${match}()`;
    if (is.storeInternal(action.arg)) {
      if (!nested)
        return `${match}(${JSON.stringify(action.arg.$state)})`;
      return `${match}( ${action.arg.$stateActions.map(sa => fixCurrentAction(sa, nested)).join('.')} = ${JSON.stringify(action.arg.$state)} )`;
    }
    return `${match}(${JSON.stringify(action.arg)})`;
  });
}

type PayloadType<T> = { [key in keyof T]: T[key] extends StoreInternal ? T[key]['$state'] : PayloadType<T[key]> }
export const extractPayload = <T>(payloadIncoming: T) => {
  testState.currentActionPayloadPaths = undefined;
  if (is.undefined(payloadIncoming) || is.null(payloadIncoming) || is.primitive(payloadIncoming) || is.date(payloadIncoming))
    return payloadIncoming;
  const payloadPaths = newRecord<string>();
  const sanitizePayload = (payload: T, path: string): PayloadType<T> => {
    if (is.primitive(payload) || is.date(payload) || is.null(payload) || is.undefined(payload))
      return payload as PayloadType<T>;
    if (is.storeInternal(payload)) {
      payloadPaths[path] = `${payload.$stateActions.map(sa => fixCurrentAction(sa, true)).join('.')} = ${JSON.stringify(payload.$state)}`;
      return payload.$state as PayloadType<T>;
    }
    if (is.array(payload))
      return payload.map((p, i) => sanitizePayload(p as T, !path ? i.toString() : `${path}.${i}`)) as PayloadType<T>;
    if (is.record(payload))
      return Object.keys(payload).reduce((prev, key) => {
        prev[key] = sanitizePayload(payload[key] as T, !path ? key.toString() : `${path}.${key.toString()}`);
        return prev;
      }, newRecord()) as PayloadType<T>;
    throw new Error();
  }
  const payload = sanitizePayload(payloadIncoming, '');
  if (Object.keys(payloadPaths).length)
    testState.currentActionPayloadPaths = payloadPaths;
  return payload;
}
