import { integrateStoreWithReduxDevtools } from './devtools';
import { AvailableOps, Fetcher, Options, status, Unsubscribable } from './shape';

const skipProxyCheck = Symbol();

export const tests = {
  currentAction: { type: '', payload: null as any },
  currentMutableState: null,
  logLevel: 'DEBUG' as 'DEBUG' | 'ERROR'
}

export function make<S>(name: string, state: S, devtoolsOptions?: { maxAge?: number }) {
  const pathSegments = new Array<string>();
  const changeListeners = new Map<(arg: S) => any, (ar: any) => any>();
  const fetchers = new Map<string, Fetcher<any, any>>();
  let mutableStateCopy = deepCopy(state);
  const segGatherer = defineSegGatherer(mutableStateCopy);
  let currentState = deepFreeze(state) as S;
  const initialState = currentState;
  let devtoolsDispatchListener: ((action: { type: string, payload?: any }) => any) | undefined;
  const setDevtoolsDispatchListener = (listener: (action: { type: string, payload?: any }) => any) => devtoolsDispatchListener = listener;
  const actionReplace = <C>(selector: (s: S) => C, name: string) => (assignment: C, options?: Options) => {
    readPathOfSelector(selector);
    const isRootUpdate = !pathSegments.length;
    if (isRootUpdate) {
      updateState<S, C>(selector, `replace()`, assignment,
        old => deepCopy(assignment),
        old => {
          if (Array.isArray(old)) {
            old.length = 0; Object.assign(old, assignment);
          } else if (typeof (old) === 'boolean' || typeof (old) === 'number') {
            mutableStateCopy = assignment;
          } else {
            Object.assign(old, assignment);
          }
        }, { overrideActionName: true, dontTrackWithDevtools: options && options.dontTrackWithDevtools });
      return;
    }
    const lastSeg = pathSegments[pathSegments.length - 1] || '';
    const segsCopy = pathSegments.slice(0, pathSegments.length - 1);
    const selectorRevised = (state: any) => {
      let res = state;
      segsCopy.forEach(seg => res = res[seg]);
      return res;
    }
    updateState<S, C>(selectorRevised, `${pathSegments.join('.')}.${name}()`, assignment,
      old => Array.isArray(old) ? old.map((o, i) => i === +lastSeg ? deepCopy(assignment) : o) : ({ ...old, [lastSeg]: deepCopy(assignment) }),
      old => old[lastSeg] = assignment, { overrideActionName: true });
  };
  const action = <C, X extends C & Array<any>>(selector: (s: S) => C) => ({
    replaceWith: actionReplace(selector, 'replaceWith'),
    replaceAll: actionReplace(selector, 'replaceAll'),
    patchWith: (assignment: Partial<C>) => updateState<S, C>(selector, 'patchWith', assignment,
      old => ({ ...old, ...assignment }),
      old => Object.assign(old, assignment)),
    patchWhere: (where: (e: X) => boolean) => ({
      with: (assignment: Partial<X[0]>) => {
        const itemIndices = (selector(currentState) as any as X).map((e, i) => where(e) ? i : null).filter(i => i !== null);
        readPathOfSelector(selector);
        return updateState<S, C>(selector, `${pathSegments.join('.')}${pathSegments.length ? '.' : ''}${itemIndices.join(',')}.patchWhere()`,
          { patch: assignment, whereClause: where.toString() },
          old => (old as any[]).map((o, i) => itemIndices.includes(i) ? { ...o, ...assignment } : o),
          old => {
            (old as any[]).forEach((el, idx) => {
              if (itemIndices.includes(idx)) {
                Object.assign(old[idx], assignment);
              }
            })
          }, { overrideActionName: true });
      }
    }),
    addAfter: (...assignment: X) => updateState<S, C>(selector, 'addAfter', assignment,
      old => [...old, ...deepCopy(assignment)],
      old => old.push(...assignment)),
    addBefore: (...assignment: X) => updateState<S, C>(selector, 'addBefore', assignment,
      old => [...deepCopy(assignment), ...old],
      old => old.unshift(...assignment)),
    removeFirst: () => updateState<S, C>(selector, 'removeFirst', (selector(currentState) as any as X).slice(1),
      old => old.slice(1, old.length),
      old => old.shift()),
    removeLast: () => {
      const selection = selector(currentState) as any as X;
      updateState<S, C>(selector, 'removeLast', selection.slice(0, selection.length - 1),
        old => old.slice(0, old.length - 1),
        old => old.pop());
    },
    removeAll: () => updateState<S, C>(selector, 'removeAll', null,
      () => [],
      old => old.length = 0),
    removeWhere: (predicate: (arg: X[0]) => boolean) => {
      const itemIndices = (selector(currentState) as any as X).map((e, i) => predicate(e) ? i : null).filter(i => i !== null);
      readPathOfSelector(selector);
      return updateState<S, C>(selector, `${pathSegments.join('.')}${pathSegments.length ? '.' : ''}${itemIndices.join(',')}.removeWhere()`,
        { toRemove: (selector(currentState) as any as X).filter(predicate), whereClause: predicate.toString() },
        old => old.filter((o: any) => !predicate(o)),
        old => {
          const toRemove = old.filter(predicate, skipProxyCheck);
          for (var i = 0; i < old.length; i++) {
            if (toRemove.includes(old[i])) {
              old.splice(i, 1);
              i--;
            }
          }
        }, { overrideActionName: true });
    },
    upsertWhere: (criteria: (e: X[0]) => boolean) => ({
      with: (element: X[0]) => {
        const itemIndices = (selector(currentState) as any as X).map((e, i) => criteria(e) ? i : null).filter(i => i !== null);
        if (itemIndices.length > 1) { throw new Error('Cannot upsert more than 1 element'); }
        return itemIndices.length
          ? action(selector as (s: S) => X).replaceWhere(criteria).with(element)
          : action(selector as (s: S) => X).addAfter(element);
      }
    }),
    replaceWhere: (criteria: (e: X[0]) => boolean) => ({
      with: (assignment: X[0]) => {
        const itemIndices = (selector(currentState) as any as X).map((e, i) => criteria(e) ? i : null).filter(i => i !== null);
        readPathOfSelector(selector);
        return updateState<S, C>(selector, `${pathSegments.join('.')}${pathSegments.length ? '.' : ''}${itemIndices.join(',')}.replaceWhere()`,
          { replacement: assignment, whereClause: criteria.toString() },
          old => (old as any[]).map((o, i) => itemIndices.includes(i) ? deepCopy(assignment) : o),
          old => {
            (old as any[]).forEach((el, idx) => {
              if (itemIndices.includes(idx)) {
                old[idx] = assignment;
              }
            })
          }, { overrideActionName: true });
      }
    }),
    createFetcher: (promise: () => Promise<C>, specs: { cacheForMillis: number } = { cacheForMillis: 0 }) => {
      const otherFetchers = new Array<{ resolve: (c: C) => void, reject: (e: any) => void }>();
      readPathOfSelector(selector);
      const path = pathSegments.join('.');
      const statusChangeListeners = new Set<(status: status) => any>();
      let lastFetch = 0;
      const result = new (class {
        store = storeResult;
        selector = selector;
        status: status = 'pristine';
        invalidateCache = () => { lastFetch = 0; }
        onStatusChange = (listener: (status: status) => Unsubscribable) => { statusChangeListeners.add(listener); return { unsubscribe: () => statusChangeListeners.delete(listener) } }
        private setStatus = (status: status) => { this.status = status; statusChangeListeners.forEach(listener => listener(status)); }
        fetch = () => {
          const cacheHasExpired = (lastFetch + (specs.cacheForMillis || 0)) < Date.now();
          if ((this.status === 'resolved') && !cacheHasExpired) {
            return Promise.resolve(selector(storeResult().read()));
          } else if (this.status === 'resolving') {
            return new Promise<C>((resolve, reject) => otherFetchers.push({ resolve, reject }));
          } else {
            this.setStatus('resolving');
            return promise()
              .then(response => {
                this.setStatus('resolved');
                const piece = storeResult(selector) as any as { replace: (c: C) => void } & { replaceAll: (c: C) => void };
                if (piece.replaceAll) { piece.replaceAll(response); } else { piece.replace(response); }
                lastFetch = Date.now();
                otherFetchers.forEach(f => f.resolve(response));
                otherFetchers.length = 0;
                return selector(storeResult().read());
              }).catch(rejection => {
                this.setStatus('error');
                otherFetchers.forEach(f => f.reject(rejection));
                otherFetchers.length = 0;
                throw rejection;
              })
          }
        }
      })();
      fetchers.set(path, result);
      return result;
    },
    onChange: (performAction: (selection: C) => any) => {
      changeListeners.set(selector, performAction);
      return { unsubscribe: () => changeListeners.delete(selector) };
    },
    read: () => selector(currentState),
    reset: () => actionReplace(selector, 'reset')(selector(initialState)),
  } as any as AvailableOps<S, C>);


  const storeResult = <C = S>(selector: ((s: S) => C) = (s => s as any as C)) => {
    const selectorMod = selector as (s: S) => C;
    selectorMod(currentState);
    return action(selectorMod);
  };

  function updateState<S, C>(
    selector: (s: S) => C,
    actionName: string,
    payload: any,
    action: (newNode: any) => any,
    mutator: (newNode: any) => any,
    options: {
      overrideActionName?: boolean,
      dontTrackWithDevtools?: boolean,
    } = {
        dontTrackWithDevtools: false,
        overrideActionName: false,
      },
  ) {
    readPathOfSelector(selector);
    const result = deepFreeze(copyObject(currentState, { ...currentState }, pathSegments.slice(), action));
    notifySubscribers(result);
    mutator(selector(mutableStateCopy));
    // segGatherer = defineSegGatherer(mutableStateCopy);
    currentState = result;
    const actionToDispatch = {
      type: options && options.overrideActionName ? actionName : ((pathSegments.join('.') + (pathSegments.length ? '.' : '') + actionName + '()')),
      payload,
    };
    tests.currentAction = actionToDispatch;
    tests.currentMutableState = mutableStateCopy;
    if (devtoolsDispatchListener && !options.dontTrackWithDevtools) {
      devtoolsDispatchListener(actionToDispatch);
    }
  }

  function defineSegGatherer<S extends object>(state: S): S {
    if (typeof (state) !== 'object') { // may happen if we have a top-level primitive
      return null as any as S;
    }
    return new Proxy(state, {
      get: function (target, prop: any) {
        const val = (target as any)[prop];
        if (val !== null && typeof (val) === 'object') {
          pathSegments.push(prop);
          return defineSegGatherer(val);
        } else if (typeof (val) === 'function') {
          return function (...args: any[]) {
            if (prop !== 'filter' || args[1] !== skipProxyCheck) {
              throw new Error(
                `'getStore(...${prop}())' detected. If you're trying to filter or find elements, rather use a library function eg. getStore(some.array).removeWhere(e => e.status === 'done')`);
            }
            const filtered = val.apply(target, args) as any[];
            const indices = (target as any[]).map((e, i) => filtered.includes(e) ? i : null).filter(e => e !== null, skipProxyCheck) as number[];
            pathSegments.push(indices.toString());
            return filtered;
          };
        }
        pathSegments.push(prop);
        return val;
      },
    });
  }

  function copyObject<T>(oldObj: T, newObj: T, segs: string[], action: (newNode: any) => any): any {
    const seg = (segs as (keyof T)[]).shift();
    if (seg) {
      if ((seg as string).includes(',') || !isNaN(seg as any)) {
        const arrayIndices = (seg as string).split(',').map(e => +e);
        return (oldObj as any as any[]).map((e, i) => arrayIndices.includes(i)
          ? { ...(oldObj as any)[i], ...copyObject((oldObj as any)[i], (newObj as any)[i], segs, action) }
          : e);
      }
      return { ...oldObj, [seg]: copyObject(oldObj[seg], newObj[seg], segs, action) };
    } else {
      return action(oldObj);
    }
  }

  function notifySubscribers(result: S) {
    changeListeners.forEach((subscriber, selector) => {
      const selected = selector(result);
      if (selector(currentState) !== selected) {
        subscriber(selected);
      }
    })
  }

  function readPathOfSelector<S, C>(selector: (state: S) => C) {
    pathSegments.length = 0;
    selector(segGatherer);
  }

  integrateStoreWithReduxDevtools<S>(storeResult, { name, ...devtoolsOptions }, setDevtoolsDispatchListener);

  return storeResult;
}

function deepFreeze(o: any) {
  Object.freeze(o);
  Object.getOwnPropertyNames(o).forEach(prop => {
    if (o.hasOwnProperty(prop)
      && o[prop] !== null
      && (typeof o[prop] === "object" || typeof o[prop] === "function")
      && !Object.isFrozen(o[prop])) {
      deepFreeze(o[prop]);
    }
  });
  return o;
}

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

type ReadType<E> = E extends AvailableOps<any, infer W> ? W : never;

type MappedDataTuple<T extends Array<AvailableOps<any, any>>> = {
  [K in keyof T]: ReadType<T[K]>;
}

export function derive<X extends AvailableOps<any, any>[]>(...args: X) {
  let previousParams = new Array<any>();
  let previousResult = null as any;
  return {
    using: <R>(calculation: (...inputs: MappedDataTuple<X>) => R) => {
      const getValue = () => {
        const params = (args as Array<AvailableOps<any, any>>).map(arg => arg.read());
        if (previousParams.length && params.every((v, i) => v === previousParams[i])) {
          return previousResult;
        }
        const result = calculation(...(params as AvailableOps<any, any>));
        previousParams = params;
        previousResult = result;
        return result;
      }
      const changeListeners = new Set<(value: R) => any>();
      return {
        read: () => getValue(),
        onChange: (listener: (value: R) => any) => {
          changeListeners.add(listener);
          const unsubscribables: Unsubscribable[] = (args as Array<AvailableOps<any, any>>)
            .map(ops => ops.onChange(() => listener(getValue())));
          return {
            unsubscribe: () => {
              unsubscribables.forEach(u => u.unsubscribe());
              changeListeners.delete(listener);
            }
          }
        }
      } as {
        read: () => R,
        onChange: (listener: (value: R) => any) => Unsubscribable,
      };
    }
  }
}
