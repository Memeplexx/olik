import { augmentations } from './augmentations';
import { DeepReadonly, Future, FutureState, Selector } from './shapes-external';
import { StoreState, UpdateStateArgs } from './shapes-internal';
import { devtoolsDebounce, errorMessages } from './shared-consts';
import { libState, testState } from './shared-state';
import { copyObject, deepCopy, deepFreeze, isEmpty, readSelector, toIsoString } from './shared-utils';

export const processStateUpdateRequest = <S, C, X extends C & Array<any>>(
  arg: {
    selector: Selector<S, C, X>,
    argument: any | (() => Promise<any>),
    select: (selector?: (s: S) => C) => any,
    updateOptions: {} | void,
    actionNameSuffix: string,
    storeState: StoreState<S>,
    replacer: (newNode: DeepReadonly<X>, argument: C) => any,
    getPayload: (argument: C) => any,
    getPayloadFn?: () => any,
    pathSegments?: string[],
  }
) => {
  const pathSegments = readSelector(arg.selector);
  const updateState = (argument: C) => performStateUpdate({
    ...arg,
    actionName: `${!pathSegments.length ? '' : (pathSegments.join('.') + '.')}${arg.actionNameSuffix}`,
    replacer: old => arg.replacer(old, argument),
    payload: arg.getPayload(argument),
  })
  if (!!arg.argument && typeof (arg.argument) === 'function') {
    if (libState.transactionState !== 'none') {
      libState.transactionState = 'none';
      throw new Error(errorMessages.PROMISES_NOT_ALLOWED_IN_TRANSACTIONS);
    }
    if (['array', 'string', 'number', 'boolean'].some(t => t === typeof (arg.select().read()))) {
      throw new Error(errorMessages.INVALID_CONTAINER_FOR_CACHED_DATA);
    }
    const asyncPayload = arg.argument as (() => Promise<C>);
    const cacheFor = ((arg.updateOptions || {}) as any).cacheFor || 0;
    const cacheKey = `${!pathSegments.length ? '' : (pathSegments.join('.') + '.')}${arg.actionNameSuffix}`;
    const expirationDate = (arg.select().read().cache || {})[cacheKey];
    if (expirationDate && (new Date(expirationDate).getTime() > new Date().getTime())) {
      const result = {
        asPromise: () => Promise.resolve(arg.select(arg.selector).read()),
        getFutureState: () => ({ storeValue: arg.select(arg.selector).read(), error: null, wasResolved: true, isLoading: false, wasRejected: false } as FutureState<C>),
      } as Future<C>;
      Object.keys(augmentations.future).forEach(name => (result as any)[name] = augmentations.future[name](result));
      return result;
    }
    let state = { storeValue: arg.select(arg.selector).read(), error: null, isLoading: true, wasRejected: false, wasResolved: false } as FutureState<C>;
    const promiseResult = () => {
      if (cacheKey in arg.storeState.activePromises) { // prevent duplicate simultaneous requests
        return arg.storeState.activePromises[cacheKey];
      }
      const { optimisticallyUpdateWith } = ((arg.updateOptions as any) || { optimisticallyUpdateWith: undefined });
      const noSnapshot = Symbol();
      let snapshot = isEmpty(optimisticallyUpdateWith) ? noSnapshot : arg.select(arg.selector).read();
      if (!isEmpty(optimisticallyUpdateWith)) {
        updateState(optimisticallyUpdateWith);
      }
      state = { ...state, storeValue: arg.select(arg.selector).read() };
      const promise = (augmentations.async ? augmentations.async(asyncPayload) : asyncPayload()) as Promise<C>;
      arg.storeState.activePromises[cacheKey] = promise;
      return promise
        .then(res => {
          const involvesCaching = !!arg.updateOptions && !(typeof (arg.updateOptions) === 'string') && cacheFor;
          if (involvesCaching) {
            libState.transactionState = 'started';
          }
          updateState(res);
          state = { ...state, wasResolved: true, wasRejected: false, isLoading: false, storeValue: arg.select(arg.selector).read() };
          if (involvesCaching && cacheFor) {
            const cacheExpiry = toIsoString(new Date(new Date().getTime() + cacheFor));
            libState.transactionState = 'last';
            arg.select(s => (s as any).cache[cacheKey]).replace(cacheExpiry);
            setTimeout(() => {
              if (arg.select().read().cache && arg.select().read().cache[cacheKey]) {
                arg.select(s => (s as any).cache[cacheKey]).remove();
              }
            }, cacheFor);
          }
          return arg.select(arg.selector).read();
        }).catch(error => {
          // Revert optimistic update
          if (snapshot !== noSnapshot) {
            updateState(snapshot || null); // snapshot may be 'undefined'. Ensure we do not dispatch that to the store
          }
          state = { ...state, wasRejected: true, wasResolved: false, isLoading: false, error };
          throw error;
        }).finally(() => delete arg.storeState.activePromises[cacheKey]);
    };
    const result = {
      asPromise: () => promiseResult(),
      getFutureState: () => state,
    } as Future<C>;
    Object.keys(augmentations.future).forEach(name => (result as any)[name] = augmentations.future[name](result));
    return result
  } else {
    updateState(arg.argument as C);
  }
}

export const performStateUpdate = <S, C, X extends C = C>(
  arg: UpdateStateArgs<S, C, X>,
) => {
  if (libState.transactionState === 'started') {
    arg.storeState.transactionStartState = arg.storeState.currentState
  }

  deepFreeze(arg.payload);

  const previousState = arg.storeState.currentState;
  const pathSegments = arg.pathSegments || readSelector(arg.selector);
  const result = Object.freeze(copyObject(arg.storeState.currentState, { ...arg.storeState.currentState }, pathSegments.slice(), arg.replacer));
  arg.storeState.currentState = result;

  // Construct action to dispatch
  const actionType = arg.actionName;
  const tag = (arg.updateOptions || {} as any).tag || '';
  const tagSanitized = tag && arg.storeState.actionTypeTagAbbreviator ? arg.storeState.actionTypeTagAbbreviator(tag) : tag;
  const payload = ((arg.getPayloadFn && (arg.getPayloadFn() !== undefined)) ? arg.getPayloadFn() : arg.payload);
  const payloadWithTag = (!tag || arg.storeState.actionTypesToIncludeTag) ? { ...payload } : { ...payload, tag: tagSanitized };
  const typeWithTag = actionType + (arg.storeState.actionTypesToIncludeTag && tag ? ` [${tagSanitized}]` : '')
  let actionToDispatch = {
    type: typeWithTag,
    ...payloadWithTag,
  };

  // Cater for transactions
  if (libState.transactionState === 'started') {
    arg.storeState.transactionActions.push(actionToDispatch);
    return;
  }
  if (libState.transactionState === 'last') {
    arg.storeState.transactionActions.push(actionToDispatch);
    notifySubscribers({
      changeListeners: arg.storeState.changeListeners,
      oldState: arg.storeState.transactionStartState,
      newState: result,
    });
    libState.transactionState = 'none';
    arg.storeState.transactionStartState = null;
    actionToDispatch = {
      type: arg.storeState.transactionActions.map(action => action.type).join(', '),
      actions: deepCopy(arg.storeState.transactionActions),
    }
    arg.storeState.transactionActions.length = 0;
  } else if (libState.transactionState === 'none') {
    notifySubscribers({
      changeListeners: arg.storeState.changeListeners,
      oldState: previousState,
      newState: result,
    });
  }

  if (arg.stack) {
    console.groupCollapsed(actionToDispatch.type);
    console.log(payloadWithTag);
    console.log(arg.stack);
    console.groupEnd();
  }

  // Dispatch to devtools
  testState.currentAction = actionToDispatch;
  const { type, ...actionPayload } = actionToDispatch;
  if (arg.storeState.devtoolsDispatchListener && (!arg.updateOptions || ((arg.updateOptions || {} as any).tag !== 'dontTrackWithDevtools'))) {
    const dispatchToDevtools = (payload?: any[]) => {
      const action = payload ? { ...actionToDispatch, batched: payload } : actionToDispatch;
      testState.currentActionForDevtools = action;
      arg.storeState.devtoolsDispatchListener!(action);
    }
    if (arg.storeState.previousAction.debounceTimeout) {
      window.clearTimeout(arg.storeState.previousAction.debounceTimeout);
      arg.storeState.previousAction.debounceTimeout = 0;
    }
    if (arg.storeState.previousAction.type !== type) {
      arg.storeState.previousAction.type = type;
      arg.storeState.previousAction.payloads = [actionPayload];
      dispatchToDevtools();
      arg.storeState.previousAction.debounceTimeout = window.setTimeout(() => {
        arg.storeState.previousAction.type = '';
        arg.storeState.previousAction.payloads = [];
      }, devtoolsDebounce);
    } else {
      if (arg.storeState.previousAction.timestamp < (Date.now() - devtoolsDebounce)) {
        arg.storeState.previousAction.payloads = [actionPayload];
      } else {
        arg.storeState.previousAction.payloads.push(actionPayload);
      }
      arg.storeState.previousAction.timestamp = Date.now();
      arg.storeState.previousAction.debounceTimeout = window.setTimeout(() => {
        dispatchToDevtools(arg.storeState.previousAction.payloads.slice(0, arg.storeState.previousAction.payloads.length - 1));
        arg.storeState.previousAction.type = '';
        arg.storeState.previousAction.payloads = [];
      }, devtoolsDebounce);
    }
  }
}

const notifySubscribers = <S>(
  arg: {
    changeListeners: Map<(ar: any) => any, (arg: S) => any>,
    oldState: S,
    newState: S,
  }
) => {
  arg.changeListeners.forEach((selector, subscriber) => {
    let selectedNewState: any;
    try { selectedNewState = selector(arg.newState); } catch (e) { /* A component store may have been detatched and state changes are being subscribed to inside component. Ignore */ }
    const selectedOldState = selector(arg.oldState);
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
