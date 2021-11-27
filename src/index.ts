import { FindOrFilter, QuerySpec, StateAction, UpdatableArray, UpdatableObject, UpdatablePrimitive } from "./types";


export const createApplicationStore = <S>(
  initialState: S, options: { name: string } = { name: document.title }
): S extends Array<any> ? UpdatableArray<S, FindOrFilter, 'notQueried'> : S extends object ? UpdatableObject<S, 'isFind', 'queried'> : UpdatablePrimitive<S, 'isFind', 'queried'> => {
  libState.appStates[options.name] = initialState;
  libState.changeListeners[options.name] = new Map();
  libState.logLevel = 'none';
  return readSelector(options.name);
}

export const libState = {
  appStates: {} as { [storeName: string]: any },
  changeListeners: {} as { [storeName: string]: Map<StateAction[], (arg: any) => any> },
  logLevel: 'none' as ('debug' | 'none'),
}

export const readSelector = (storeName: string) => {
  const initialize = (s: any, topLevel: boolean, stateActions: StateAction[]): any => {
    if (typeof s !== 'object') {
      return null as any;
    }
    return new Proxy(s, {
      get: function (target, prop: string) {
        if (topLevel) {
          stateActions = new Array<StateAction>();
        }
        if (['replace', 'patch', 'remove', 'increment', 'removeAll', 'replaceAll', 'patchAll', 'incrementAll', 'insertOne', 'insertMany', 'withOne', 'withMany'].includes(prop)) {
          return (arg: any) => {
            stateActions.push({ type: 'action', name: prop, arg, actionType: `${prop}()` });
            const oldState = libState.appStates[storeName];
            libState.appStates[storeName] = writeState(libState.appStates[storeName], { ...libState.appStates[storeName] }, stateActions.slice());
            notifySubscribers(oldState, libState.appStates[storeName], libState.changeListeners[storeName]);
          }
        } else if ('upsertMatching' === prop) {
          stateActions.push({ type: 'upsertMatching', name: prop, arg: null, actionType: prop });
          return initialize({}, false, stateActions);
        } else if ('read' === prop) {
          return () => {
            stateActions.push({ type: 'action', name: prop, arg: null, actionType: null });
            return readState(libState.appStates[storeName], stateActions.slice());
          }
        } else if ('onChange' === prop) {
          stateActions.push({ type: 'action', name: prop, arg: null, actionType: null });
          return (changeListener: (arg: any) => any) => {
            const stateActionsCopy = stateActions.slice();
            libState.changeListeners[storeName].set(stateActionsCopy, changeListener);
            return { unsubscribe: () => { libState.changeListeners[storeName].delete(stateActionsCopy); } }
          }
        } else if (['and', 'or'].includes(prop)) {
          stateActions.push({ type: 'searchConcat', name: prop, arg: null, actionType: prop });
          return initialize({}, false, stateActions);
        } else if (['eq', 'ne', 'in', 'ni', 'gt', 'gte', 'lt', 'lte', 'match'].includes(prop)) {
          return (arg: any) => {
            stateActions.push({ type: 'comparator', name: prop, arg, actionType: `${prop}(${arg})` });
            return initialize({}, false, stateActions);
          }
        } else if (['find', 'filter'].includes(prop)) {
          stateActions.push({ type: 'search', name: prop, arg: null, actionType: prop });
          return initialize({}, false, stateActions);
        } else {
          stateActions.push({ type: 'property', name: prop, arg: null, actionType: prop });
          return initialize({}, false, stateActions);
        }
      }
    });
  };
  return initialize({}, true, []);
}

export const notifySubscribers = (
  oldState: any,
  newState: any,
  changeListeners: Map<StateAction[], (arg: any) => any>
) => {
  changeListeners.forEach((listener, stateActions) => {
    const selectedNewState = readState(newState, stateActions.slice());
    const selectedOldState = readState(oldState, stateActions.slice());
    if (selectedOldState !== selectedNewState) {
      listener(selectedNewState);
    }
  })
}

export const constructQuery = (stateActions: StateAction[]) => {
  const concatenateQueries = (queries: QuerySpec[]): QuerySpec[] => {
    const constructQuery = () => {
      const queryPaths = stateActions
        .slice(0, stateActions.findIndex(sa => sa.type === 'comparator'))
        .reduce((prev, curr) => {
          stateActions.shift();
          return prev.concat(curr);
        }, new Array<StateAction>());
      const comparator = stateActions.shift()!;
      return (e: any) => compare(queryPaths.reduce((prev, curr) => prev = prev[curr.name], e), comparator.name, comparator.arg)
    }
    queries.push({ query: constructQuery(), concat: stateActions[0].type === 'action' ? 'last' : stateActions[0].name as 'and' | 'or' });
    if (stateActions[0].type === 'searchConcat') {
      stateActions.shift();
      return concatenateQueries(queries);
    }
    return queries;
  }
  const queries = concatenateQueries([]);
  const ors = new Array<(arg: any) => boolean>();
  const ands = new Array<(arg: any) => boolean>();
  for (let i = 0; i < queries.length; i++) {
    const isLastClause = queries[i].concat === 'last';
    const isAndClause = queries[i].concat === 'and';
    const isOrClause = queries[i].concat === 'or';
    const previousClauseWasAnAnd = queries[i - 1] && queries[i - 1].concat === 'and';
    if (isAndClause || previousClauseWasAnAnd) {
      ands.push(queries[i].query);
    }
    if ((isOrClause || isLastClause) && ands.length) {
      const andsCopy = ands.slice();
      ors.push(el => andsCopy.every(and => and(el)));
      ands.length = 0;
    }
    if (!isAndClause && !previousClauseWasAnAnd) {
      ors.push(queries[i].query);
    }
  }
  return (e: any) => ors.some(fn => fn(e));
}

export const writeState = (currentState: any, stateToUpdate: any, stateActions: StateAction[]): any => {
  if (Array.isArray(currentState) && (stateActions[0].type === 'property')) {
    return (currentState as any[]).map((e, i) => (typeof (currentState[i]) === 'object')
      ? { ...currentState[i], ...writeState(currentState[i] || {}, stateToUpdate[i] || {}, stateActions.slice()) }
      : writeState(currentState[i] || {}, stateToUpdate[i] || {}, stateActions.slice()));
  } else if (Array.isArray(currentState) && (stateActions[0].type === 'upsertMatching')) {
    stateActions.shift();
    const queryPaths = stateActions
      .slice(0, stateActions.findIndex(sa => sa.type === 'action'))
      .reduce((prev, curr) => {
        stateActions.shift();
        return prev.concat(curr);
      }, new Array<StateAction>());
    const upsert = stateActions.shift()!;
    const upsertArgs = Array.isArray(upsert.arg) ? upsert.arg : [upsert.arg];
    const result = (currentState as any[]).map(e => {
      const elementValue = queryPaths.reduce((prev, curr) => prev = prev[curr.name], e);
      const foundIndex = upsertArgs.findIndex(ua => queryPaths.reduce((prev, curr) => prev = prev[curr.name], ua) === elementValue);
      return foundIndex !== -1 ? upsertArgs.splice(foundIndex, 1)[0] : e;
    });
    return [...result, ...upsertArgs];
  }
  const action = stateActions.shift()!;
  if (stateActions.length > 0) {
    if (Array.isArray(currentState) && (action.type === 'search')) {
      const query = constructQuery(stateActions);
      let findIndex = -1;
      if ('find' === action.name) {
        findIndex = (currentState as any[]).findIndex(query);
        if (findIndex === -1) { throw new Error(); }
      }
      if (stateActions[0].name === 'remove') {
        if ('find' === action.name) {
          return (currentState as any[]).filter((e, i) => findIndex !== i);
        } else if ('filter' === action.name) {
          return (currentState as any[]).filter(query);
        }
      } else {
        if ('find' === action.name) {
          return (currentState as any[]).map((e, i) => i === findIndex
            ? (typeof (e) === 'object'
              ? { ...e, ...writeState(e || {}, stateToUpdate[i] || {}, stateActions.slice()) }
              : writeState(e, stateToUpdate[i], stateActions.slice()))
            : e);
        } else if ('filter' === action.name) {
          return (currentState as any[]).map((e, i) => query(e)
            ? (typeof (e) === 'object'
              ? { ...e, ...writeState(e || {}, stateToUpdate[i] || {}, stateActions.slice()) }
              : writeState(e, stateToUpdate[i], stateActions.slice()))
            : e);
        }
      }
    } else {
      return { ...currentState, [action.name]: writeState((currentState || {})[action.name], ((stateToUpdate as any) || {})[action.name], stateActions) };
    }
  } else if (action.name === 'replace') {
    return action.arg;
  } else if (action.name === 'patch') {
    return { ...currentState, ...(action.arg as any) }
  } else if (action.name === 'increment') {
    return currentState + action.arg;
  } else if (action.name === 'removeAll') {
    return [];
  } else if (action.name === 'replaceAll') {
    return action.arg;
  } else if (action.name === 'patchAll') {
    return (currentState as any[]).map(e => ({ ...e, ...action.arg }))
  } else if (action.name === 'incrementAll') {
    if (Array.isArray(currentState)) {
      return currentState.map((e: any) => e + action.arg);
    }
    return currentState + action.arg;
  } else if (action.name === 'insertOne') {
    return [...currentState, action.arg];
  } else if (action.name === 'insertMany') {
    return [...currentState, ...action.arg];
  }
}

export const readState = (state: any, stateActions: StateAction[]): any => {
  if (Array.isArray(state) && (stateActions[0].type === 'property')) {
    return (state as any[]).map((e, i) => readState(state[i], stateActions.slice()));
  }
  const action = stateActions.shift()!;
  if (stateActions.length > 0) {
    if (Array.isArray(state) && (action.type === 'search')) {
      const query = constructQuery(stateActions);
      if ('find' === action.name) {
        const findResult = readState((state as any[]).find(query), stateActions);
        if (findResult === undefined) { throw new Error(); }
        return findResult;
      } else if ('filter' === action.name) {
        return (state as any[]).filter(query).map(e => readState(e, stateActions.slice()));
      }
    } else {
      return readState((state || {})[action.name], stateActions);
    }
  } else if (action.name === 'read' || action.name === 'onChange') {
    return state;
  }
}

export const compare = (toCompare: any, comparator: string, comparatorArg: any) => {
  if (comparator === 'eq') {
    return toCompare === comparatorArg
  } else if (comparator === 'in') {
    return comparatorArg.includes(toCompare);
  } else if (comparator === 'ni') {
    return !comparatorArg.includes(toCompare);
  } else if (comparator === 'gt') {
    return toCompare > comparatorArg;
  } else if (comparator === 'lt') {
    return toCompare < comparatorArg;
  } else if (comparator === 'gte') {
    return toCompare >= comparatorArg;
  } else if (comparator === 'lte') {
    return toCompare <= comparatorArg;
  } else if (comparator === 'match') {
    return (toCompare as string).match(comparatorArg);
  }
}
