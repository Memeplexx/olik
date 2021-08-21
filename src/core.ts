import { augmentations } from './augmentations';
import { integrateStoreWithReduxDevtools } from './devtools-integration';
import * as array from './operators-array';
import * as arrayCustom from './operators-array-returnstrue';
import {
  deepMerge,
  increment,
  insertIntoArray,
  onChange,
  patchAll,
  patchOrInsertIntoObject,
  read,
  remove,
  removeAll,
  replace,
  replaceAll,
  reset,
  invalidateCache,
  upsertMatching,
} from './operators-general';
import {
  ArrayOfObjectsAction,
  DeepReadonly,
  FindOrFilter,
  PredicateCustom,
  PredicateOptionsCommon,
  PredicateOptionsForBoolean,
  PredicateOptionsForNumber,
  PredicateOptionsForString,
  Selector,
  StoreForAnArrayCommon,
  StoreForAnArrayOfObjects,
  StoreForAnObject,
  StoreForANumber,
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
import { libState } from './shared-state';
import { deepFreeze, readSelector, validateSelectorFn, validateState } from './shared-utils';

export function createStoreCore<S, T extends Trackability>({
  state,
  devtoolsEnabled = true,
  devtoolsStoreName = document.title,
  actionTypesToIncludeTag = true,
  actionTypeTagAbbreviator = s => s,
  actionTypesToIncludeWhereClause = true,
  actionTypeWhereClauseAbbreviator = s => s,
  replaceExistingStoreIfItExists = true,
}: {
  state: S,
  devtoolsEnabled?: boolean,
  devtoolsStoreName?: string,
  actionTypesToIncludeTag?: boolean,
  actionTypeTagAbbreviator?: (tag: string) => string,
  actionTypesToIncludeWhereClause?: boolean,
  actionTypeWhereClauseAbbreviator?: (tag: string) => string,
  replaceExistingStoreIfItExists?: boolean,
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
    actionTypesToIncludeTag,
    actionTypesToIncludeWhereClause,
    actionTypeTagAbbreviator,
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
      const payloadWhereClauses = new Array<any>();
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
            payloadWhereClauses,
          } as ArrayOperatorState<S, C, X, FindOrFilter, T>;
          const arrayActions = {
            andWhere: array.andWhere(context),
            orWhere: array.orWhere(context),
            replace: array.replace(context),
            patch: array.patch(context),
            remove: array.remove(context),
            onChange: array.onChange(context),
            read: array.read(context),
            invalidateCache: () => array.invalidateCache(context),
          } as ArrayOfObjectsAction<X, FindOrFilter, T>;
          Object.keys(augmentations.selection).forEach(name => (arrayActions as any)[name] = augmentations.selection[name](arrayActions as StoreOrDerivation<C>));
          return arrayActions;
        };
        return {
          ...{
            eq: val => {
              const el = getSegsAndCriteria().segs.join('.') || 'element';
              payloadWhereClauses.push({ [(!whereClauseSpecs.length ? '' : whereClauseSpecs[whereClauseSpecs.length - 1].type + '.') + el + '.eq']: val });
              return constructActions(`${el}).eq(${val}`, e => e === val);
            },
            ne: val => {
              const el = getSegsAndCriteria().segs.join('.') || 'element';
              payloadWhereClauses.push({ [(!whereClauseSpecs.length ? '' : whereClauseSpecs[whereClauseSpecs.length - 1].type + '.') + el + '.ne']: val });
              return constructActions(`${el}).ne(${val}`, e => e !== val);
            },
            in: val => {
              const el = getSegsAndCriteria().segs.join('.') || 'element';
              payloadWhereClauses.push({ [(!whereClauseSpecs.length ? '' : whereClauseSpecs[whereClauseSpecs.length - 1].type + '.') + el + '.in']: val });
              return constructActions(`${el}).in(${val.join(',')}`, e => val.includes(e));
            },
            ni: val => {
              const el = getSegsAndCriteria().segs.join('.') || 'element';
              payloadWhereClauses.push({ [(!whereClauseSpecs.length ? '' : whereClauseSpecs[whereClauseSpecs.length - 1].type + '.') + el + '.ni']: val });
              return constructActions(`${el}).ni(${val.join(',')}`, e => !val.includes(e));
            },
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
                invalidateCache: () => arrayCustom.invalidateCache(context),
              };
              Object.keys(augmentations.selection).forEach(name => (elementActions as any)[name] = augmentations.selection[name](elementActions as StoreOrDerivation<C>));
              return elementActions;
            }
          } as PredicateOptionsForBoolean<X, FindOrFilter, T>,
          ...{
            gt: val => {
              const el = getSegsAndCriteria().segs.join('.') || 'element';
              payloadWhereClauses.push({ [(!whereClauseSpecs.length ? '' : whereClauseSpecs[whereClauseSpecs.length - 1].type + '.') + el + '.gt']: val });
              return constructActions(`${el}).gt(${val}`, e => e > val);
            },
            lt: val => {
              const el = getSegsAndCriteria().segs.join('.') || 'element';
              payloadWhereClauses.push({ [(!whereClauseSpecs.length ? '' : whereClauseSpecs[whereClauseSpecs.length - 1].type + '.') + el + '.lt']: val });
              return constructActions(`${el}).lt(${val}`, e => e < val);
            },
            gte: val => {
              const el = getSegsAndCriteria().segs.join('.') || 'element';
              payloadWhereClauses.push({ [(!whereClauseSpecs.length ? '' : whereClauseSpecs[whereClauseSpecs.length - 1].type + '.') + el + '.gte']: val });
              return constructActions(`${el}).gte(${val}`, e => e >= val);
            },
            lte: val => {
              const el = getSegsAndCriteria().segs.join('.') || 'element';
              payloadWhereClauses.push({ [(!whereClauseSpecs.length ? '' : whereClauseSpecs[whereClauseSpecs.length - 1].type + '.') + el + '.lte']: val });
              return constructActions(`${el}).lte(${val}`, e => e <= val);
            },
          } as PredicateOptionsForNumber<X, any, FindOrFilter, T>,
          ...{
            matches: val => {
              const el = getSegsAndCriteria().segs.join('.') || 'element';
              payloadWhereClauses.push({ [(!whereClauseSpecs.length ? '' : whereClauseSpecs[whereClauseSpecs.length - 1].type + '.') + el + '.match']: val });
              return constructActions(`${el}).match(${val}`, e => e.match(val));
            },
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
      patchAll: patchAll(getCoreActionsState()),
      reset: reset(getCoreActionsState()),
      replace: replace({ ...getCoreActionsState(), name: 'replace' }),
      upsertMatching: upsertMatching(getCoreActionsState()),
      filterWhere: where('filter'),
      findWhere: where('find'),
      onChange: onChange(selector, storeState.changeListeners),
      read: read(selector, () => storeState.currentState),
      invalidateCache: () => invalidateCache(selector, storeResult),
      readInitial: () => selector(storeState.initialState),
      defineReset: (
        (initState: C, innerSelector) => () => replace({ ...getCoreActionsState(), name: 'reset' })(!innerSelector ? initState : innerSelector(initState), undefined as any)
      ) as StoreForAComponentInternal<S, C>['defineReset'],
      renew: (state => storeState.currentState = deepFreeze(state)) as StoreWhichMayContainComponentStores<S, C, T>['renew'],
      increment: increment(getCoreActionsState()),
      storeState,
    } as PredicateCustom<X, FindOrFilter, T>
      | ArrayOfObjectsAction<X, FindOrFilter, T>
      | StoreForAnArrayCommon<X, T>
      | StoreForAnObject<C, T>
      | StoreForAComponentInternal<S, C>
      | StoreForAnArrayOfObjects<X, T>
      | StoreWhichMayContainComponentStores<S, C, T>
      | StoreForANumber<T>;
    Object.keys(augmentations.selection).forEach(name => (coreActions as any)[name] = augmentations.selection[name](coreActions as StoreOrDerivation<C>));
    return coreActions;
  };

  const storeResult = <X extends C & Array<any>, C = S>(selector: ((s: DeepReadonly<S>) => C) = (s => s as any as C)) => {
    const selectorMod = selector as Selector<S, C, X>;
    selectorMod(storeState.currentState);
    return action<C, X>(selectorMod) as any;
  };

  if (devtoolsEnabled && (!libState.applicationStore || replaceExistingStoreIfItExists)) {
    integrateStoreWithReduxDevtools({ store: storeResult as any, storeState, name: devtoolsStoreName })
  }

  return storeResult;
}
