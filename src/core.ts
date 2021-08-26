import { augmentations } from './augmentations';
import { integrateStoreWithReduxDevtools } from './devtools-integration';
import * as array from './operators-array';
import * as general from './operators-general';
import * as ShapesExt from './shapes-external';
import * as ShapesInt from './shapes-internal';
import { libState } from './shared-state';
import * as shared from './shared-utils';

export function createStoreCore<S, T extends ShapesExt.ShapesExt>({
  state,
  devtoolsEnabled = true,
  devtoolsStoreName = document.title,
  actionTypesToIncludeTag = true,
  actionTypeTagAbbreviator = s => s,
  actionTypeWhereClauseMaxValueLength = 6,
  replaceExistingStoreIfItExists = true,
}: {
  state: S,
  devtoolsEnabled?: boolean,
  devtoolsStoreName?: string,
  actionTypesToIncludeTag?: boolean,
  actionTypeTagAbbreviator?: (tag: string) => string,
  actionTypesToIncludeWhereClause?: boolean,
  actionTypeWhereClauseMaxValueLength?: number,
  replaceExistingStoreIfItExists?: boolean,
}) {
  shared.validateState(state);
  const storeState = {
    currentState: shared.deepFreeze(state) as S,
    initialState: shared.deepFreeze(state) as S,
    bypassSelectorFunctionCheck: false,
    activeFutures: {},
    transactionActions: [],
    transactionState: 'none',
    transactionStartState: null,
    devtoolsDispatchListener: undefined,
    actionTypesToIncludeTag,
    actionTypeWhereClauseMaxValueLength,
    actionTypeTagAbbreviator,
    changeListeners: new Map<(ar: any) => any, (arg: S) => any>(),
    previousAction: {
      type: '',
      timestamp: 0,
      payloads: [],
      debounceTimeout: 0,
    },
  } as ShapesInt.StoreState<S>;
  const action = <C, X extends C & Array<any>>(selector: ShapesExt.Selector<S, C, X>) => {
    const where = (type: ShapesExt.FindOrFilter) => {
      const whereClauseSpecs = Array<{ filter: (arg: X[0]) => boolean, type: 'and' | 'or' | 'last' }>();
      const payloadWhereClauses = new Array<any>();
      const whereClauseStrings = Array<string>();
      const recurseWhere = (getProp => {
        const constructActions = (key: string, val: any, comparator: (e: X[0]) => boolean) => {
          shared.validateSelectorFn('getProp', storeState, getProp);
          const segs = !getProp ? [] : shared.readSelector(getProp);
          const criteria = (arg: X[0], comparator: (arg: X[0]) => boolean) => { segs.forEach(seg => arg = arg[seg]); return comparator(arg); };
          const el = segs.join('.') || 'element';
          payloadWhereClauses.push({ [(!whereClauseSpecs.length ? '' : whereClauseSpecs[whereClauseSpecs.length - 1].type + '.') + el + '.' + key]: val });
          const whereClauseString = `${el}).${key}(${val.toString().substring(0, actionTypeWhereClauseMaxValueLength)}`;
          const context = {
            whereClauseSpecs,
            whereClauseStrings,
            getCurrentState: () => storeState.currentState,
            criteria,
            recurseWhere,
            comparator,
            whereClauseString,
            selector,
            type,
            select,
            storeState,
            payloadWhereClauses,
          } as ShapesInt.ArrayOperatorState<S, C, X, ShapesExt.FindOrFilter, T>;
          const arrayActions = {
            and: array.and(context),
            or: array.or(context),
            replace: array.replace(context),
            patch: array.patch(context),
            remove: array.remove(context),
            onChange: array.onChange(context),
            read: array.read(context),
            invalidateCache: () => array.invalidateCache(context),
          } as ShapesExt.ArrayOfObjectsAction<X, ShapesExt.FindOrFilter, T>;
          Object.keys(augmentations.selection).forEach(name => (arrayActions as any)[name] = augmentations.selection[name](arrayActions as ShapesExt.StoreOrDerivation<C>));
          return arrayActions;
        };
        return {
          ...{
            eq: val => constructActions('eq', val, e => e === val),
            ne: val => constructActions('ne', val, e => e !== val),
            in: val => constructActions('in', val, e => val.includes(e)),
            ni: val => constructActions('ni', val, e => !val.includes(e)),
          } as ShapesExt.PredicateOptionsCommon<X, any, ShapesExt.FindOrFilter, T>,
          ...{
            gt: val => constructActions('gt', val, e => e > val),
            lt: val => constructActions('lt', val, e => e < val),
            gte: val => constructActions('gte', val, e => e >= val),
            lte: val => constructActions('lte', val, e => e <= val),
          } as ShapesExt.PredicateOptionsForNumber<X, any, ShapesExt.FindOrFilter, T>,
          ...{
            match: val => constructActions('match', val, e => e.match(val)),
          } as ShapesExt.PredicateOptionsForString<X, any, ShapesExt.FindOrFilter, T>,
        };
      }) as ShapesExt.StoreForAnArrayOfObjects<X, T>['filter'];
      return recurseWhere;
    };
    const getCoreActionsState = () => ({
      selector,
      isComponentStore: () => !!(coreActions as any).isComponentStore,
      storeState,
      select,
      initialState: storeState.initialState,
      getCurrentState: () => storeState.currentState,
    } as ShapesInt.CoreActionsState<S, C, X, T>)
    const coreActions = {
      deepMerge: general.deepMerge(getCoreActionsState()),
      remove: general.remove(getCoreActionsState()),
      patch: general.patchOrInsertIntoObject({ ...getCoreActionsState(), type: 'patch' }),
      insert: Array.isArray(selector(storeState.currentState))
        ? general.insertIntoArray(getCoreActionsState())
        : general.patchOrInsertIntoObject({ ...getCoreActionsState(), type: 'insert' }),
      removeAll: general.removeAll(getCoreActionsState()),
      replaceAll: general.replaceAll(getCoreActionsState()),
      patchAll: general.patchAll(getCoreActionsState()),
      reset: general.reset(getCoreActionsState()),
      replace: general.replace({ ...getCoreActionsState(), name: 'replace' }),
      upsertMatching: general.upsertMatching(getCoreActionsState()),
      filter: where('filter'),
      find: where('find'),
      onChange: general.onChange(selector, storeState.changeListeners),
      read: general.read(selector, () => storeState.currentState),
      invalidateCache: () => general.invalidateCache(selector, select),
      readInitial: () => selector(storeState.initialState),
      defineReset: (
        (initState: C, innerSelector) => () => general.replace({ ...getCoreActionsState(), name: 'reset' })(!innerSelector ? initState : innerSelector(initState), undefined as any)
      ) as ShapesInt.StoreForAComponentInternal<S, C>['defineReset'],
      renew: (state => storeState.currentState = shared.deepFreeze(state)) as ShapesInt.StoreWhichMayContainComponentStores<S, C, T>['renew'],
      increment: general.increment(getCoreActionsState()),
      storeState,
    } as ShapesExt.PredicateCustom<X, ShapesExt.FindOrFilter, T>
      | ShapesExt.ArrayOfObjectsAction<X, ShapesExt.FindOrFilter, T>
      | ShapesExt.StoreForAnArrayCommon<X, T>
      | ShapesExt.StoreForAnObject<C, T>
      | ShapesInt.StoreForAComponentInternal<S, C>
      | ShapesExt.StoreForAnArrayOfObjects<X, T>
      | ShapesInt.StoreWhichMayContainComponentStores<S, C, T>
      | ShapesExt.StoreForANumber<T>;
    Object.keys(augmentations.selection).forEach(name => (coreActions as any)[name] = augmentations.selection[name](coreActions as ShapesExt.StoreOrDerivation<C>));
    return coreActions;
  };

  const select = <X extends C & Array<any>, C = S>(selector: ((s: ShapesExt.DeepReadonly<S>) => C) = (s => s as any as C)) => {
    const selectorMod = selector as ShapesExt.Selector<S, C, X>;
    selectorMod(storeState.currentState);
    return action<C, X>(selectorMod) as any;
  };

  if (devtoolsEnabled && (!libState.applicationStore || replaceExistingStoreIfItExists)) {
    integrateStoreWithReduxDevtools({ store: select as any, storeState, name: devtoolsStoreName })
  }

  return select;
}
