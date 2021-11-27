import { FindOrFilter, StateAction, UpdatableArray, UpdatableObject, UpdatablePrimitive } from "./types";


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
        if (['replace', 'patch', 'remove', 'increment', 'removeAll', 'replaceAll', 'incrementAll'].includes(prop)) {
          return (arg: any) => {
            stateActions.push({ type: 'action', name: prop, arg, actionType: `${prop}()` });
            const oldState = libState.appStates[storeName];
            libState.appStates[storeName] = writeState(libState.appStates[storeName], { ...libState.appStates[storeName] }, stateActions.slice());
            // console.log(stateActions.map(s => s.actionType).join('.'))
            notifySubscribers(oldState, libState.appStates[storeName], libState.changeListeners[storeName]);
          }
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
        // } else if ('or' === prop) {
          
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

export const writeState = (oldObj: any, newObj: any, stateActions: StateAction[]): any => {
  if (Array.isArray(oldObj) && (stateActions[0].type === 'property')) {
    return (oldObj as any[]).map((e, i) => {
      if (typeof (oldObj[i]) === 'object') {
        return { ...oldObj[i], ...writeState(oldObj[i] || {}, newObj[i] || {}, stateActions.slice()) };
      }
      return writeState(oldObj[i] || {}, newObj[i] || {}, stateActions.slice());
    });
  }
  const action = stateActions.shift()!;
  if (stateActions.length > 0) {
    if (Array.isArray(oldObj) && (action.type === 'search')) {
      const queryPaths = stateActions
        .slice(0, stateActions.findIndex(sa => sa.type === 'comparator'))
        .reduce((prev, curr) => {
          stateActions.shift();
          return prev.concat(curr);
        }, new Array<StateAction>());
      const argAction = stateActions.shift()!;
      if (stateActions[0].name === 'remove') {
        if ('find' === action.name) {
          const indexToRemove = (oldObj as any[])
            .findIndex(e => compare(queryPaths.reduce((prev, curr) => prev = prev[curr.name], e), argAction.name, argAction.arg));
          if (indexToRemove === -1) { throw new Error(); }
          return (oldObj as any[])
            .filter((e, i) => indexToRemove !== i);
        } else if ('filter' === action.name) {
          return (oldObj as any[])
            .filter((e, i) => compare(queryPaths.reduce((prev, curr) => prev = prev[curr.name], e), argAction.name, argAction.arg));
        }
      } else {
        return (oldObj as any[]).map((e, i) => {
          return compare(queryPaths.reduce((prev, curr) => prev = prev[curr.name], e), argAction.name, argAction.arg)
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

export const readState = (state: any, stateActions: StateAction[]): any => {
  if (Array.isArray(state) && (stateActions[0].type === 'property')) {
    return (state as any[]).map((e, i) => {
      return readState(state[i], stateActions.slice());
    });
  }
  const action = stateActions.shift()!;
  if (stateActions.length > 0) {
    if (Array.isArray(state) && (action.type === 'search')) {
      const queryPaths = stateActions
        .slice(0, stateActions.findIndex(sa => sa.type === 'comparator'))
        .reduce((prev, curr) => {
          stateActions.shift();
          return prev.concat(curr);
        }, new Array<StateAction>());
      const argAction = stateActions.shift()!;
      if ('find' === action.name) {
        return readState((state as any[])
          .find(e => compare(queryPaths.reduce((prev, curr) => prev = prev[curr.name], e), argAction.name, argAction.arg)), stateActions);
      } else if ('filter' === action.name) {
        return (state as any[])
          .filter(e => compare(queryPaths.reduce((prev, curr) => prev = prev[curr.name], e), argAction.name, argAction.arg))
          .map(e => readState(e, stateActions));
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
