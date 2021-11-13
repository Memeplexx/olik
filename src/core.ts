import { augmentations } from './augmentations';
import { integrateStoreWithReduxDevtools } from './devtools-integration';
import * as array from './operators-array';
import * as general from './operators-general';
import * as ShapesExt from './shapes-external';
import * as ShapesInt from './shapes-internal';
import { libState } from './shared-state';
import * as shared from './shared-utils';

export function createStoreCore<S, T extends ShapesExt.Trackability>({
  state,
  actionTypesToIncludeTag = true,
  actionTypeTagAbbreviator = s => s,
  actionTypeWhereClauseMaxValueLength = 6,
  replaceExistingStoreIfItExists = true,
  devtools,
  traceActions = false,
}: {
  state: S,
  actionTypesToIncludeTag?: boolean,
  actionTypeTagAbbreviator?: (tag: string) => string,
  actionTypesToIncludeWhereClause?: boolean,
  actionTypeWhereClauseMaxValueLength?: number,
  replaceExistingStoreIfItExists?: boolean,
  devtools?: any,
  traceActions?: boolean,
}) {
  shared.validateState(state);
  const storeState = {
    currentState: shared.deepFreeze(state) as S,
    initialState: shared.deepFreeze(state) as S,
    bypassSelectorFunctionCheck: false,
    activePromises: {},
    transactionActions: [],
    transactionState: 'none',
    transactionStartState: null,
    devtoolsDispatchListener: undefined,
    actionTypesToIncludeTag,
    actionTypeWhereClauseMaxValueLength,
    actionTypeTagAbbreviator,
    traceActions,
    changeListeners: new Map<(ar: any) => any, (arg: S) => any>(),
    previousAction: {
      type: '',
      timestamp: 0,
      payloads: [],
      debounceTimeout: 0,
    },
  } as ShapesInt.StoreState<S>;
  let stack: any;
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
          const el = segs.join('.') || '';
          payloadWhereClauses.push({ [(!whereClauseSpecs.length ? '' : whereClauseSpecs[whereClauseSpecs.length - 1].type + '.') + (el ? el + '.' : '') + key]: val });
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
            stack,
          } as ShapesInt.ArrayOperatorState<S, C, X, ShapesExt.FindOrFilter, T>;
          const arrayActions = {
            and: array.and(context),
            or: array.or(context),
            replace: array.replaceOrReplaceAll({ ...context, replaceAll: false }),
            replaceAll: array.replaceOrReplaceAll({ ...context, replaceAll: true }),
            patch: array.patchOrPatchAllOrDeepMerge({ ...context, deepMerge: false }),
            patchAll: array.patchOrPatchAllOrDeepMerge({ ...context, deepMerge: false }),
            deepMerge: array.patchOrPatchAllOrDeepMerge({ ...context, deepMerge: true }),
            remove: array.removeOrRemoveAll(context),
            removeAll: array.removeOrRemoveAll(context),
            onChange: array.onChange(context),
            read: array.read(context),
            invalidateCache: () => array.invalidateCache(context),
          } as ShapesExt.And<X, ShapesExt.FindOrFilter, T>
            & ShapesExt.Or<X, ShapesExt.FindOrFilter, T>
            & ShapesExt.ReplaceObjectElements<X, T>
            & ShapesExt.PatchAllElements<X, ShapesExt.FindOrFilter, T>
            & ShapesExt.RemoveObjectElement<T>
            & ShapesExt.RemoveAll<X, T>
            & ShapesExt.OnChange<X, ShapesExt.FindOrFilter>
            & ShapesExt.Read<X, ShapesExt.FindOrFilter>
            & ShapesExt.InvalidateCache;
          Object.keys(augmentations.selection).forEach(name => (arrayActions as any)[name] = augmentations.selection[name](arrayActions as any));
          return arrayActions;
        };
        return {
          eq: val => constructActions('eq', val, e => e === val),
          ne: val => constructActions('ne', val, e => e !== val),
          in: val => constructActions('in', val, e => val.includes(e)),
          ni: val => constructActions('ni', val, e => !val.includes(e)),
          gt: val => constructActions('gt', val, e => e > val),
          lt: val => constructActions('lt', val, e => e < val),
          gte: val => constructActions('gte', val, e => e >= val),
          lte: val => constructActions('lte', val, e => e <= val),
          match: val => constructActions('match', val, e => e.match(val)),
        } as ShapesExt.Eq<X, any, ShapesExt.FindOrFilter, T>
          & ShapesExt.Ne<X, any, ShapesExt.FindOrFilter, T>
          & ShapesExt.In<X, any, ShapesExt.FindOrFilter, T>
          & ShapesExt.Ni<X, any, ShapesExt.FindOrFilter, T>
          & ShapesExt.Gt<X, any, ShapesExt.FindOrFilter, T>
          & ShapesExt.Gte<X, any, ShapesExt.FindOrFilter, T>
          & ShapesExt.Lt<X, any, ShapesExt.FindOrFilter, T>
          & ShapesExt.Lte<X, any, ShapesExt.FindOrFilter, T>
          & ShapesExt.Match<X, ShapesExt.FindOrFilter, T>;
      }) as ShapesExt.PredicateFunctionObject<X, ShapesExt.FindOrFilter, T>;
      return recurseWhere;
    };
    const getCoreActionsState = () => ({
      selector,
      isComponentStore: () => !!(coreActions as any).isComponentStore,
      storeState,
      select,
      initialState: storeState.initialState,
      getCurrentState: () => storeState.currentState,
      stack,
    } as ShapesInt.CoreActionsState<S, C, X>)
    const coreActions = {
      remove: general.remove(getCoreActionsState()),
      deepMerge: general.patchOrDeepMerge({ ...getCoreActionsState(), type: 'deepMerge' }),
      patch: general.patchOrDeepMerge({ ...getCoreActionsState(), type: 'patch' }),
      insertOne: general.insertIntoArray({ ...getCoreActionsState(), type: 'One' }),
      insertMany: general.insertIntoArray({ ...getCoreActionsState(), type: 'Many' }),
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
      increment: general.increment(getCoreActionsState()),
      storeState,
    } as ShapesExt.RemovePrimitiveElement<T>
      | ShapesExt.RemoveObjectElement<T>
      | ShapesExt.DeepMergeElement<C, T>
      | ShapesExt.RemoveAll<X, T>
      | ShapesExt.Patch<C, T>
      | ShapesInt.StoreForAComponentInternal<S, C>
      | ShapesInt.StoreWhichMayContainComponentStores<S, C, T>;
    Object.keys(augmentations.selection).forEach(name => (coreActions as any)[name] = augmentations.selection[name](coreActions as ShapesExt.StoreOrDerivation<C>));
    return coreActions;
  };

  const select = <C = S>(selector: ((s: ShapesExt.DeepReadonly<S>) => C) = (s => s as any as C)) => {
    if (traceActions) {
      const stackRaw = new Error().stack!.split('\n');
      stack = [stackRaw[0], ...stackRaw.slice(2)].join('\n');
    }
    return action(selector as any) as any;
  };

  if ((!libState.applicationStore || replaceExistingStoreIfItExists) && devtools !== false) {
    integrateStoreWithReduxDevtools({ store: select as any, storeState, devtools })
  }

  return select;
}
