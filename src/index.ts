export type FindOrFilter = 'isFind' | 'isFilter';
export type QueryStatus = 'notQueried' | 'queried';

/**
 * An array which cannot be mutated
 */
export interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {
}

/**
 * An object which cannot be mutated
 */
export type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

/**
 * An object or an array which cannot be mutated
 */
export type DeepReadonly<T> =
  T extends (infer R)[] ? DeepReadonlyArray<R> :
  T extends object ? DeepReadonlyObject<T> :
  T;

/**
 * An object which can be unsubscribed from
 */
export interface Unsubscribable {
  /**
   * Unsubscribes from this listener thereby preventing a memory leak.
   */
  unsubscribe: () => any,
}

export type UpdatableObject<S, F extends FindOrFilter, Q extends QueryStatus> = {
  replace: (replacement: S) => void;
  patch: (patch: Partial<S>) => void;
}
  & { [K in keyof S]: S[K] extends Array<any> ? UpdatableArray<S[K], 'isFilter', 'notQueried'> : S[K] extends object ? UpdatableObject<S[K], F, Q> : UpdatablePrimitive<S[K], F, Q> }
  & Readable<S, F>;

export type UpdatableArray<S extends Array<any>, F extends FindOrFilter, Q extends QueryStatus> = {
  // replace: (replacement: F extends 'isFilter' ? S : S[0]) => void,
}
  & (Q extends 'queried' ? {
    or: Comparators<S, S[0], F> & (S[0] extends object ? SearchableAny<S, S[0], F> : {}),
    and: Comparators<S, S[0], F> & (S[0] extends object ? SearchableAny<S, S[0], F> : {}),
    replace: (replacement: F extends 'isFilter' ? S : S[0]) => void,
    remove: () => void,
  } : {
    find: Comparators<S, S[0], 'isFind'> & (S[0] extends object ? SearchableAny<S, S[0], 'isFind'> : {}),
    filter: Comparators<S, S[0], 'isFilter'> & (S[0] extends object ? SearchableAny<S, S[0], 'isFilter'> : {}),
    removeAll: () => void,
    replaceAll: (newArray: S) => void,
  })
  & (S[0] extends Array<any> ? {} : S[0] extends object ? UpdatableObject<S[0], F, Q> : UpdatablePrimitive<S[0], F, Q>);

export type UpdatablePrimitive<S, F extends FindOrFilter, Q extends QueryStatus> = (
  Q extends 'notQueried' ? {
    replaceAll: (replacement: S) => void;
  } : {
    replace: (replacement: S) => void;
  }
) & (S extends number ?
  (Q extends 'notQueried' ? {
    incrementAll: (by: number) => void;
  } : {
    increment: (by: number) => void;
  }) : {
  }
) & Readable<S, F>;

export interface Readable<S, F extends FindOrFilter> {
  read: () => F extends 'isFilter' ? DeepReadonly<S[]> : DeepReadonly<S>;
  onChange: (changeListener: (state: F extends 'isFilter' ? DeepReadonly<S[]> : DeepReadonly<S>) => any) => Unsubscribable;
}

export type UpdatableAny<T, F extends FindOrFilter, Q extends QueryStatus>
  = T extends Array<any>
  ? UpdatableArray<T, F, Q>
  : T extends object
  ? UpdatableObject<T, F, Q>
  : UpdatablePrimitive<T, F, Q>;

export type Comparators<T, S, F extends FindOrFilter> = {
  eq: (value: S) => UpdatableAny<T, F, 'queried'>,
  ne: (value: S) => UpdatableAny<T, F, 'queried'>,
  in: (array: S[]) => UpdatableAny<T, F, 'queried'>,
  ni: (array: S[]) => UpdatableAny<T, F, 'queried'>,
} & (S extends string ? {
  match: (matches: RegExp) => UpdatableAny<T, F, 'queried'>,
  gt: (greaterThan: S) => UpdatableAny<T, F, 'queried'>,
  gte: (greaterThanOrEqualTo: S) => UpdatableAny<T, F, 'queried'>,
  lt: (lessThan: S) => UpdatableAny<T, F, 'queried'>,
  lte: (lessThanOrEqualTo: S) => UpdatableAny<T, F, 'queried'>,
} : S extends number ? {
  gt: (greaterThan: S) => UpdatableAny<T, F, 'queried'>,
  gte: (greaterThanOrEqualTo: S) => UpdatableAny<T, F, 'queried'>,
  lt: (lessThan: S) => UpdatableAny<T, F, 'queried'>,
  lte: (lessThanOrEqualTo: S) => UpdatableAny<T, F, 'queried'>,
} : {});

export type SearchableAny<T, S, F extends FindOrFilter> = { [K in keyof S]: (S[K] extends object ? (SearchableAny<T, S[K], F> & Comparators<T, S[K], F>) : Comparators<T, S[K], F>) };

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

export interface StateAction {
  type: (state: any) => 'property' | 'search' | 'comparator' | 'action';
  name: string;
  arg: any;
  actionType: string | null;
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
            libState.appStates[storeName] = writeState(libState.appStates[storeName], { ...libState.appStates[storeName] }, stateActions);
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

export const compare = (arg0: any, arg1: any, comparator: string) => {
  if (comparator === 'eq') {
    return arg0 === arg1
  } else if (comparator === 'in') {
    return arg1.includes(arg0);
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
    if (Array.isArray(oldObj)) {
      return oldObj.map(e => action.arg);
    }
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



