import { augmentations, devtoolsDebounce, errorMessages, libState } from './constant';
import { constructQuery } from './query';
import { readState } from './read';
import { FutureState, StateAction } from './type';
import { deepFreeze, toIsoStringInCurrentTz } from './utility';

export const updateState = (
  storeName: string,
  stateActions: StateAction[],
  changeListeners: Map<StateAction[], (arg: any) => any>,
) => {
  const oldState = libState.appStates[storeName];
  libState.appStates[storeName] = writeState(libState.appStates[storeName], { ...libState.appStates[storeName] }, stateActions, { index: 0 });
  changeListeners.forEach((listener, stateActions) => {
    const selectedNewState = readState(libState.appStates[storeName], stateActions, { index: 0 }, false);
    if (readState(oldState, stateActions, { index: 0 }, false) !== selectedNewState) {
      listener(selectedNewState);
    }
  });

  // if (arg.stack) {
  //   console.groupCollapsed(libState.currentAction.type);
  //   console.log(payloadWithTag);
  //   console.log(arg.stack);
  //   console.groupEnd();
  // }

  // Dispatch to devtools
  const { type, ...actionPayload } = libState.currentAction;
  if (libState.devtoolsDispatchListener && libState.dispatchToDevtools) {
    const dispatchToDevtools = (payload?: any[]) => {
      const action = payload ? { ...libState.currentAction, batched: payload } : libState.currentAction;
      libState.currentActionForDevtools = action;
      libState.devtoolsDispatchListener!(action);
    }
    if (libState.previousAction.debounceTimeout) {
      window.clearTimeout(libState.previousAction.debounceTimeout);
      libState.previousAction.debounceTimeout = 0;
    }
    if (libState.previousAction.type !== type) {
      libState.previousAction.type = type;
      libState.previousAction.payloads = [actionPayload];
      dispatchToDevtools();
      libState.previousAction.debounceTimeout = window.setTimeout(() => {
        libState.previousAction.type = '';
        libState.previousAction.payloads = [];
      }, devtoolsDebounce);
    } else {
      if (libState.previousAction.timestamp < (Date.now() - devtoolsDebounce)) {
        libState.previousAction.payloads = [actionPayload];
      } else {
        libState.previousAction.payloads.push(actionPayload);
      }
      libState.previousAction.timestamp = Date.now();
      libState.previousAction.debounceTimeout = window.setTimeout(() => {
        dispatchToDevtools(libState.previousAction.payloads.slice(0, libState.previousAction.payloads.length - 1));
        libState.previousAction.type = '';
        libState.previousAction.payloads = [];
      }, devtoolsDebounce);
    }
  }
}

export const writeState = (currentState: any, stateToUpdate: any, stateActions: ReadonlyArray<StateAction>, cursor: { index: number }): any => {
  if (Array.isArray(currentState) && (stateActions[cursor.index].type === 'property')) {
    return (currentState as any[]).map((e, i) => (typeof (currentState[i]) === 'object')
      ? { ...currentState[i], ...writeState(currentState[i] || {}, stateToUpdate[i] || {}, stateActions, { ...cursor }) }
      : writeState(currentState[i] || {}, stateToUpdate[i] || {}, stateActions, { ...cursor }));
  } else if (Array.isArray(currentState) && (stateActions[cursor.index].type === 'upsertMatching')) {
    cursor.index++;
    const queryPaths = stateActions
      .slice(cursor.index, cursor.index + stateActions.slice(cursor.index).findIndex(sa => sa.type === 'action'))
      .reduce((prev, curr) => {
        cursor.index++;
        return prev.concat(curr);
      }, new Array<StateAction>());
    const upsert = stateActions[cursor.index++];
    const upsertArgs = [...(Array.isArray(upsert.arg) ? upsert.arg : [upsert.arg])];
    const result = (currentState as any[]).map(e => {
      const elementValue = queryPaths.reduce((prev, curr) => prev = prev[curr.name], e);
      const foundIndex = upsertArgs.findIndex(ua => queryPaths.reduce((prev, curr) => prev = prev[curr.name], ua) === elementValue);
      return foundIndex !== -1 ? upsertArgs.splice(foundIndex, 1)[0] : e;
    });
    return completeStateWrite(stateActions, { [upsert.name]: upsert.arg }, [...result, ...upsertArgs]);
  }
  const action = stateActions[cursor.index++];
  if (cursor.index < (stateActions.length)) {
    if (Array.isArray(currentState) && (action.type === 'search')) {
      const query = constructQuery(stateActions, cursor);
      let findIndex = -1;
      if ('find' === action.name) {
        findIndex = (currentState as any[]).findIndex(query);
        if (findIndex === -1) { throw new Error(errorMessages.FIND_RETURNS_NO_MATCHES); }
      }
      if (stateActions[cursor.index].name === 'remove') {
        return completeStateWrite(stateActions, null, 'find' === action.name ? (currentState as any[]).filter((e, i) => findIndex !== i) : (currentState as any[]).filter(e => !query(e)));
      } else {
        if ('find' === action.name) {
          return (currentState as any[]).map((e, i) => i === findIndex
            ? (typeof (e) === 'object'
              ? { ...e, ...writeState(e || {}, stateToUpdate[i] || {}, stateActions, cursor) }
              : writeState(e, stateToUpdate[i], stateActions, cursor))
            : e);
        } else if ('filter' === action.name) {
          return (currentState as any[]).map((e, i) => query(e)
            ? (typeof (e) === 'object'
              ? { ...e, ...writeState(e || {}, stateToUpdate[i] || {}, stateActions, { ...cursor }) }
              : writeState(e, stateToUpdate[i], stateActions, { ...cursor }))
            : e);
        }
      }
    } else if (['remove', 'invalidateCache'].includes(stateActions[cursor.index].name)) {
      const { [stateActions[cursor.index - 1].name]: other, ...otherState } = currentState;
      return otherState;
    } else {
      return { ...currentState, [action.name]: writeState((currentState || {})[action.name], ((stateToUpdate as any) || {})[action.name], stateActions, cursor) };
    }
  } else if (action.name === 'replace') {
    return completeStateWrite(stateActions, { replacement: action.arg }, action.arg);
  } else if (action.name === 'patch') {
    return completeStateWrite(stateActions, { patch: action.arg }, { ...currentState, ...(action.arg as any) });
  } else if (action.name === 'increment') {
    return completeStateWrite(stateActions, { by: action.arg }, currentState + action.arg);
  } else if (action.name === 'removeAll') {
    return completeStateWrite(stateActions, null, []);
  } else if (action.name === 'replaceAll') {
    return completeStateWrite(stateActions, { replacement: action.arg }, action.arg);
  } else if (action.name === 'patchAll') {
    return completeStateWrite(stateActions, { patch: action.arg }, (currentState as any[]).map(e => ({ ...e, ...action.arg })));
  } else if (action.name === 'incrementAll') {
    return completeStateWrite(stateActions, { by: action.arg }, Array.isArray(currentState) ? currentState.map((e: any) => e + action.arg) : currentState + action.arg);
  } else if (action.name === 'insertOne') {
    return completeStateWrite(stateActions, { toInsert: action.arg }, [...currentState, action.arg]);
  } else if (action.name === 'insertMany') {
    return completeStateWrite(stateActions, { toInsert: action.arg }, [...currentState, ...action.arg]);
  }
}

export const processUpdate = (storeName: string, stateActions: StateAction[], prop: string, changeListeners: Map<StateAction[], (arg: any) => any>) => {
  return (arg: any, opts?: { cacheFor: number, optimisticallyUpdateWith: any }) => {
    deepFreeze(arg);
    if (typeof (arg) !== 'function') {
      updateState(storeName, [...stateActions, { type: 'action', name: prop, arg, actionType: `${prop}()` }], changeListeners);
    } else {
      if (libState.insideTransaction) { throw new Error(errorMessages.ASYNC_PAYLOAD_INSIDE_TRANSACTION); }
      const readCurrentState = () => 
        readState(libState.appStates[storeName], [...stateActions, { type: 'action', name: 'read' }], { index: 0 }, false);
      let state = { storeValue: readCurrentState(), error: null, isLoading: true, wasRejected: false, wasResolved: false } as FutureState<any>;
      if (libState.appStates[storeName].cache?.[stateActions.map(sa => sa.actionType).join('.')]) {
        const result = new Proxy(new Promise<any>(resolve => resolve(readCurrentState())), {
          get: (target: any, prop: any) => {
            if (prop === 'then' || prop === 'catch' || prop === 'finally') {
              const t = Promise.resolve(readCurrentState());
              return (t as any)[prop].bind(t);
            } else if (prop === 'getFutureState') {
              return state;
            } else {
              return (...args: any[]) => target[prop].apply(target, args);
            }
          }
        });
        Object.keys(augmentations.future).forEach(name => (result as any)[name] = augmentations.future[name](result));
        return result;
      }
      const promiseResult = () => {
        let snapshot: any = undefined;
        if (opts?.optimisticallyUpdateWith) {
          snapshot = readCurrentState();
          updateState(storeName, [...stateActions, { type: 'action', name: prop, arg: opts.optimisticallyUpdateWith, actionType: `${prop}()` }], changeListeners);
        }
        state = { ...state, storeValue: readCurrentState() };
        const promise = (augmentations.async ? augmentations.async(arg) : arg()) as Promise<any>;
        return promise
          .then(promiseResult => {
            updateState(storeName, [...stateActions, { type: 'action', name: prop, arg: promiseResult, actionType: `${prop}()` }], changeListeners);
            state = { ...state, wasResolved: true, wasRejected: false, isLoading: false, storeValue: readCurrentState() };
            if (opts?.cacheFor) {
              const statePath = stateActions.map(sa => sa.actionType).join('.');
              const actions = [
                { type: 'property', name: 'cache', actionType: 'cache' },
                { type: 'property', name: statePath, actionType: statePath },
              ] as StateAction[];
              updateState(storeName, [...actions, { type: 'action', name: 'replace', arg: toIsoStringInCurrentTz(new Date()), actionType: 'replace()' }], changeListeners);
              setTimeout(() => {
                try { 
                  updateState(storeName, [...actions, { type: 'action', name: 'remove', actionType: 'remove()' }], changeListeners) 
                } catch (e) {
                  // Ignoring. This may happen due to the user manually invalidating a cache. If that has happened, we don't want an error to be thrown.
                }
              }, opts.cacheFor);
            }
            return readCurrentState();
          }).catch(error => {
            if (snapshot !== undefined) {
              updateState(storeName, [...stateActions, { type: 'action', name: prop, arg: snapshot, actionType: `${prop}()` }], changeListeners);
            }
            state = { ...state, wasRejected: true, wasResolved: false, isLoading: false, error };
            throw error;
          });
      }
      let promiseWasChained = false;
      const result: any = new Proxy(new Promise<any>(resolve => {
        setTimeout(() => { if (!promiseWasChained) { promiseResult().then((r) => resolve(r)); } });
      }), {
        get: (target: any, prop: any) => {
          if (prop === 'getFutureState') {
            return () => state;
          } else if (prop === 'then' || prop === 'catch' || prop === 'finally') {
            promiseWasChained = true;
            const t = promiseResult();
            return (t as any)[prop].bind(t);
          } else { // must be an augmentation
            promiseWasChained = true;
            return (...args: any[]) => target[prop].apply(target, args);
          }
        }
      })
      Object.keys(augmentations.future).forEach(name => (result as any)[name] = augmentations.future[name](result));
      return result
    }
  }
}

const completeStateWrite = (stateActions: ReadonlyArray<StateAction>, payload: null | {}, newState: any) => {
  const type = stateActions.map(sa => sa.actionType).join('.');
  libState.currentAction = !libState.insideTransaction ? { type, ...payload }
    : !libState.currentAction.actions ? { type, actions: [{ type, ...payload }] }
      : { type: `${libState.currentAction.type}, ${type}`, actions: [...libState.currentAction.actions, { type, ...payload }] };
  return newState;
}
