import { augmentations } from './augmentations';
import { DeepReadonly, Future, FutureState, Selector, Trackability } from './shapes-external';
import { StoreState, UpdateStateArgs } from './shapes-internal';
import { devtoolsDebounce, errorMessages, expressionsNotAllowedInSelectorFunction } from './shared-consts';
import { libState, testState } from './shared-state';

export function deepFreeze<T extends Object>(o: T): T {
  Object.freeze(o);
  if (isEmpty(o)) { return o; }
  (Object.getOwnPropertyNames(o) as Array<keyof T>).forEach(prop => {
    if (o.hasOwnProperty(prop)
      && o[prop] !== null
      && (typeof (o[prop]) === 'object' || typeof (o[prop]) === 'function')
      && !Object.isFrozen(o[prop])) {
      deepFreeze(o[prop]);
    }
  });
  return o;
}

export function isEmpty(arg: any) {
  return arg === null || arg === undefined;
}

export function deepCopy<T>(o: T): T;
export function deepCopy(o: any): any {
  let newO;
  let i: any;
  if (typeof o !== 'object') { return o; }
  if (!o) { return o; }
  if ('[object Array]' === Object.prototype.toString.apply(o)) {
    newO = [];
    for (i = 0; i < o.length; i += 1) {
      newO[i] = deepCopy(o[i]);
    }
    return newO;
  }
  newO = {} as any;
  for (i in o) {
    if (o.hasOwnProperty(i)) {
      newO[i] = deepCopy(o[i]);
    }
  }
  return newO;
}

export function validateState(state: any) {
  const throwError = () => {
    throw new Error(errorMessages.INVALID_STATE_INPUT);
  };
  if (
    state !== null
    && !['boolean', 'number', 'string'].some(type => typeof state === type)
  ) {
    if (!Array.isArray(state)) {
      if (typeof state !== "object") {
        throwError();
      }
      const proto = Object.getPrototypeOf(state);
      if (proto != null && proto !== Object.prototype) {
        throwError();
      }
    }
    Object.keys(state).forEach(key => validateState(state[key]));
  }
}

export function copyObject<T>(oldObj: T, newObj: T, segs: string[], action: (newNode: any) => any): any {
  const seg = (segs as (keyof T)[]).shift();
  if (seg) {
    if (Array.isArray(oldObj)) {
      return (oldObj as any as any[]).map((e, i) => +seg === i
        ? { ...(oldObj as any)[i], ...copyObject((oldObj as any)[i], (newObj as any)[i], segs, action) }
        : e);
    }
    return { ...oldObj, [seg]: copyObject(oldObj[seg], newObj[seg], segs, action) };
  } else {
    return action(oldObj);
  }
}

export function readSelector(selector: (state: any) => any) {
  const pathSegments = new Array<string>();
  const initialize = (s: any): any => {
    if (typeof s !== 'object') {
      // may happen if we have a top-level primitive
      return null as any;
    }
    return new Proxy(s, {
      get: function (target, prop: any) {
        if (prop === 'find' || prop === 'filter') {
          (target as any)[prop] = (e: any) => { };
        }
        if (!(target as any)[prop]) {
          (target as any)[prop] = {};
        }
        const val = (target as any)[prop];
        if (val !== null && typeof val === 'object') {
          pathSegments.push(prop);
          return initialize(val);
        } else if (typeof val === 'function') {
          return function (...args: any[]) { };
        }
        pathSegments.push(prop);
        return val;
      }
    });
  };
  const proxy = initialize({});
  selector(proxy);
  return pathSegments;
}

export const validateSelectorFn = (
  functionName: 'get' | 'getProp',
  storeState: StoreState<any>,
  selector?: (element: any) => any,
) => {
  if (storeState.bypassSelectorFunctionCheck) { return; }
  const fnToString = (selector || '').toString();
  const illegalChars = expressionsNotAllowedInSelectorFunction
    .filter(c => c.test(fnToString));
  if (illegalChars.length) {
    throw new Error(errorMessages.ILLEGAL_CHARACTERS_WITHIN_SELECTOR(functionName));
  }
}

export const toIsoString = (date: Date) => {
  var tzo = -date.getTimezoneOffset(),
    dif = tzo >= 0 ? '+' : '-',
    pad = function (num: number) {
      var norm = Math.floor(Math.abs(num));
      return (norm < 10 ? '0' : '') + norm;
    };
  return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds()) +
    dif + pad(tzo / 60) +
    ':' + pad(tzo % 60);
}

export const processPayload = <S, C, X extends C & Array<any>>(
  arg: {
    selector: Selector<S, C, X>,
    payload: any | (() => Promise<any>),
    storeResult: (selector?: (s: S) => C) => any,
    updateOptions: {} | void,
    cacheKeySuffix: string,
    actionNameSuffix: string,
    storeState: StoreState<S>,
    replacer: (newNode: DeepReadonly<X>, payload: C) => any,
    getPayload: (payload: C) => any,
    getPayloadFn?: () => any,
    pathSegments?: string[],
  }
) => {
  const pathSegments = readSelector(arg.selector);
  const updateState = (payload: C) => performStateUpdate(
    arg.storeState, {
      ...arg,
      actionName: `${!pathSegments.length ? '' : (pathSegments.join('.') + '.')}${arg.actionNameSuffix}`,
      replacer: old => arg.replacer(old, payload),
      payload: arg.getPayload(payload),
    })
  if (!!arg.payload && typeof (arg.payload) === 'function') {
    if (libState.transactionState !== 'none') {
      libState.transactionState = 'none';
      throw new Error(errorMessages.PROMISES_NOT_ALLOWED_IN_TRANSACTIONS);
    }
    if (['array', 'string', 'number', 'boolean'].some(t => t === typeof (arg.storeResult().read()))) {
      throw new Error(errorMessages.INVALID_CONTAINER_FOR_CACHED_DATA);
    }
    const asyncPayload = arg.payload as (() => Promise<C>);
    const bypassPromiseFor = ((arg.updateOptions || {}) as any).bypassPromiseFor || 0;
    const cacheKey = `${!pathSegments.length ? '' : (pathSegments.join('.') + '.')}${arg.cacheKeySuffix}`;
    if (arg.storeState.activeFutures[cacheKey]) { // prevent duplicate simultaneous requests
      return arg.storeState.activeFutures[cacheKey];
    }
    const expirationDate = (arg.storeResult().read().promiseBypassTimes || {})[cacheKey];
    if (expirationDate && (new Date(expirationDate).getTime() > new Date().getTime())) {
      const result = {
        read: () => arg.storeResult(arg.selector).read(),
        asPromise: () => Promise.resolve(arg.storeResult(arg.selector).read()),
        onChange: (fn) => fn({ storeValue: arg.storeResult(arg.selector).read(), error: null, wasResolved: true, isLoading: false, wasRejected: false } as FutureState<C>),
      } as Future<C>;
      Object.keys(augmentations.future).forEach(name => (result as any)[name] = augmentations.future[name](result));
      return result;
    }
    const { optimisticallyUpdateWith } = ((arg.updateOptions as any) || {});
    let snapshot = isEmpty(optimisticallyUpdateWith) ? null : arg.storeResult(arg.selector).read();
    if (!isEmpty(snapshot)) {
      updateState(optimisticallyUpdateWith);
    }
    const promiseResult = () => {
      const promise = (augmentations.async ? augmentations.async(asyncPayload) : asyncPayload()) as Promise<C>;
      return promise
        .then(res => {
          const involvesCaching = !!arg.updateOptions && !(typeof (arg.updateOptions) === 'string') && bypassPromiseFor;
          if (involvesCaching) {
            libState.transactionState = 'started';
          }
          updateState(res);
          if (involvesCaching && bypassPromiseFor) {
            const cacheExpiry = toIsoString(new Date(new Date().getTime() + bypassPromiseFor));
            libState.transactionState = 'last';
            if (!arg.storeResult().read().promiseBypassTimes) {
              arg.storeResult(s => (s as any).promiseBypassTimes).replace({
                ...(arg.storeResult().read().promiseBypassTimes || { [cacheKey]: cacheExpiry }),
              })
            } else if (!arg.storeResult().read().promiseBypassTimes[cacheKey]) {
              arg.storeResult(s => (s as any).promiseBypassTimes).insert({ [cacheKey]: cacheExpiry });
            } else {
              arg.storeResult(s => (s as any).promiseBypassTimes[cacheKey]).replace(cacheExpiry);
            }
            try {
              setTimeout(() => {
                arg.storeResult(s => (s as any).promiseBypassTimes).remove(cacheKey);
              }, bypassPromiseFor);
            } catch (e) {
              // ignoring
            }
          }
          return arg.storeResult(arg.selector).read();
        }).catch(e => {
          // Revert optimistic update
          if (!isEmpty(snapshot)) {
            updateState(snapshot);
          }
          throw e;
        }).finally(() => delete arg.storeState.activeFutures[cacheKey]);
    };
    const state = { storeValue: arg.storeResult(arg.selector).read(), error: null, isLoading: true, wasRejected: false, wasResolved: false } as FutureState<C>;
    const result = {
      read: () => arg.storeResult(arg.selector).read(),
      asPromise: () => promiseResult(),
      onChange: (fn) => {
        let subscribed = true;
        fn(state)
        promiseResult()
          .then(storeValue => { if (subscribed) { fn({ ...state, wasResolved: true, isLoading: false, storeValue }) } })
          .catch(error => { if (subscribed) { fn({ ...state, wasRejected: true, isLoading: false, error }) } })
        return { unsubscribe: () => { subscribed = false; } };
      }
    } as Future<C>;
    Object.keys(augmentations.future).forEach(name => (result as any)[name] = augmentations.future[name](result));
    arg.storeState.activeFutures[cacheKey] = result;
    return result
  } else {
    updateState(arg.payload as C);
  }
}

export const performStateUpdate = <S, C, X extends C = C>(
  storeState: StoreState<S>,
  updateState: UpdateStateArgs<S, C, X>,
) => {
  if (libState.transactionState === 'started') {
    storeState.transactionStartState = storeState.currentState
  }

  const previousState = storeState.currentState;
  const pathSegments = updateState.pathSegments || readSelector(updateState.selector);
  const result = Object.freeze(copyObject(storeState.currentState, { ...storeState.currentState }, pathSegments.slice(), updateState.replacer));
  storeState.currentState = result;

  // Construct action to dispatch
  const actionType = updateState.actionName;
  const tag = (updateState.updateOptions || {} as any).tag || '';
  const tagSanitized = tag && storeState.tagSanitizer ? storeState.tagSanitizer(tag) : tag;
  const payload = ((updateState.getPayloadFn && (updateState.getPayloadFn() !== undefined)) ? updateState.getPayloadFn() : updateState.payload);
  const payloadWithTag = (!tag || storeState.tagsToAppearInType) ? { ...payload } : { ...payload, tag: tagSanitized };
  const typeWithTag = actionType + (storeState.tagsToAppearInType && tag ? ` [${tagSanitized}]` : '')
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
    notifySubscribers(storeState.changeListeners, storeState.transactionStartState, result);
    libState.transactionState = 'none';
    storeState.transactionStartState = null;
    actionToDispatch = {
      type: storeState.transactionActions.map(action => action.type).join(', '),
      actions: deepCopy(storeState.transactionActions),
    }
    storeState.transactionActions.length = 0;
  } else if (libState.transactionState === 'none') {
    notifySubscribers(storeState.changeListeners, previousState, result);
  }

  // Dispatch to devtools
  testState.currentAction = actionToDispatch;
  const { type, ...actionPayload } = actionToDispatch;
  if (storeState.devtoolsDispatchListener && (!updateState.updateOptions || ((updateState.updateOptions || {} as any).tag !== 'dontTrackWithDevtools'))) {
    const dispatchToDevtools = (payload?: any[]) => {
      const action = payload ? { ...actionToDispatch, batched: payload } : actionToDispatch;
      testState.currentActionForDevtools = action;
      storeState.devtoolsDispatchListener!(action);
    }
    if (storeState.previousAction.debounceTimeout) {
      window.clearTimeout(storeState.previousAction.debounceTimeout);
      storeState.previousAction.debounceTimeout = 0;
    }
    if (storeState.previousAction.type !== type) {
      storeState.previousAction.type = type;
      storeState.previousAction.payloads = [actionPayload];
      dispatchToDevtools();
      storeState.previousAction.debounceTimeout = window.setTimeout(() => {
        storeState.previousAction.type = '';
        storeState.previousAction.payloads = [];
      }, devtoolsDebounce);
    } else {
      if (storeState.previousAction.timestamp < (Date.now() - devtoolsDebounce)) {
        storeState.previousAction.payloads = [actionPayload];
      } else {
        storeState.previousAction.payloads.push(actionPayload);
      }
      storeState.previousAction.timestamp = Date.now();
      storeState.previousAction.debounceTimeout = window.setTimeout(() => {
        dispatchToDevtools(storeState.previousAction.payloads.slice(0, storeState.previousAction.payloads.length - 1));
        storeState.previousAction.type = '';
        storeState.previousAction.payloads = [];
      }, devtoolsDebounce);
    }
  }
}

function notifySubscribers<S>(changeListeners: Map<(ar: any) => any, (arg: S) => any>, oldState: S, newState: S) {
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
