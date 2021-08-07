import { augmentations } from './augmentations';
import { integrateStoreWithReduxDevtools } from './devtools-integration';
import * as array from './operators-array';
import * as arrayCustom from './operators-arraycustom';
import {
  insertIntoArray,
  deepMerge,
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
  PredicateOptionsCommon,
  PredicateOptionsForBoolean,
  PredicateOptionsForNumber,
  PredicateOptionsForString,
  Selector,
  StoreForAnArrayOfObjects,
  StoreOrDerivation,
  StoreForAComponent,
  Trackability,
} from './shapes-external';
import {
  ArrayCustomState,
  ArrayOperatorState,
  CoreActionsState,
  PreviousAction,
  StoreState,
  StoreForAComponentInternal,
  StoreWhichMayContainComponentStores,
  UpdateStateArgs,
} from './shapes-internal';
import { devtoolsDebounce } from './shared-consts';
import { libState, testState } from './shared-state';
import { copyObject, deepCopy, deepFreeze, readSelector, validateSelectorFn, validateState } from './shared-utils';

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
  const changeListeners = new Map<(ar: any) => any, (arg: S) => any>();
  let currentState = deepFreeze(state) as S;
  let initialState = currentState;
  let devtoolsDispatchListener: ((action: { type: string, payload?: any }) => any) | undefined;
  const setDevtoolsDispatchListener = (listener: (action: { type: string, payload?: any }) => any) => devtoolsDispatchListener = listener;
  const storeState = { bypassSelectorFunctionCheck: false, selector: null as any, activeFutures: {}, transactionActions: [], transactionState: 'none', transactionStartState: null } as StoreState<S>;
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
              const context = { type, updateState, selector, predicate, changeListeners, getCurrentState: () => currentState, storeResult, storeState } as ArrayCustomState<S, C, X, T>;
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
      updateState,
      selector,
      isComponentStore: () => !!(coreActions as any).isComponentStore,
      storeState,
      storeResult,
      initialState,
      getCurrentState: () => currentState,
    } as CoreActionsState<S, C, X, T>)
    const coreActions = {
      deepMerge: deepMerge(getCoreActionsState()),
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
      stopBypassingPromises: () => stopBypassingPromises(selector, storeResult),
      readInitial: () => selector(initialState),
      defineReset: (
        (initState: C, innerSelector) => () => replace({ ...getCoreActionsState(), name: 'reset' })(!innerSelector ? initState : innerSelector(initState), undefined as any)
      ) as StoreForAComponentInternal<S, C>['defineReset'],
      renew: (state => {
        currentState = deepFreeze(state) as S;
      }) as StoreWhichMayContainComponentStores<S, C, T>['renew'],
      getSelector: () => storeState.selector,
      changeListeners,
    } as unknown as StoreForAComponent<C>;
    Object.keys(augmentations.selection).forEach(name => (coreActions as any)[name] = augmentations.selection[name](coreActions as StoreOrDerivation<C>));
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
    const pathSegments = specs.pathSegments || readSelector(specs.selector);
    const result = Object.freeze(copyObject(currentState, { ...currentState }, pathSegments.slice(), specs.replacer));
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
      let selectedNewState: any;
      try { selectedNewState = selector(newState); } catch (e) { /* A component store may have been detatched and state changes are being subscribed to inside component. Ignore */ }
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

  return storeResult;
}
