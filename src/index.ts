import { errorMessages } from './constants';
import { Augmentations, Derivation, DerivationCalculationInputs, QuerySpec, Readable, StateAction, Store, Unsubscribe } from './types';


export const createApplicationStore = <S>(
  initialState: S, options: { name: string } = { name: document.title }
): Store<S> => {
  libState.appStates[options.name] = initialState;
  libState.changeListeners[options.name] = new Map();
  testState.logLevel = 'none';
  return readSelector(options.name);
}

export const libState = {
  appStates: {} as { [storeName: string]: any },
  changeListeners: {} as { [storeName: string]: Map<StateAction[], (arg: any) => any> },
  currentAction: {} as { [key: string]: any },
  insideTransaction: false,
}

export const testState = {
  logLevel: 'none' as ('debug' | 'none'),
}

export const updateState = (
  storeName: string,
  stateActions: StateAction[],
) => {
  const oldState = libState.appStates[storeName];
  libState.appStates[storeName] = writeState(libState.appStates[storeName], { ...libState.appStates[storeName] }, stateActions, { index: 0 });
  libState.changeListeners[storeName].forEach((listener, stateActions) => {
    const selectedNewState = readState(libState.appStates[storeName], stateActions, { index: 0 });
    if (readState(oldState, stateActions, { index: 0 }) !== selectedNewState) {
      listener(selectedNewState);
    }
  })
}

export const readSelector = (storeName: string) => {
  const initialize = (s: any, topLevel: boolean, stateActions: StateAction[]): any => {
    if (typeof s !== 'object') { return null as any; }
    return new Proxy(s, {
      get: function (target, prop: string) {
        stateActions = topLevel ? new Array<StateAction>() : stateActions;
        if (['replace', 'patch', 'remove', 'increment', 'removeAll', 'replaceAll', 'patchAll', 'incrementAll', 'insertOne', 'insertMany', 'withOne', 'withMany'].includes(prop)) {
          return (arg: any, opts?: { cacheFor: number, optimisticallyUpdateWith: any }) => {
            deepFreeze(arg);
            if (typeof (arg) !== 'function') {
              updateState(storeName, [...stateActions, { type: 'action', name: prop, arg, actionType: `${prop}()` }]);
            } else {
              if (libState.insideTransaction) { throw new Error(errorMessages.ASYNC_PAYLOAD_INSIDE_TRANSACTION); }
              const readCurrentState = () => readState(libState.appStates[storeName], [...stateActions, { type: 'action', name: 'read' }], { index: 0 });
              let snapshot: any = undefined;
              if (opts?.optimisticallyUpdateWith) {
                snapshot = readCurrentState();
                updateState(storeName, [...stateActions, { type: 'action', name: prop, arg: opts.optimisticallyUpdateWith, actionType: `${prop}()` }]);
              }
              return new Promise((resolve, reject) => {
                if (libState.appStates[storeName].cache?.[stateActions.map(sa => sa.actionType).join('.')]) {
                  resolve(readCurrentState());
                } else {
                  (arg() as Promise<any>)
                    .then(promiseResult => {
                      updateState(storeName, [...stateActions, { type: 'action', name: prop, arg: promiseResult, actionType: `${prop}()` }]);
                      if (opts?.cacheFor) {
                        const statePath = stateActions.map(sa => sa.actionType).join('.');
                        const actions = [
                          { type: 'property', name: 'cache', actionType: 'cache' },
                          { type: 'property', name: statePath, actionType: statePath },
                        ] as StateAction[];
                        updateState(storeName, [...actions, { type: 'action', name: 'replace', arg: toIsoStringInCurrentTz(new Date()), actionType: 'replace()' }]);
                        setTimeout(() => updateState(storeName, [...actions, { type: 'action', name: 'remove', actionType: 'remove()' }]), opts.cacheFor);
                      }
                      resolve(readCurrentState());
                    }).catch(e => {
                      if (snapshot !== undefined) {
                        updateState(storeName, [...stateActions, { type: 'action', name: prop, arg: snapshot, actionType: `${prop}()` }]);
                      }
                      reject(e);
                    });
                }
              })
            }
          }
        } else if ('invalidateCache' === prop) {
          return () => {
            const actionType = stateActions.map(sa => sa.actionType).join('.');
            updateState(storeName, [
              { type: 'property', name: 'cache', actionType: 'cache' },
              { type: 'property', name: actionType, actionType: actionType },
              { type: 'action', name: 'remove', actionType: 'remove()' },
            ]);
          }
        } else if ('upsertMatching' === prop) {
          stateActions.push({ type: 'upsertMatching', name: prop, actionType: prop });
          return initialize({}, false, stateActions);
        } else if ('read' === prop) {
          return () => readState(libState.appStates[storeName], [...stateActions, { type: 'action', name: prop }], { index: 0 })
        } else if ('onChange' === prop) {
          return (changeListener: (arg: any) => any) => {
            const stateActionsCopy = [...stateActions, { type: 'action', name: prop }] as StateAction[];
            libState.changeListeners[storeName].set(stateActionsCopy, changeListener);
            return { unsubscribe: () => { libState.changeListeners[storeName].delete(stateActionsCopy); } }
          }
        } else if (['and', 'or'].includes(prop)) {
          stateActions.push({ type: 'searchConcat', name: prop, actionType: prop });
          return initialize({}, false, stateActions);
        } else if (['eq', 'ne', 'in', 'ni', 'gt', 'gte', 'lt', 'lte', 'match'].includes(prop)) {
          return (arg: any) => {
            stateActions.push({ type: 'comparator', name: prop, arg, actionType: `${prop}(${arg})` });
            return initialize({}, false, stateActions);
          }
        } else if (['find', 'filter'].includes(prop)) {
          stateActions.push({ type: 'search', name: prop, actionType: prop });
          return initialize({}, false, stateActions);
        } else if (augmentations.selection[prop]) {
          return () => augmentations.selection[prop](initialize({}, false, stateActions))()
        } else {
          stateActions.push({ type: 'property', name: prop, actionType: prop });
          return initialize({}, false, stateActions);
        }
      }
    });
  };
  return initialize({}, true, []);
}

export const constructQuery = (stateActions: ReadonlyArray<StateAction>, cursor: { index: number }) => {
  const concatenateQueries = (queries: QuerySpec[]): QuerySpec[] => {
    const constructQuery = () => {
      const queryPaths = stateActions
        .slice(cursor.index, cursor.index + stateActions.slice(cursor.index).findIndex(sa => sa.type === 'comparator'))
        .reduce((prev, curr) => {
          cursor.index++;
          return prev.concat(curr);
        }, new Array<StateAction>());
      const comparator = stateActions[cursor.index++];
      return (e: any) => comparisons[comparator.name](queryPaths.reduce((prev, curr) => prev = prev[curr.name], e), comparator.arg);
    }
    queries.push({
      query: constructQuery(),
      concat: ['action', 'property'].includes(stateActions[cursor.index].type) ? 'last' : stateActions[cursor.index].name as 'and' | 'or'
    });
    if (stateActions[cursor.index].type === 'searchConcat') {
      cursor.index++;
      return concatenateQueries(queries);
    }
    return queries;
  }
  const queries = concatenateQueries([]);
  const ors = new Array<(arg: any) => boolean>();
  const ands = new Array<(arg: any) => boolean>();
  for (let i = 0; i < queries.length; i++) {
    const previousClauseWasAnAnd = queries[i - 1] && queries[i - 1].concat === 'and';
    if (queries[i].concat === 'and' || previousClauseWasAnAnd) {
      ands.push(queries[i].query);
    }
    if ((queries[i].concat === 'or' || queries[i].concat === 'last') && ands.length) {
      const andsCopy = ands.slice();
      ors.push(el => andsCopy.every(and => and(el)));
      ands.length = 0;
    }
    if (!(queries[i].concat === 'and') && !previousClauseWasAnAnd) {
      ors.push(queries[i].query);
    }
  }
  return (e: any) => ors.some(fn => fn(e));
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

const completeStateWrite = (stateActions: ReadonlyArray<StateAction>, payload: null | {}, newState: any) => {
  const type = stateActions.map(sa => sa.actionType).join('.');
  libState.currentAction = !libState.insideTransaction ? { type, ...payload }
    : !libState.currentAction.actions ? { type, actions: [{ type, ...payload }] }
      : { type: `${libState.currentAction.type}, ${type}`, actions: [...libState.currentAction.actions, { type, ...payload }] };
  return newState;
}

export const readState = (state: any, stateActions: StateAction[], cursor: { index: number }): any => {
  if (Array.isArray(state) && (stateActions[cursor.index].type === 'property')) {
    return (state as any[]).map((e, i) => readState(state[i], stateActions, { ...cursor }));
  }
  const action = stateActions[cursor.index++];
  if (cursor.index < stateActions.length) {
    if (Array.isArray(state) && (action.type === 'search')) {
      const query = constructQuery(stateActions, cursor);
      if ('find' === action.name) {
        const findResult = readState((state as any[]).find(query), stateActions, cursor);
        if (findResult === undefined) { throw new Error(errorMessages.FIND_RETURNS_NO_MATCHES); }
        return findResult;
      } else if ('filter' === action.name) {
        return (state as any[]).filter(query).map(e => readState(e, stateActions, { ...cursor }));
      }
    } else {
      return readState((state || {})[action.name], stateActions, cursor);
    }
  } else if (action.name === 'read' || action.name === 'onChange') {
    return state;
  }
}

export const comparisons = {
  eq: (val, arg) => val === arg,
  in: (val, arg) => arg.includes(val),
  ni: (val, arg) => !arg.includes(val),
  gt: (val, arg) => val > arg,
  lt: (val, arg) => val < arg,
  gte: (val, arg) => val >= arg,
  lte: (val, arg) => val <= arg,
  match: (val, arg) => arg.test(val),
} as { [comparator: string]: (val: any, arg: any) => boolean }

export function derive<X extends Readable<any>[]>(...args: X) {
  let previousParams = new Array<any>();
  let previousResult = null as any;
  return {
    with: <R>(calculation: (...inputs: DerivationCalculationInputs<X>) => R) => {
      const getValue = () => {
        const params = (args as Array<Readable<any>>).map(arg => arg.read());
        if (previousParams.length && params.every((v, i) => v === previousParams[i])) {
          return previousResult;
        }
        const result = calculation(...(params as any));
        previousParams = params;
        previousResult = result;
        return result;
      }
      const changeListeners = new Set<(value: R) => any>();
      const result: Derivation<R> = {
        read: () => getValue(),
        invalidate: () => previousParams.length = 0,
        onChange: (listener: (value: R) => any) => {
          changeListeners.add(listener);
          const unsubscribes: Unsubscribe[] = (args as Array<Readable<any>>)
            .map(ops => ops.onChange(() => listener(getValue())));
          return {
            unsubscribe: () => {
              unsubscribes.forEach(u => u.unsubscribe());
              changeListeners.delete(listener);
            }
          }
        }
      };
      // Object.keys(augmentations.derivation).forEach(name => (result as any)[name] = augmentations.derivation[name](result));
      return result;
    }
  }
}

export const transact = (...operations: (() => void)[]) => {
  if (!operations.length) { return; }
  if (operations.length === 1) { return operations[0](); }
  libState.currentAction = {};
  libState.insideTransaction = true;
  operations.forEach(op => op());
  libState.insideTransaction = false;
}

export const toIsoStringInCurrentTz = (date: Date) => {
  const tzo = -date.getTimezoneOffset();
  const dif = tzo >= 0 ? '+' : '-';
  const pad = (num: number) => {
    const norm = Math.floor(Math.abs(num));
    return (norm < 10 ? '0' : '') + norm;
  };
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + 'T' + pad(date.getHours())
    + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds()) + dif + pad(tzo / 60) + ':' + pad(tzo % 60);
}

export const deepFreeze = <T extends Object>(o: T): T => {
  Object.freeze(o);
  if (o == null || o === undefined) { return o; }
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

export const augmentations: Augmentations = {
  selection: {},
  future: {},
  derivation: {},
  async: promise => promise(),
};

export function augment(arg: Partial<Augmentations>) {
  Object.assign(augmentations, arg);
}

