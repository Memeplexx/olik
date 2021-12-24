import { augmentations, errorMessages, libState, testState } from './constant';
import { constructQuery } from './query';
import { readState } from './read';
import { FutureState, StateAction } from './type';
import { deepFreeze, deepMerge, toIsoStringInCurrentTz } from './utility';

export const updateState = (
  args: {
    storeName: string,
    stateActions: StateAction[],
    batchActions?: number;
  }
) => {
  const store = libState.appStores[args.storeName];
  const oldState = store.state;
  store.setState(writeState(oldState, { ...oldState }, args.stateActions, { index: 0 }));
  store.getChangeListeners().forEach(({ actions, listener }) => {
    const selectedNewState = readState(store.state, actions, { index: 0 });
    if (readState(oldState, actions, { index: 0 }) !== selectedNewState) {
      listener(selectedNewState);
    }
  })

  // Dispatch to devtools
  if (libState.devtoolsDispatchListener && libState.dispatchToDevtools) {
    const dispatchToDevtools = (batched?: any[]) => {
      const action = batched ? { ...libState.currentAction, batched } : libState.currentAction;
      testState.currentActionForDevtools = action;
      libState.devtoolsDispatchListener!(action);
    }

    // if the user is not batching actions, simply dispatch immediately, and return
    if (!args.batchActions) { dispatchToDevtools(); return; }

    // If the action's type is different from the batched action's type, 
    // update the batched action type to match the current action type, 
    // and dispatch to devtools immediately
    if (libState.batchedAction.type !== libState.currentAction.type) {
      libState.batchedAction.type = libState.currentAction.type;
      dispatchToDevtools();

      // The presence of a batched action type means the actions are currently being batched.
    } else if (libState.batchedAction.type) {
      // Add the current payload into the batch
      libState.batchedAction.payloads.push(libState.currentAction.payload);
      // Clear the existing timeout so that the batch is not prematurely expired
      window.clearTimeout(libState.batchedAction.timeout);
      // kick of a new timeout which, when reached, should reset the batched action to its pristine state
      libState.batchedAction.timeout = window.setTimeout(() => {
        // Remove the last payload from the batch because it is a duplication of the root action payload
        libState.batchedAction.payloads.pop();
        // Dispatch the batch to devtools and reset it
        dispatchToDevtools(libState.batchedAction.payloads);
        libState.batchedAction.type = '';
        libState.batchedAction.payloads = [];
      }, args.batchActions);
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
    return completeStateWrite(stateActions, { payload: upsert.arg }, [...result, ...upsertArgs]);
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
    return completeStateWrite(stateActions, { payload: action.arg }, action.arg);
  } else if (action.name === 'patch') {
    return completeStateWrite(stateActions, { payload: action.arg }, { ...currentState, ...(action.arg as any) });
  } else if (action.name === 'deepMerge') {
    return completeStateWrite(stateActions, { payload: action.arg }, deepMerge(currentState, action.arg));
  } else if (action.name === 'increment') {
    return completeStateWrite(stateActions, { payload: action.arg }, currentState + action.arg);
  } else if (action.name === 'removeAll') {
    return completeStateWrite(stateActions, null, []);
  } else if (action.name === 'replaceAll') {
    return completeStateWrite(stateActions, { payload: action.arg }, action.arg);
  } else if (action.name === 'patchAll') {
    return completeStateWrite(stateActions, { payload: action.arg }, (currentState as any[]).map(e => ({ ...e, ...action.arg })));
  } else if (action.name === 'incrementAll') {
    return completeStateWrite(stateActions, { payload: action.arg }, Array.isArray(currentState) ? currentState.map((e: any) => e + action.arg) : currentState + action.arg);
  } else if (action.name === 'insertOne') {
    return completeStateWrite(stateActions, { payload: action.arg }, [...currentState, action.arg]);
  } else if (action.name === 'insertMany') {
    return completeStateWrite(stateActions, { payload: action.arg }, [...currentState, ...action.arg]);
  }
}

export const processUpdate = (storeName: string, stateActions: StateAction[], prop: string, batchActions?: number) => {
  return (arg: any, opts?: { cacheFor: number, optimisticallyUpdateWith: any }) => {
    deepFreeze(arg);
    if (typeof (arg) !== 'function') {
      updateState({ storeName, batchActions, stateActions: [...stateActions, { type: 'action', name: prop, arg, actionType: `${prop}()` }] });
    } else {
      if (libState.insideTransaction) { throw new Error(errorMessages.ASYNC_PAYLOAD_INSIDE_TRANSACTION); }
      const readCurrentState = () =>
        readState(libState.appStores[storeName].state, [...stateActions, { type: 'action', name: 'state' }], { index: 0 });
      let state = { storeValue: readCurrentState(), error: null, isLoading: true, wasRejected: false, wasResolved: false } as FutureState<any>;
      if (libState.appStores[storeName].state.cache?.[stateActions.map(sa => sa.actionType).join('.')]) {
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
          updateState({ storeName, batchActions, stateActions: [...stateActions, { type: 'action', name: prop, arg: opts.optimisticallyUpdateWith, actionType: `${prop}()` }] });
        }
        state = { ...state, storeValue: readCurrentState() };
        const promise = (augmentations.async ? augmentations.async(arg) : arg()) as Promise<any>;
        return promise
          .then(promiseResult => {
            updateState({ storeName, batchActions, stateActions: [...stateActions, { type: 'action', name: prop, arg: promiseResult, actionType: `${prop}()` }] });
            state = { ...state, wasResolved: true, wasRejected: false, isLoading: false, storeValue: readCurrentState() };
            if (opts?.cacheFor) {
              const statePath = stateActions.map(sa => sa.actionType).join('.');
              const actions = [
                { type: 'property', name: 'cache', actionType: 'cache' },
                { type: 'property', name: statePath, actionType: statePath },
              ] as StateAction[];
              updateState({ storeName, batchActions, stateActions: [...actions, { type: 'action', name: 'replace', arg: toIsoStringInCurrentTz(new Date()), actionType: 'replace()' }] });
              setTimeout(() => {
                try {
                  updateState({ storeName, batchActions, stateActions: [...actions, { type: 'action', name: 'remove', actionType: 'remove()' }] })
                } catch (e) {
                  // Ignoring. This may happen due to the user manually invalidating a cache. If that has happened, we don't want an error to be thrown.
                }
              }, opts.cacheFor);
            }
            return readCurrentState();
          }).catch(error => {
            if (snapshot !== undefined) {
              updateState({ storeName, batchActions, stateActions: [...stateActions, { type: 'action', name: prop, arg: snapshot, actionType: `${prop}()` }] });
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
