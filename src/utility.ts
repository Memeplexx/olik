import { augment } from './augment';
import { comparators, libState, testState, updateFunctions } from './constant';
import { perf } from './performance';
import { DeepReadonlyArray, StateAction, Store, ValidJsonObject } from './type';
import { updatePropMap } from './type-check';
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
  augment({ async: promise => promise() });
  perf.clear();
};

export const isoDateRegexp = new RegExp(/^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)$/);

export const deserialize = <R>(arg?: string | null): R => {

  // IS THE STRING NULL OR UNDEFINED?
  if (arg === null || typeof arg === 'undefined')
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
export const fixCurrentAction = ({ name, arg }: { name: string, arg?: unknown }, nested: boolean): string => {
  return name.replace(regexp, match => {
    if (updatePropMap[match])
      return `${match}()`;
    if (typeof (arg) === 'undefined')
      return `${match}()`;
    const { $state, $stateActions } = arg as { $stateActions: StateAction[], $state: unknown };
    if ($stateActions) {
      if (!nested)
        return `${match}(${JSON.stringify($state)})`;
      return `${match}( ${$stateActions.map(sa => fixCurrentAction(sa, nested)).join('.')} = ${JSON.stringify($state)} )`;
    }
    return `${match}(${JSON.stringify(arg)})`;
  });
}

type PayloadType<T> = { [key in keyof T]: T[key] extends StoreInternal ? T[key]['$state'] : PayloadType<T[key]> }
const isArray = Array.isArray;
const typeCheckArray = ['undefined', 'number', 'string', 'boolean'];
export const extractPayload = <T>(payloadIncoming: T) => {
  const type = typeof (payloadIncoming);
  if (typeCheckArray.includes(type) || type !== 'object' || payloadIncoming === null || payloadIncoming instanceof Date )
    return payloadIncoming;
  testState.currentActionPayloadPaths = undefined;
  const payloadPaths = newRecord<string>();
  const sanitizePayload = (payload: T, path: string): PayloadType<T> => {
    if (typeCheckArray.includes(typeof (payload)) || payload === null || payload instanceof Date)
      return payload as PayloadType<T>;
    const { $state, $stateActions } = payload as { $stateActions: StateAction[], $state: T };
    if ($stateActions) {
      payloadPaths[path] = `${$stateActions.map(sa => fixCurrentAction(sa, true)).join('.')} = ${JSON.stringify($state)}`;
      return $state as PayloadType<T>;
    }
    if (isArray(payload))
      return payload.map((p, i) => sanitizePayload(p as T, !path ? i.toString() : `${path}.${i}`)) as PayloadType<T>;
    if (typeof (payload) === 'object' && payload !== null)
      return Object.keys(payload).reduce((prev, key) => {
        prev[key] = sanitizePayload((payload as ValidJsonObject)[key] as T, !path ? key.toString() : `${path}.${key.toString()}`);
        return prev;
      }, newRecord()) as PayloadType<T>;
    throw new Error();
  }
  const payload = sanitizePayload(payloadIncoming, '');
  if (Object.keys(payloadPaths).length)
    testState.currentActionPayloadPaths = payloadPaths;
  return payload;
}
