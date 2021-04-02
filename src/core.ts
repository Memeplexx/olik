import { integrateStoreWithReduxDevtools } from './devtools-integration';
import * as array from './operators-array';
import * as arrayCustom from './operators-arraycustom';
import {
  insert,
  onChange,
  patch,
  read,
  removeAll,
  replace,
  replaceAll,
  upsertMatching,
  reset,
} from './operators-general';
import { defineRemoveNestedStore } from './operators-internal';
import {
  ArrayOfObjectsAction,
  DeepReadonly,
  FindOrFilter,
  OptionsForReduxDevtools,
  PredicateOptionsCommon,
  PredicateOptionsForBoolean,
  PredicateOptionsForNumber,
  PredicateOptionsForString,
  Selector,
  StoreForAnArrayOfObjects,
  StoreWhichIsNested,
  Tag,
  Trackability,
} from './shapes-external';
import {
  ArrayCustomState,
  ArrayOperatorState,
  NestedContainerStore,
  PreviousAction,
  StoreWhichIsNestedInternal,
  StoreWhichMayContainNestedStores,
  UpdateStateArgs,
} from './shapes-internal';
import { devtoolsDebounce } from './shared-consts';
import { libState } from './shared-state';
import { copyObject, createPathReader, deepFreeze, validateSelectorFn, validateState } from './shared-utils';

export function createStore<S, T extends Trackability>(context: {
  state: S,
  supportsTags: boolean,
  devtools: OptionsForReduxDevtools | false,
  nestedContainerStore?: NestedContainerStore,
  tagSanitizer?: (tag: string) => string,
}) {
  const { state, devtools, nestedContainerStore, supportsTags, tagSanitizer } = context;
  validateState(state);
  const changeListeners = new Map<(ar: any) => any, (arg: S) => any>();
  let pathReader = createPathReader(state);
  let currentState = deepFreeze(state) as S;
  let initialState = currentState;
  let devtoolsDispatchListener: ((action: { type: string, payload?: any }) => any) | undefined;
  const setDevtoolsDispatchListener = (listener: (action: { type: string, payload?: any }) => any) => devtoolsDispatchListener = listener;
  const action = <C, X extends C & Array<any>>(selector: Selector<S, C, X>) => {
    const where = (type: FindOrFilter) => {
      const whereClauseSpecs = Array<{ filter: (arg: X[0]) => boolean, type: 'and' | 'or' | 'last' }>();
      const whereClauseStrings = Array<string>();
      const recurseWhere = (getProp => {
        const getSegsAndCriteria = () => {
          validateSelectorFn('getProp', getProp);
          const segs = array.getSegments(selector, () => currentState, getProp);
          const criteria = (arg: X[0], fn: (arg: X[0]) => boolean) => {
            segs.forEach(seg => arg = arg[seg]);
            return fn(arg);
          };
          return { segs, criteria };
        }
        const constructActions = (whereClauseString: string, fn: (e: X[0]) => boolean) => {
          const context = {
            whereClauseSpecs, whereClauseStrings, getCurrentState: () => currentState, criteria: getSegsAndCriteria().criteria, recurseWhere, fn, whereClauseString, selector, updateState, type, changeListeners
          } as ArrayOperatorState<S, C, X, FindOrFilter, T>;
          return {
            and: array.and(context),
            or: array.or(context),
            replace: array.replace(context),
            patch: array.patch(context),
            remove: array.remove(context),
            onChange: array.onChange(context),
            read: array.read(context),
          } as ArrayOfObjectsAction<X, FindOrFilter, T>
        };
        return {
          ...{
            eq: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'} === ${val}`, e => e === val),
            ne: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'} !== ${val}`, e => e !== val),
            in: val => constructActions(`[${val.join(', ')}].includes(${getSegsAndCriteria().segs.join('.') || 'element'})`, e => val.includes(e)),
            ni: val => constructActions(`![${val.join(', ')}].includes(${getSegsAndCriteria().segs.join('.') || 'element'})`, e => !val.includes(e)),
          } as PredicateOptionsCommon<X, any, FindOrFilter, T>,
          ...{
            returnsTrue: () => {
              const predicate = getProp as any as (element: DeepReadonly<X[0]>) => boolean;
              const context = { type, updateState, selector, predicate, changeListeners, getCurrentState: () => currentState } as ArrayCustomState<S, C, X, T>;
              return {
                remove: arrayCustom.remove(context),
                replace: arrayCustom.replace(context),
                patch: arrayCustom.patch(context),
                onChange: arrayCustom.onChange(context),
                read: arrayCustom.read(context),
              };
            }
          } as PredicateOptionsForBoolean<X, FindOrFilter, T>,
          ...{
            gt: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'} > ${val}`, e => e > val),
            lt: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'} < ${val}`, e => e < val),
            gte: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'} >= ${val}`, e => e >= val),
            lte: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'} <= ${val}`, e => e <= val),
          } as PredicateOptionsForNumber<X, any, FindOrFilter, T>,
          ...{
            match: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'}.match(${val})`, e => e.match(val)),
          } as PredicateOptionsForString<X, any, FindOrFilter, T>,
        };
      }) as StoreForAnArrayOfObjects<X, T>['whereMany'];
      return recurseWhere;
    };
    const coreActions = {
      patch: patch(selector, updateState, () => !!coreActions.removeFromContainingStore),
      insert: insert(selector, updateState, () => !!coreActions.removeFromContainingStore),
      removeAll: removeAll(selector, updateState, () => !!coreActions.removeFromContainingStore),
      replaceAll: replaceAll(pathReader, updateState, selector, () => !!coreActions.removeFromContainingStore),
      reset: reset(pathReader, updateState, selector, initialState, () => !!coreActions.removeFromContainingStore),
      replace: replace(pathReader, updateState, selector, 'replace', () => !!coreActions.removeFromContainingStore),
      upsertMatching: upsertMatching(selector, () => currentState, updateState, () => !!coreActions.removeFromContainingStore),
      whereMany: where('filter'),
      whereOne: where('find'),
      onChange: onChange(selector, changeListeners),
      read: read(selector, () => currentState),
      readInitial: () => selector(initialState),
      defineRemoveNestedStore: defineRemoveNestedStore(() => currentState, updateState, nestedContainerStore),
      defineReset: (
        (initState: C) => () => replace(pathReader, updateState, (e => selector(e)) as Selector<S, C, X>, 'reset', () => !!coreActions.removeFromContainingStore)(initState, undefined as Tag<T>)
      ) as StoreWhichIsNestedInternal<S, C>['defineReset'],
      renew: (state => {
        pathReader = createPathReader(state);
        currentState = deepFreeze(state) as S;
      }) as StoreWhichMayContainNestedStores<S, C, T>['renew'],
      supportsTags: supportsTags,
    } as unknown as StoreWhichIsNested<C>;
    return coreActions;
  };

  const storeResult = <X extends C & Array<any>, C = S>(selector: ((s: DeepReadonly<S>) => C) = (s => s as any as C)) => {
    const selectorMod = selector as Selector<S, C, X>;
    selectorMod(currentState);
    return action<C, X>(selectorMod) as any;
  };

  const previousAction = {
    type: '',
    timestamp: 0,
    payloads: [],
    debounceTimeout: 0,
  } as PreviousAction;

  function updateState<C, T extends Trackability, X extends C = C>(specs: UpdateStateArgs<S, C, T, X>) {
    const previousState = currentState;
    const pathSegments = specs.pathSegments || pathReader.readSelector(specs.selector);
    const result = Object.freeze(copyObject(currentState, { ...currentState }, pathSegments.slice(), specs.replacer));
    specs.mutator(specs.selector(pathReader.mutableStateCopy) as X);
    currentState = result;
    notifySubscribers(previousState, result);
    const actionToDispatch = {
      type: (specs.actionNameOverride ? specs.actionName : (pathSegments.join('.') + (pathSegments.length ? '.' : '') + specs.actionName)) +
        (specs.tag ? ` [${tagSanitizer ? tagSanitizer(specs.tag as string) : specs.tag}]` : ''),
      ...((specs.getPayloadFn && (specs.getPayloadFn() !== undefined)) ? specs.getPayloadFn() : specs.payload),
    };
    const { type, ...actionPayload } = actionToDispatch;
    libState.currentAction = actionToDispatch;
    libState.currentMutableState = pathReader.mutableStateCopy as any;
    if (devtoolsDispatchListener && (!specs.tag || (specs.tag !== 'dontTrackWithDevtools'))) {
      const dispatchToDevtools = (payload?: any[]) => {
        const action = payload ? { ...actionToDispatch, batched: payload } : actionToDispatch;
        libState.currentActionForDevtools = action;
        devtoolsDispatchListener!(action);
      }
      if (previousAction.debounceTimeout) {
        window.clearTimeout(previousAction.debounceTimeout);
        previousAction.debounceTimeout = 0;
      }
      if (previousAction.type !== type) {
        previousAction.type = type;
        previousAction.payloads = [actionPayload];
        dispatchToDevtools();
        previousAction.debounceTimeout = window.setTimeout(() => {
          previousAction.type = '';
          previousAction.payloads = [];
        }, devtoolsDebounce);
      } else {
        if (previousAction.timestamp < (Date.now() - devtoolsDebounce)) {
          previousAction.payloads = [actionPayload];
        } else {
          previousAction.payloads.push(actionPayload);
        }
        previousAction.timestamp = Date.now();
        previousAction.debounceTimeout = window.setTimeout(() => {
          dispatchToDevtools(previousAction.payloads.slice(0, previousAction.payloads.length - 1));
          previousAction.type = '';
          previousAction.payloads = [];
        }, devtoolsDebounce);
      }
    }
  }

  function notifySubscribers(oldState: S, newState: S) {
    changeListeners.forEach((selector, subscriber) => {
      const selectedNewState = selector(newState);
      const selectedOldState = selector(oldState);
      if (selectedOldState && selectedOldState.$filtered && selectedNewState && selectedNewState.$filtered) {
        if ((selectedOldState.$filtered.length !== selectedNewState.$filtered.length)
          || !(selectedOldState.$filtered as Array<any>).every(element => selectedNewState.$filtered.includes(element))) {
          subscriber(selectedNewState.$filtered);
        }
      } else if (selectedOldState !== selectedNewState) {
        subscriber(selectedNewState);
      }
    })
  }

  if (devtools !== false) {
    integrateStoreWithReduxDevtools<S>(storeResult as any, devtools, setDevtoolsDispatchListener);
  }

  return storeResult;
}
