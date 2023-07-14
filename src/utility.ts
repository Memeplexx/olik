import { libState, testState } from './constant';
import { RecursiveRecord, Store } from './type';
import { is } from './type-check';
import { StoreInternal } from './type-internal';


export const deepFreeze = <T>(o: T): T => {
  Object.freeze(o);
  if (o == null || o === undefined) { return o; }
  (Object.keys(o) as (Array<keyof typeof o>)).forEach(prop => {
    if (is.record(o) || is.arrayOf.actual(o)) {
      deepFreeze(o[prop]);
    }
  })
  return o;
}

export const getStore = () => libState.store as Store<RecursiveRecord> | undefined;

export const getInnerStores = () => libState.innerStores;

export const resetLibraryState = () => {
  testState.logLevel = 'none';
  libState.store = undefined as StoreInternal<RecursiveRecord> | undefined;
  libState.isInsideTransaction = false;
  libState.innerStores.clear();
  libState.detached = [];
};

export const deserialize = <R>(arg?: string | null): R => {

  // IS THE STRING NULL OR UNDEFINED?
  if (arg === null || arg === undefined) {
    return arg as R
  }

  // IS THE STRING 'undefined'?
  if (arg === 'undefined') {
    return undefined as R
  }

  // IS THE STRING EMPTY?
  if (arg === '') {
    return arg as R
  }

  // IS THE STRING A NUMBER?
  if (!isNaN(Number(arg))) {
    return parseFloat(arg) as R;
  }

  // IS THE STRING A BOOLEAN?
  if (arg === 'true') {
    return true as R
  }
  if (arg === 'false') {
    return false as R
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
    return arg as R
  }
}