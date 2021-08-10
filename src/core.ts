import { augmentations } from './augmentations';
import { integrateStoreWithReduxDevtools } from './devtools-integration';
import * as array from './operators-array';
import * as arrayCustom from './operators-arraycustom';
import {
  deepMerge,
  insertIntoArray,
  onChange,
  patchOrInsertIntoObject,
  read,
  remove,
  removeAll,
  replace,
  replaceAll,
  reset,
  stopBypassingPromises,
  upsertMatching,
} from './operators-general';
import {
  ArrayOfObjectsAction,
  DeepReadonly,
  FindOrFilter,
  OptionsForReduxDevtools,
  PredicateCustom,
  PredicateOptionsCommon,
  PredicateOptionsForBoolean,
  PredicateOptionsForNumber,
  PredicateOptionsForString,
  Selector,
  StoreForAnArrayCommon,
  StoreForAnArrayOfObjects,
  StoreForAnObject,
  StoreOrDerivation,
  Trackability,
} from './shapes-external';
import {
  ArrayCustomState,
  ArrayOperatorState,
  CoreActionsState,
  StoreForAComponentInternal,
  StoreState,
  StoreWhichMayContainComponentStores,
} from './shapes-internal';
import { deepFreeze, readSelector, validateSelectorFn, validateState } from './shared-utils';

export function createStoreCore<S, T extends Trackability>({
  state,
  devtools,
  tagSanitizer,
  tagsToAppearInType
}: {
  state: S,
  devtools: OptionsForReduxDevtools | false,
  tagSanitizer?: (tag: string) => string,
  tagsToAppearInType?: boolean,
}) {
  validateState(state);
  const storeState = {
    currentState: deepFreeze(state) as S,
    initialState: deepFreeze(state) as S,
    bypassSelectorFunctionCheck: false,
    activeFutures: {},
    transactionActions: [],
    transactionState: 'none',
    transactionStartState: null,
    devtoolsDispatchListener: undefined,
    tagsToAppearInType,
    tagSanitizer,
    changeListeners: new Map<(ar: any) => any, (arg: S) => any>(),
    previousAction: {
      type: '',
      timestamp: 0,
      payloads: [],
      debounceTimeout: 0,
    },
  } as StoreState<S>;
  const action = <C, X extends C & Array<any>>(selector: Selector<S, C, X>) => {
    const where = (type: FindOrFilter) => {
      const whereClauseSpecs = Array<{ filter: (arg: X[0]) => boolean, type: 'and' | 'or' | 'last' }>();
      const whereClauseStrings = Array<string>();
      const recurseWhere = (getProp => {
        const getSegsAndCriteria = () => {
          validateSelectorFn('getProp', storeState, getProp);
          const segs = !getProp ? [] : readSelector(getProp);
          const criteria = (arg: X[0], fn: (arg: X[0]) => boolean) => {
            segs.forEach(seg => arg = arg[seg]);
            return fn(arg);
          };
          return { segs, criteria };
        }
        const constructActions = (whereClauseString: string, fn: (e: X[0]) => boolean) => {
          const context = {
            whereClauseSpecs,
            whereClauseStrings,
            getCurrentState: () => storeState.currentState,
            criteria: getSegsAndCriteria().criteria,
            recurseWhere,
            fn,
            whereClauseString,
            selector,
            type,
            storeResult,
            storeState,
          } as ArrayOperatorState<S, C, X, FindOrFilter, T>;
          const arrayActions = {
            andWhere: array.andWhere(context),
            orWhere: array.orWhere(context),
            replace: array.replace(context),
            patch: array.patch(context),
            remove: array.remove(context),
            onChange: array.onChange(context),
            read: array.read(context),
            stopBypassingPromises: () => array.stopBypassingPromises(context),
          } as ArrayOfObjectsAction<X, FindOrFilter, T>;
          Object.keys(augmentations.selection).forEach(name => (arrayActions as any)[name] = augmentations.selection[name](arrayActions as StoreOrDerivation<C>));
          return arrayActions;
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
              const context = {
                type,
                selector,
                predicate,
                getCurrentState: () => storeState.currentState,
                storeResult,
                storeState,
              } as ArrayCustomState<S, C, X, T>;
              const elementActions = {
                remove: arrayCustom.remove(context),
                replace: arrayCustom.replace(context),
                patch: arrayCustom.patch(context),
                onChange: arrayCustom.onChange(context),
                read: arrayCustom.read(context),
                stopBypassingPromises: () => arrayCustom.stopBypassingPromises(context),
              };
              Object.keys(augmentations.selection).forEach(name => (elementActions as any)[name] = augmentations.selection[name](elementActions as StoreOrDerivation<C>));
              return elementActions;
            }
          } as PredicateOptionsForBoolean<X, FindOrFilter, T>,
          ...{
            gt: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'} > ${val}`, e => e > val),
            lt: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'} < ${val}`, e => e < val),
            gte: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'} >= ${val}`, e => e >= val),
            lte: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'} <= ${val}`, e => e <= val),
          } as PredicateOptionsForNumber<X, any, FindOrFilter, T>,
          ...{
            matches: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'}.match(${val})`, e => e.match(val)),
          } as PredicateOptionsForString<X, any, FindOrFilter, T>,
        };
      }) as StoreForAnArrayOfObjects<X, T>['filterWhere'];
      return recurseWhere;
    };
    const getCoreActionsState = () => ({
      selector,
      isComponentStore: () => !!(coreActions as any).isComponentStore,
      storeState,
      storeResult,
      initialState: storeState.initialState,
      getCurrentState: () => storeState.currentState,
    } as CoreActionsState<S, C, X, T>)
    const coreActions = {
      deepMerge: deepMerge(getCoreActionsState()),
      remove: remove(getCoreActionsState()),
      patch: patchOrInsertIntoObject({ ...getCoreActionsState(), type: 'patch' }),
      insert: Array.isArray(selector(storeState.currentState))
        ? insertIntoArray(getCoreActionsState())
        : patchOrInsertIntoObject({ ...getCoreActionsState(), type: 'insert' }),
      removeAll: removeAll(getCoreActionsState()),
      replaceAll: replaceAll(getCoreActionsState()),
      reset: reset(getCoreActionsState()),
      replace: replace({ ...getCoreActionsState(), name: 'replace' }),
      upsertMatching: upsertMatching(getCoreActionsState()),
      filterWhere: where('filter'),
      findWhere: where('find'),
      onChange: onChange(selector, storeState.changeListeners),
      read: read(selector, () => storeState.currentState),
      stopBypassingPromises: () => stopBypassingPromises(selector, storeResult),
      readInitial: () => selector(storeState.initialState),
      defineReset: (
        (initState: C, innerSelector) => () => replace({ ...getCoreActionsState(), name: 'reset' })(!innerSelector ? initState : innerSelector(initState), undefined as any)
      ) as StoreForAComponentInternal<S, C>['defineReset'],
      renew: (state => storeState.currentState = deepFreeze(state)) as StoreWhichMayContainComponentStores<S, C, T>['renew'],
      storeState,
    } as PredicateCustom<X, FindOrFilter, T>
      | ArrayOfObjectsAction<X, FindOrFilter, T>
      | StoreForAnArrayCommon<X, T>
      | StoreForAnObject<C, T>
      | StoreForAComponentInternal<S, C>
      | StoreForAnArrayOfObjects<X, T>
      | StoreWhichMayContainComponentStores<S, C, T>;
    Object.keys(augmentations.selection).forEach(name => (coreActions as any)[name] = augmentations.selection[name](coreActions as StoreOrDerivation<C>));
    return coreActions;
  };

  const storeResult = <X extends C & Array<any>, C = S>(selector: ((s: DeepReadonly<S>) => C) = (s => s as any as C)) => {
    const selectorMod = selector as Selector<S, C, X>;
    selectorMod(storeState.currentState);
    return action<C, X>(selectorMod) as any;
  };

  if (devtools !== false) {
    integrateStoreWithReduxDevtools<S>(storeResult as any, devtools, storeState);
  }

  return storeResult;
}
