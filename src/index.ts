import { FindOrFilter, StateAction, UpdatableArray, UpdatableObject, UpdatablePrimitive } from "./types";


export const createApplicationStore = <S>(
  initialState: S, options: { name: string } = { name: document.title }
): S extends Array<any> ? UpdatableArray<S, FindOrFilter, 'notQueried'> : S extends object ? UpdatableObject<S, 'isFind', 'queried'> : UpdatablePrimitive<S, 'isFind', 'queried'> => {
  libState.appStates[options.name] = initialState;
  libState.logLevel = 'none';
  return readSelector(options.name);
}

export const libState = {
  appStates: {} as { [name: string]: any },
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
        if (['replace', 'patch', 'remove', 'increment', 'removeAll', 'replaceAll', 'incrementAll'].includes(prop)) {
          return (arg: any) => {
            stateActions.push({ type: () => 'action', name: prop, arg, actionType: `${prop}()` });
            libState.appStates[storeName] = writeState(libState.appStates[storeName], { ...libState.appStates[storeName] }, stateActions.slice());
            // console.log(stateActions.map(s => s.actionType).join('.'))
          }
        } else if ('read' === prop) {
          return () => {
            stateActions.push({ type: () => 'action', name: prop, arg: null, actionType: null });
            return readState(libState.appStates[storeName], stateActions.slice());
          }
        } else if ('onChange' === prop) {
          return () => {

          }
        } else if (['eq', 'ne', 'in', 'ni', 'gt', 'gte', 'lt', 'lte', 'match'].includes(prop)) {
          return (arg: any) => {
            stateActions.push({ type: () => 'comparator', name: prop, arg, actionType: `${prop}(${arg})` });
            return initialize({}, false, stateActions);
          }
        } else {
          stateActions.push({ type: (state) => (Array.isArray(state) && ['find', 'filter'].includes(prop)) ? 'search' : 'property', name: prop, arg: null, actionType: prop });
          return initialize({}, false, stateActions);
        }
      }
    });
  };
  return initialize({}, true, []);
}

export const writeState = (oldObj: any, newObj: any, stateActions: StateAction[]): any => {
  if (Array.isArray(oldObj) && (stateActions[0].type(oldObj) === 'property')) {
    return (oldObj as any[]).map((e, i) => {
      if (typeof (oldObj[i]) === 'object') {
        return { ...oldObj[i], ...writeState(oldObj[i] || {}, newObj[i] || {}, stateActions.slice()) };
      }
      return writeState(oldObj[i] || {}, newObj[i] || {}, stateActions.slice());
    });
  }
  const action = stateActions.shift()!;
  if (stateActions.length > 0) {
    if (Array.isArray(oldObj) && ['find', 'filter'].includes(action.name) && (action.type(oldObj) === 'search')) {
      const queryPaths = stateActions
        .slice(0, stateActions.findIndex(sa => sa.type(oldObj) === 'comparator'))
        .reduce((prev, curr) => {
          stateActions.shift();
          return prev.concat(curr);
        }, new Array<StateAction>());
      const argAction = stateActions.shift()!;
      if (stateActions[0].name === 'remove') {
        if ('find' === action.name) {
          const indexToRemove = (oldObj as any[])
            .findIndex(e => compare(queryPaths.reduce((prev, curr) => prev = prev[curr.name], e), argAction.arg, argAction.name));
          if (indexToRemove === -1) { throw new Error(); }
          return (oldObj as any[]).filter((e, i) => indexToRemove !== i);
        } else if ('filter' === action.name) {
          return (oldObj as any[])
            .filter((e, i) => compare(queryPaths.reduce((prev, curr) => prev = prev[curr.name], e), argAction.arg, argAction.name));
        }
      } else {
        return (oldObj as any[]).map((e, i) => {
          const toCompare = queryPaths.reduce((prev, curr) => prev = prev[curr.name], e);
          return compare(toCompare, argAction.arg, argAction.name)
            ? (typeof (oldObj[i]) === 'object'
              ? { ...oldObj[i], ...writeState(oldObj[i] || {}, newObj[i] || {}, stateActions.slice()) }
              : writeState(oldObj[i] || {}, newObj[i] || {}, stateActions.slice()))
            : e;
        });
      }
    } else {
      return { ...oldObj, [action.name]: writeState((oldObj || {})[action.name], ((newObj as any) || {})[action.name], stateActions) };
    }
  } else if (action.name === 'replace') {
    return action.arg;
  } else if (action.name === 'patch') {
    return { ...oldObj, ...(action.arg as any) }
  } else if (action.name === 'increment') {
    return oldObj + action.arg;
  } else if (action.name === 'removeAll') {
    return [];
  } else if (action.name === 'replaceAll') {
    return action.arg;
  } else if (action.name === 'incrementAll') {
    if (Array.isArray(oldObj)) {
      return oldObj.map((e: any) => e + action.arg);
    }
    return oldObj + action.arg;
  }
}

export const readState = (oldObj: any, stateActions: StateAction[]): any => {
  if (Array.isArray(oldObj) && (stateActions[0].type(oldObj) === 'property')) {
    return (oldObj as any[]).map((e, i) => {
      return readState(oldObj[i], stateActions.slice());
    });
  }
  const action = stateActions.shift()!;
  if (stateActions.length > 0) {
    if (Array.isArray(oldObj) && ['find', 'filter'].includes(action.name) && (action.type(oldObj) === 'search')) {
      const queryPaths = stateActions
        .slice(0, stateActions.findIndex(sa => sa.type(oldObj) === 'comparator'))
        .reduce((prev, curr) => {
          stateActions.shift();
          return prev.concat(curr);
        }, new Array<StateAction>());
      const argAction = stateActions.shift()!;
      if ('find' === action.name) {
        return readState((oldObj as any[])
          .find(e => compare(queryPaths.reduce((prev, curr) => prev = prev[curr.name], e), argAction.arg, argAction.name)), stateActions);
      } else if ('filter' === action.name) {
        return (oldObj as any[])
          .filter(e => compare(queryPaths.reduce((prev, curr) => prev = prev[curr.name], e), argAction.arg, argAction.name))
          .map(e => readState(e, stateActions));
      }
    } else {
      return readState((oldObj || {})[action.name], stateActions);
    }
  } else if (action.name === 'read') {
    return oldObj;
  }
}

export const compare = (arg0: any, arg1: any, comparator: string) => {
  if (comparator === 'eq') {
    return arg0 === arg1
  } else if (comparator === 'in') {
    return arg1.includes(arg0);
  } else if (comparator === 'ni') {
    return !arg1.includes(arg0);
  } else if (comparator === 'gt') {
    return arg0 > arg1;
  } else if (comparator === 'lt') {
    return arg0 < arg1;
  } else if (comparator === 'gte') {
    return arg0 >= arg1;
  } else if (comparator === 'lte') {
    return arg0 <= arg1;
  } else if (comparator === 'match') {
    return (arg0 as string).match(arg1);
  }
}
