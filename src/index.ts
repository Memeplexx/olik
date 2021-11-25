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
            return readState(libState.appStates[storeName], stateActions);
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

  // if this is an array and an array element property is being accessed directly without a search clause, eg: todos.status.replaceAll()
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

      // obtain contiguous stateActions and extract queryPaths
      const queryPaths = stateActions
        .slice(0, stateActions.findIndex(sa => sa.type(oldObj) === 'action') - 1)
        .reduce((prev, curr) => {
          stateActions.shift();
          return prev.concat(curr);
        }, new Array<StateAction>());

      const argAction = stateActions.shift()!;

      if (stateActions[0].name === 'remove') {
        const arrayIndicesToRemove = (oldObj as any[])
          .map((e, i) => {
            let toCompare = e;
            queryPaths.forEach(qp => toCompare = toCompare[qp.name])
            return compare(toCompare, argAction.arg, argAction.name) ? i : null;
          })
          .filter(e => e !== null);
        if ('find' === action.name) {
          if (!arrayIndicesToRemove.length) { throw new Error(); }
          arrayIndicesToRemove.length = 1; // only remove the first matching index
        }
        return (oldObj as any[]).filter((e, i) => !arrayIndicesToRemove.includes(i));
      } else {
        return (oldObj as any[]).map((e, i) => {
          let toCompare = e;
          queryPaths.forEach(qp => toCompare = toCompare[qp.name]);
          return compare(toCompare, argAction.arg, argAction.name)
            ? (typeof (oldObj[i]) === 'object'
              ? { ...oldObj[i], ...writeState(oldObj[i] || {}, newObj[i] || {}, stateActions.slice()) }
              : writeState(oldObj[i] || {}, newObj[i] || {}, stateActions.slice()))
            : e;
        });
      }
    } else {
      return { ...oldObj, [action.name]: writeState((oldObj || {})[action.name], ((newObj as any) || {})[action.name], stateActions.slice()) };
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

export const readState = <S>(state: S, stateActions: StateAction[]): any => {
  const action = stateActions.shift();
  if (!action) { return; /* Logically impossible */ }
  if (stateActions.length > 0) {
    if (['find', 'filter'].includes(action.name)) {
      const queryPath = stateActions.shift();
      if (!queryPath) { return; /* Note: POSSIBLE! */ }
      const argAction = stateActions.shift();
      if (!argAction) { return; /* Logically impossible */ }
      // return (oldObj as any as any[]).map((e, i) => e[queryPath.name] === argAction.arg
      //   ? { ...(oldObj as any)[i], ...copyState((oldObj as any)[i] || {}, (newObj as any)[i] || {}, stateActions) }
      //   : e);
      return readState(((state || []) as any[])[action.name as any]((e: any) => compare(e[queryPath.name], argAction.arg, argAction.name)), stateActions.slice());
    } else {
      return readState((state as any)[action.name], stateActions.slice());
    }
  } else {
    return state;
  }
}

export const compare = (arg0: any, arg1: any, comparator: string) => {
  if (comparator === 'eq') {
    return arg0 === arg1
  } else if (comparator === 'in') {
    return arg1.includes(arg0);
  }
}
