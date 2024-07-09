import { augment } from './augment';
import { comparatorsPropMap, libState, testState, updatePropMap } from './constant';
import { StateAction } from './type';


export const enqueueMicroTask = (fn: () => void) => Promise.resolve().then(fn);

export const tupleIncludes = <Element extends string, Array extends readonly [...Element[]]>(element: Element, tuple: Array) => tuple.some(f => element.includes(f));

export const resetLibraryState = () => {
  testState.logLevel = 'none';
  testState.fakeDevtoolsMessage = null;
  testState.currentActionType = undefined;
  testState.currentActionTypeOrig = undefined;
  testState.currentActionPayload = undefined;
  libState.store = undefined;
  libState.state = undefined;
  libState.changeListeners = [];
  libState.changeArrayDeleteListeners = [];
  libState.changeArrayInsertListeners = [];
  libState.changeArrayUpdateListeners = [];
  libState.changeObjectDeleteListeners = [];
  libState.changeObjectInsertListeners = [];
  libState.changeObjectUpdateListeners = [];
  libState.initialState = undefined;
  libState.disableDevtoolsDispatch = false;
  libState.devtools = undefined;
  libState.updatedElements = new Map();
  libState.changeArrayListenerToListenerMap = new Map();
  libState.changedArrayPayloads = new Map();
  augment({ async: promise => promise() });
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

export const constructTypeStrings = (stateActions: StateAction[], nested: boolean) => stateActions.map(sa => constructTypeString(sa, nested)).join('.');

const map = { ...updatePropMap, ...comparatorsPropMap, '$at': true };
export const constructTypeString = ({ name, arg }: StateAction, nested: boolean): string => {
  if (!(name in map))
    return name;
  if (updatePropMap[name] || typeof (arg) === 'undefined')
    return `${name}()`;
  const { $state, $stateActions } = arg as { $stateActions: StateAction[], $state: unknown };
  if ($stateActions) {
    if (!nested)
      return `${name}(${JSON.stringify($state)})`;
    return `${name}( ${$stateActions.map(sa => constructTypeString(sa, nested)).join('.')} = ${JSON.stringify($state)} )`;
  }
  return `${name}(${JSON.stringify(arg)})`;
}
