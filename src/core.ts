import { devtoolsDebounce } from './shared-consts';
import { integrateStoreWithReduxDevtools } from './devtools-integration';
import {
  arrayAnd,
  arrayGetSegments,
  arrayOnChange,
  arrayOr,
  arrayPatch,
  arrayRead,
  arrayRemove,
  arrayReplace,
  arrayValidateGetPropFn,
} from './operators-array';
import {
  arrayCustomOnChange,
  arrayCustomPatch,
  arrayCustomRead,
  arrayCustomRemove,
  arrayCustomReplace,
} from './operators-arraycustom';
import { insert, match, onChange, patch, read, removeAll, replace, replaceAll, reset } from './operators-general';
import { defineRemoveNestedStore } from './operators-internal';
import {
  ArrayOfObjectsAction,
  DeepReadonly,
  FindOrFilter,
  OptionsForReduxDevtools,
  PredicateOptionsCommon,
  PredicateOptionsForNumber,
  PredicateOptionsForString,
  Selector,
  Store,
  StoreForAnArray,
  StoreWhichMayContainNestedStores,
  Tag,
  Trackability,
} from './shapes-external';
import {
  ArrayCustomState,
  ArrayOperatorState,
  NestedContainerStore,
  PreviousAction,
  StoreWhichIsNestedInternal,
  UpdateStateArgs,
} from './shapes-internal';
import { libState } from './shared-state';
import { copyObject, createPathReader, deepFreeze, validateState } from './shared-utils';

export function setInternal<S, T extends Trackability>(context: {
  state: S,
  supportsTags: boolean,
  devtools: OptionsForReduxDevtools | false,
  nestedContainerStore: NestedContainerStore,
  tagSanitizer?: (tag: string) => string,
},
) {
  const { state, devtools, nestedContainerStore, supportsTags, tagSanitizer } = context;
  validateState(state);
  const changeListeners = new Map<(ar: any) => any, (arg: S) => any>();
  let pathReader = createPathReader(state);
  let currentState = deepFreeze(state) as S;
  let initialState = currentState;
  let devtoolsDispatchListener: ((action: { type: string, payload?: any }) => any) | undefined;
  const setDevtoolsDispatchListener = (listener: (action: { type: string, payload?: any }) => any) => devtoolsDispatchListener = listener;
  const action = <C, X extends C & Array<any>>(selector: Selector<S, C, X>) => {
    const findOrFilter = (type: FindOrFilter) => {
      const whereClauseSpecs = Array<{ filter: (arg: X[0]) => boolean, type: 'and' | 'or' | 'last' }>();
      const whereClauseStrings = Array<string>();
      const recurseWhere = (getProp => {
        arrayValidateGetPropFn(getProp);
        const segs = arrayGetSegments(selector, () => currentState, getProp);
        const criteria = (arg: X[0], fn: (arg: X[0]) => boolean) => {
          segs.forEach(seg => arg = arg[seg]);
          return fn(arg);
        };
        const constructActions = (whereClauseString: string, fn: (e: X[0]) => boolean) => {
          const context = {
            whereClauseSpecs, whereClauseStrings, getCurrentState: () => currentState, criteria, recurseWhere, fn, whereClauseString, selector, updateState, type, changeListeners
          } as ArrayOperatorState<S, C, X, FindOrFilter, T>;
          return {
            and: arrayAnd(context),
            or: arrayOr(context),
            replace: arrayReplace(context),
            patch: arrayPatch(context),
            remove: arrayRemove(context),
            onChange: arrayOnChange(context),
            read: arrayRead(context),
          } as ArrayOfObjectsAction<X, FindOrFilter, T>
        };
        return {
          ...{
            eq: val => constructActions(`${segs.join('.') || 'element'} === ${val}`, e => e === val),
            ne: val => constructActions(`${segs.join('.') || 'element'} !== ${val}`, e => e !== val),
            in: val => constructActions(`[${val.join(', ')}].includes(${segs.join('.') || 'element'})`, e => val.includes(e)),
            ni: val => constructActions(`![${val.join(', ')}].includes(${segs.join('.') || 'element'})`, e => !val.includes(e)),
          } as PredicateOptionsCommon<X, any, FindOrFilter, T>,
          ...{
            gt: val => constructActions(`${segs.join('.')} > ${val}`, e => e > val),
            lt: val => constructActions(`${segs.join('.')} < ${val}`, e => e < val),
          } as PredicateOptionsForNumber<X, any, FindOrFilter, T>,
          ...{
            match: val => constructActions(`${segs.join('.')}.match(${val})`, e => e.match(val)),
          } as PredicateOptionsForString<X, any, FindOrFilter, T>,
        };
      }) as StoreForAnArray<X, T>['filter'];
      return recurseWhere;
    };
    const findOrFilterCustom = (type: FindOrFilter) => (predicate => {
      const context = { type, updateState, selector, predicate, changeListeners, getCurrentState: () => currentState } as ArrayCustomState<S, C, X, T>;
      return {
        remove: arrayCustomRemove(context),
        replace: arrayCustomReplace(context),
        patch: arrayCustomPatch(context),
        onChange: arrayCustomOnChange(context),
        read: arrayCustomRead(context),
      };
    }) as StoreForAnArray<X, T>['filterCustom'];
    return {
      replace: replace(pathReader, updateState, selector, 'replace'),
      replaceAll: replaceAll(pathReader, updateState, selector),
      reset: reset(pathReader, updateState, selector, initialState),
      onChange: onChange(selector, changeListeners),
      read: read(selector, () => currentState),
      patch: patch(selector, updateState),
      insert: insert(selector, updateState),
      removeAll: removeAll(selector, updateState),
      match: match(selector, () => currentState, updateState),
      filterCustom: findOrFilterCustom('filter'),
      findCustom: findOrFilterCustom('find'),
      filter: findOrFilter('filter'),
      find: findOrFilter('find'),
      readInitial: () => selector(initialState),
      renew: (state => {
        pathReader = createPathReader(state);
        currentState = deepFreeze(state) as S;
      }) as StoreWhichMayContainNestedStores<S, C, T>['renew'],
      defineRemoveNestedStore: defineRemoveNestedStore(() => currentState, updateState, nestedContainerStore),
      defineReset: (
        (initState: C) => () => replace(pathReader, updateState, (e => selector(e)) as Selector<S, C, X>, 'reset')(initState, undefined as Tag<T>)
      ) as StoreWhichIsNestedInternal<S, C>['defineReset'],
      supportsTags: supportsTags,
    } as unknown as Store<C, T>;
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
