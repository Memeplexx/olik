import { integrateStoreWithReduxDevtools } from './devtools-integration';
import * as array from './operators-array';
import * as arrayCustom from './operators-arraycustom';
import {
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
import { defineStoreDetach } from './operators-internal';
import {
  ArrayOfObjectsAction,
  DeepReadonly,
  FindOrFilter,
  MaybeConvertable,
  OptionsForReduxDevtools,
  PredicateOptionsCommon,
  PredicateOptionsForBoolean,
  PredicateOptionsForNumber,
  PredicateOptionsForString,
  Selector,
  StoreForAnArrayOfObjects,
  StoreWhichIsNested,
  Trackability,
} from './shapes-external';
import {
  ArrayCustomState,
  ArrayOperatorState,
  CoreActionsState,
  PreviousAction,
  StoreState,
  StoreWhichIsNestedInternal,
  StoreWhichMayContainNestedStores,
  UpdateStateArgs,
} from './shapes-internal';
import { devtoolsDebounce } from './shared-consts';
import { libState, testState } from './shared-state';
import { copyObject, createPathReader, deepCopy, deepFreeze, validateSelectorFn, validateState } from './shared-utils';

export function createStore<S, T extends Trackability>({
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
  const changeListeners = new Map<(ar: any) => any, (arg: S) => any>();
  let pathReader = createPathReader(state);
  let currentState = deepFreeze(state) as S;
  let initialState = currentState;
  let devtoolsDispatchListener: ((action: { type: string, payload?: any }) => any) | undefined;
  const setDevtoolsDispatchListener = (listener: (action: { type: string, payload?: any }) => any) => devtoolsDispatchListener = listener;
  const storeState = { bypassSelectorFunctionCheck: false, selector: null as any, activePromises: {}, transactionActions: [], transactionState: 'none', transactionStartState: null, dryRun: false } as StoreState<S>;
  const action = <C, X extends C & Array<any>>(selector: Selector<S, C, X>) => {
    const where = (type: FindOrFilter) => {
      const whereClauseSpecs = Array<{ filter: (arg: X[0]) => boolean, type: 'and' | 'or' | 'last' }>();
      const whereClauseStrings = Array<string>();
      const recurseWhere = (getProp => {
        const getSegsAndCriteria = () => {
          validateSelectorFn('getProp', storeState, getProp);
          const segs = array.getSegments(selector, () => currentState, getProp);
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
            getCurrentState: () => currentState,
            criteria: getSegsAndCriteria().criteria,
            recurseWhere,
            fn,
            whereClauseString,
            selector,
            updateState,
            type,
            changeListeners,
            pathReader,
            storeResult,
            storeState,
          } as ArrayOperatorState<S, C, X, FindOrFilter, T>;
          return {
            andWhere: array.andWhere(context),
            orWhere: array.orWhere(context),
            replace: array.replace(context),
            patch: array.patch(context),
            remove: array.remove(context),
            onChange: array.onChange(context),
            read: array.read(context),
            stopBypassingPromises: () => array.stopBypassingPromises(context),
          } as ArrayOfObjectsAction<X, FindOrFilter, T>
        };
        let valueConverter: ((val: any) => any) | null = null;
        const getValue = (val: any) => valueConverter ? valueConverter(val) : val;
        const predicates = {
          ...{
            isEq: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'} === ${val}`, e => getValue(e) === val),
            isNotEq: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'} !== ${val}`, e => getValue(e) !== val),
            isIn: val => constructActions(`[${val.join(', ')}].includes(${getSegsAndCriteria().segs.join('.') || 'element'})`, e => val.includes(getValue(e))),
            isNotIn: val => constructActions(`![${val.join(', ')}].includes(${getSegsAndCriteria().segs.join('.') || 'element'})`, e => !val.includes(getValue(e))),
          } as PredicateOptionsCommon<X, any, FindOrFilter, T, MaybeConvertable>,
          ...{
            returnsTrue: () => {
              const predicate = getProp as any as (element: DeepReadonly<X[0]>) => boolean;
              const context = { type, updateState, selector, predicate, changeListeners, getCurrentState: () => currentState, pathReader, storeResult, storeState } as ArrayCustomState<S, C, X, T>;
              return {
                remove: arrayCustom.remove(context),
                replace: arrayCustom.replace(context),
                patch: arrayCustom.patch(context),
                onChange: arrayCustom.onChange(context),
                read: arrayCustom.read(context),
                stopBypassingPromises: () => arrayCustom.stopBypassingPromises(context),
              };
            }
          } as PredicateOptionsForBoolean<X, FindOrFilter, T, MaybeConvertable>,
          ...{
            isMoreThan: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'} > ${val}`, e => getValue(e) > val),
            isLessThan: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'} < ${val}`, e => getValue(e) < val),
            isMoreThanOrEq: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'} >= ${val}`, e => getValue(e) >= val),
            isLessThanOrEq: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'} <= ${val}`, e => getValue(e) <= val),
          } as PredicateOptionsForNumber<X, any, FindOrFilter, T, MaybeConvertable>,
          ...{
            isMatching: val => constructActions(`${getSegsAndCriteria().segs.join('.') || 'element'}.match(${val})`, e => getValue(e).match(val)),
          } as PredicateOptionsForString<X, any, FindOrFilter, T, 'convertable'>,
        };
        predicates.whenConvertedTo = (converter: (val: any) => any) => {
          valueConverter = converter;
          return predicates as any;
        };
        return predicates;
      }) as StoreForAnArrayOfObjects<X, T>['filterWhere'];
      return recurseWhere;
    };
    const getCoreActionsState = () => ({
      updateState,
      selector,
      isNested: () => !!coreActions.storeDetach,
      storeState,
      pathReader,
      storeResult,
      initialState,
      getCurrentState: () => currentState,
    } as CoreActionsState<S, C, X, T>)
    const coreActions = {
      remove: remove(getCoreActionsState()),
      patch: patchOrInsertIntoObject({ ...getCoreActionsState(), type: 'patch' }),
      insert: Array.isArray(selector(currentState))
        ? insertIntoArray(getCoreActionsState())
        : patchOrInsertIntoObject({ ...getCoreActionsState(), type: 'insert' }),
      removeAll: removeAll(getCoreActionsState()),
      replaceAll: replaceAll(getCoreActionsState()),
      reset: reset(getCoreActionsState()),
      replace: replace({ ...getCoreActionsState(), name: 'replace' }),
      upsertMatching: upsertMatching(getCoreActionsState()),
      filterWhere: where('filter'),
      findWhere: where('find'),
      onChange: onChange(selector, changeListeners),
      read: read(selector, () => currentState),
      stopBypassingPromises: () => stopBypassingPromises(pathReader, selector, storeResult),
      readInitial: () => selector(initialState),
      defineStoreDetach: defineStoreDetach(() => currentState, updateState),
      defineReset: (
        (initState: C) => () => replace({ ...getCoreActionsState(), name: 'reset' })(initState, undefined as any)
      ) as StoreWhichIsNestedInternal<S, C>['defineReset'],
      renew: (state => {
        pathReader = createPathReader(state);
        currentState = deepFreeze(state) as S;
      }) as StoreWhichMayContainNestedStores<S, C, T>['renew'],
      getSelector: () => storeState.selector,
      dryRun: (dryRun: boolean) => storeState.dryRun = dryRun,
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

    if (libState.transactionState === 'started') {
      storeState.transactionStartState = currentState
    }

    const previousState = currentState;
    const pathSegments = specs.pathSegments || pathReader.readSelector(specs.selector);
    const result = Object.freeze(copyObject(currentState, { ...currentState }, pathSegments.slice(), specs.replacer));
    specs.mutator(specs.selector(pathReader.mutableStateCopy) as X);
    currentState = result;

    // Construct action to dispatch
    const actionType = specs.actionNameOverride ? specs.actionName : (pathSegments.join('.') + (pathSegments.length ? '.' : '') + specs.actionName);
    const tag = (specs.updateOptions || {} as any).tag || '';
    const tagSanitized = tag && tagSanitizer ? tagSanitizer(tag) : tag;
    const payload = ((specs.getPayloadFn && (specs.getPayloadFn() !== undefined)) ? specs.getPayloadFn() : specs.payload);
    const payloadWithTag = (!tag || tagsToAppearInType) ? { ...payload } : { ...payload, tag: tagSanitized };
    const typeWithTag = actionType + (tagsToAppearInType && tag ? ` [${tagSanitized}]` : '')
    let actionToDispatch = {
      type: typeWithTag,
      ...payloadWithTag,
    };

    // Cater for transactions
    if (libState.transactionState === 'started') {
      storeState.transactionActions.push(actionToDispatch);
      return;
    }
    if (libState.transactionState === 'last') {
      storeState.transactionActions.push(actionToDispatch);
      notifySubscribers(storeState.transactionStartState, result);
      libState.transactionState = 'none';
      storeState.transactionStartState = null;
      actionToDispatch = {
        type: storeState.transactionActions.map(action => action.type).join(', '),
        actions: deepCopy(storeState.transactionActions),
      }
      storeState.transactionActions.length = 0;
    } else if (libState.transactionState === 'none') {
      notifySubscribers(previousState, result);
    }

    // Dispatch to devtools
    testState.currentAction = actionToDispatch;
    testState.currentMutableState = pathReader.mutableStateCopy as any;
    const { type, ...actionPayload } = actionToDispatch;
    if (devtoolsDispatchListener && (!specs.updateOptions || ((specs.updateOptions || {} as any).tag !== 'dontTrackWithDevtools'))) {
      const dispatchToDevtools = (payload?: any[]) => {
        const action = payload ? { ...actionToDispatch, batched: payload } : actionToDispatch;
        testState.currentActionForDevtools = action;
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
    integrateStoreWithReduxDevtools<S>(storeResult as any, devtools, setDevtoolsDispatchListener, storeState);
  }

  return { select: storeResult, read: () => storeResult().read() as S };
}
