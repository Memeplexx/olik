import { integrateStoreWithReduxDevtools } from './devtools';
import { AvailableOps, Derivation, EnhancerOptions, MappedDataTuple, FetcherStatus, Unsubscribable } from './shape';
import { tests } from './tests';

/**
 * Creates a new store which, for typescript users, requires that users supply an additional 'tag' when performing a state update.
 * These tags can improve the debugging experience by describing the source of an update event, for example the name of the component an update was trigger from.
 * @param nameOrDevtoolsConfig takes either a string, or an object
 * @param state the initial state  
 * 
 * FOR EXAMPLE:
 * ```
 * const getStore = makeEnforceTags('store', { todos: Array<{id: number, text: string}>() });
 * 
 * // Note that when updating state, we are now required to supply a string as the last argument (in this case 'TodoDetailComponent')
 * getStore(s => s.todos)
 *   .patchWhere(t => t.id === 1)
 *   .with({ text: 'bake cookies' }, 'TodoDetailComponent')
 * ```
 */
export function makeEnforceTags<S>(nameOrDevtoolsConfig: string | EnhancerOptions, state: S, tagSanitizer?: (tag: string) => string) {
  return makeInternal(nameOrDevtoolsConfig, state, tagSanitizer) as any as <C = S>(selector?: (s: S) => C) => AvailableOps<S, C, true>;
}

/**
 * Creates a new store
 * @param nameOrDevtoolsConfig takes either a string, or an object
 * @param state the initial state
 * 
 * FOR EXAMPLE:
 * ```
 * const getStore = make('store', { todos: Array<{id: number, text: string}>() });
 * ```
 */
export function make<S>(nameOrDevtoolsConfig: string | EnhancerOptions, state: S) {
  return makeInternal(nameOrDevtoolsConfig, state) as any as <C = S>(selector?: (s: S) => C) => AvailableOps<S, C, false>;
}

function makeInternal<S>(nameOrDevtoolsConfig: string | EnhancerOptions, state: S, tagSanitizer?: (tag: string) => string) {
  const changeListeners = new Map<(ar: any) => any, (arg: S) => any>();
  const pathReader = createPathReader(state);
  let currentState = deepFreeze(state) as S;
  const initialState = currentState;
  let devtoolsDispatchListener: ((action: { type: string, payload?: any }) => any) | undefined;
  const setDevtoolsDispatchListener = (listener: (action: { type: string, payload?: any }) => any) => devtoolsDispatchListener = listener;
  const replace = <C>(selector: (s: S) => C, name: string) => (assignment: C, tag?: string) => {
    const isRootUpdate = !pathReader.readSelector(selector).length;
    if (isRootUpdate) {
      updateState<C>(selector, `replace()`, assignment,
        old => deepCopy(assignment),
        old => {
          if (Array.isArray(old)) {
            old.length = 0; Object.assign(old, assignment);
          } else if (typeof (old) === 'boolean' || typeof (old) === 'number') {
            pathReader.mutableStateCopy = assignment;
          } else {
            Object.assign(old, assignment);
          }
        }, { overrideActionName: true, tag });
      return;
    }
    const pathSegments = pathReader.pathSegments;
    const lastSeg = pathSegments[pathSegments.length - 1] || '';
    const segsCopy = pathSegments.slice(0, pathSegments.length - 1);
    const selectorRevised = (state: any) => {
      let res = state;
      segsCopy.forEach(seg => res = res[seg]);
      return res;
    }
    updateState<C>(selectorRevised, `${pathSegments.join('.')}.${name}()`, assignment,
      old => Array.isArray(old) ? old.map((o, i) => i === +lastSeg ? deepCopy(assignment) : o) : ({ ...old, [lastSeg]: deepCopy(assignment) }),
      old => old[lastSeg] = assignment, { overrideActionName: true, tag });
  };
  const action = <C, X extends C & Array<any>>(selector: (s: S) => C) => ({
    replaceWith: replace(selector, 'replaceWith'),
    replaceAll: replace(selector, 'replaceAll'),
    patchWith: (assignment: Partial<C>, tag?: string) => updateState<C>(selector, 'patchWith', assignment,
      old => ({ ...old, ...assignment }),
      old => Object.assign(old, assignment), { tag }),
    patchWhere: (where: (e: X) => boolean) => ({
      with: (assignment: Partial<X[0]>, tag?: string) => {
        const itemIndices = (selector(currentState) as any as X).map((e, i) => where(e) ? i : null).filter(i => i !== null);
        const pathSegments = pathReader.readSelector(selector);
        return updateState<C>(selector, `${pathSegments.join('.')}${pathSegments.length ? '.' : ''}${itemIndices.join(',')}.patchWhere()`,
          { patch: assignment, whereClause: where.toString() },
          old => (old as any[]).map((o, i) => itemIndices.includes(i) ? { ...o, ...assignment } : o),
          old => {
            (old as any[]).forEach((el, idx) => {
              if (itemIndices.includes(idx)) {
                Object.assign(old[idx], assignment);
              }
            })
          }, { overrideActionName: true, tag });
      }
    }),
    addAfter: (assignment: X[0][], tag?: string) => updateState<C>(selector, 'addAfter', assignment,
      old => [...old, ...deepCopy(assignment)],
      old => old.push(...assignment), { tag }),
    addBefore: (assignment: X[0][], tag?: string) => updateState<C>(selector, 'addBefore', assignment,
      old => [...deepCopy(assignment), ...old],
      old => old.unshift(...assignment), { tag }),
    removeFirst: (tag?: string) => updateState<C>(selector, 'removeFirst', (selector(currentState) as any as X).slice(1),
      old => old.slice(1, old.length),
      old => old.shift(), { tag }),
    removeLast: (tag?: string) => {
      const selection = selector(currentState) as any as X;
      updateState<C>(selector, 'removeLast', selection.slice(0, selection.length - 1),
        old => old.slice(0, old.length - 1),
        old => old.pop(), { tag });
    },
    removeAll: (tag?: string) => updateState<C>(selector, 'removeAll', null,
      () => [],
      old => old.length = 0, { tag }),
    removeWhere: (predicate: (arg: X[0]) => boolean, tag?: string) => {
      const itemIndices = (selector(currentState) as any as X).map((e, i) => predicate(e) ? i : null).filter(i => i !== null);
      const pathSegments = pathReader.readSelector(selector);
      return updateState<C>(selector, `${pathSegments.join('.')}${pathSegments.length ? '.' : ''}${itemIndices.join(',')}.removeWhere()`,
        { toRemove: (selector(currentState) as any as X).filter(predicate), whereClause: predicate.toString() },
        old => old.filter((o: any) => !predicate(o)),
        old => {
          const toRemove = old.filter(predicate);
          for (var i = 0; i < old.length; i++) {
            if (toRemove.includes(old[i])) {
              old.splice(i, 1);
              i--;
            }
          }
        }, { overrideActionName: true, tag });
    },
    upsertWhere: (criteria: (e: X[0]) => boolean) => ({
      with: (element: X[0], tag?: string) => {
        const itemIndices = (selector(currentState) as any as X).map((e, i) => criteria(e) ? i : null).filter(i => i !== null);
        if (itemIndices.length > 1) { throw new Error('Cannot upsert more than 1 element'); }
        return itemIndices.length
          ? action(selector as (s: S) => X).replaceWhere(criteria).with(element, tag)
          : action(selector as (s: S) => X).addAfter([element], tag);
      }
    }),
    replaceWhere: (criteria: (e: X[0]) => boolean) => ({
      with: (assignment: X[0], tag?: string) => {
        const itemIndices = (selector(currentState) as any as X).map((e, i) => criteria(e) ? i : null).filter(i => i !== null);
        const pathSegments = pathReader.readSelector(selector);
        return updateState<C>(selector, `${pathSegments.join('.')}${pathSegments.length ? '.' : ''}${itemIndices.join(',')}.replaceWhere()`,
          { replacement: assignment, whereClause: criteria.toString() },
          old => (old as any[]).map((o, i) => itemIndices.includes(i) ? deepCopy(assignment) : o),
          old => {
            (old as any[]).forEach((el, idx) => {
              if (itemIndices.includes(idx)) {
                old[idx] = assignment;
              }
            })
          }, { overrideActionName: true, tag });
      }
    }),
    reset: (tag?: string) => replace(selector, 'reset')(selector(initialState), tag),
    createFetcher: (promise: () => Promise<C>, specs: { cacheForMillis: number } = { cacheForMillis: 0 }) => {
      const otherFetcherPromises = new Array<{ resolve: (c: C) => void, reject: (e: any) => void }>();
      const statusChangeListeners = new Set<(status: FetcherStatus) => any>();
      let lastFetch = 0;
      return new (class {
        store = storeResult(selector);
        selector = selector;
        status: FetcherStatus = 'pristine';
        error?: any;
        invalidateCache = () => { lastFetch = 0; }
        onStatusChange = (listener: (payload: FetcherStatus) => Unsubscribable) => {
          statusChangeListeners.add(listener);
          return { unsubscribe: () => statusChangeListeners.delete(listener) };
        }
        private notifyChangeListeners = () => statusChangeListeners.forEach(listener => listener(this.status));
        fetch = (tag: string | void) => {
          const cacheHasExpired = (lastFetch + (specs.cacheForMillis || 0)) < Date.now();
          if ((this.status === 'resolved') && !cacheHasExpired) {
            return Promise.resolve(selector(storeResult().read()));
          } else if (this.status === 'resolving') {
            return new Promise<C>((resolve, reject) => otherFetcherPromises.push({ resolve, reject }));
          } else {
            this.status = 'resolving';
            this.notifyChangeListeners();
            return promise()
              .then(value => {
                const piece = storeResult(selector) as any as { replace: (c: C, tag: string | void) => void } & { replaceAll: (c: C, tag: string | void) => void };
                if (piece.replaceAll) { piece.replaceAll(value, tag); } else { piece.replace(value, tag); }
                lastFetch = Date.now();
                otherFetcherPromises.forEach(f => f.resolve(value));
                otherFetcherPromises.length = 0;
                this.status = 'resolved';
                this.notifyChangeListeners();
                return value;
              }).catch(error => {
                otherFetcherPromises.forEach(f => f.reject(error));
                otherFetcherPromises.length = 0;
                this.error = error;
                this.status = 'error';
                this.notifyChangeListeners();
                const sub = this.store.onChange(() => {
                  if (this.status !== 'resolved') {
                    this.status = 'resolved';
                    this.notifyChangeListeners();
                  }
                  sub.unsubscribe();
                });
                return error;
              })
          }
        }
      })();
    },
    onChange: (performAction: (selection: C) => any) => {
      changeListeners.set(performAction, selector);
      return { unsubscribe: () => changeListeners.delete(performAction) };
    },
    read: () => selector(currentState),
  } as any as AvailableOps<S, C, any>);

  const storeResult = <C = S>(selector: ((s: S) => C) = (s => s as any as C)) => {
    const selectorMod = selector as (s: S) => C;
    selectorMod(currentState);
    return action(selectorMod);
  };

  function updateState<C>(
    selector: (s: S) => C,
    actionName: string,
    payload: any,
    action: (newNode: any) => any,
    mutator: (newNode: any) => any,
    options: {
      overrideActionName?: boolean,
      tag?: string,
    } = {
        overrideActionName: false,
      },
  ) {
    const pathSegments = pathReader.readSelector(selector);
    const previousState = currentState;
    const result = deepFreeze(copyObject(currentState, { ...currentState }, pathSegments.slice(), action));
    mutator(selector(pathReader.mutableStateCopy));
    currentState = result;
    notifySubscribers(previousState, result);
    const actionToDispatch = {
      type: (options && options.overrideActionName ? actionName : ((pathSegments.join('.') + (pathSegments.length ? '.' : '') + actionName + '()')))
        + (options.tag ? ` [${tagSanitizer ? tagSanitizer(options.tag) : options.tag}]` : ''),
      payload,
    };
    tests.currentAction = actionToDispatch;
    tests.currentMutableState = pathReader.mutableStateCopy;
    if (devtoolsDispatchListener && (!options.tag || (options.tag !== 'dontTrackWithDevtools'))) {
      devtoolsDispatchListener(actionToDispatch);
    }
  }

  function notifySubscribers(oldState: S, newState: S) {
    changeListeners.forEach((selector, subscriber) => {
      const selectedNewState = selector(newState);
      if (selector(oldState) !== selectedNewState) {
        subscriber(selectedNewState);
      }
    })
  }

  integrateStoreWithReduxDevtools<S>(storeResult, typeof (nameOrDevtoolsConfig) === 'string' ? { name: nameOrDevtoolsConfig } : nameOrDevtoolsConfig, setDevtoolsDispatchListener);

  return storeResult;
}

function copyObject<T>(oldObj: T, newObj: T, segs: string[], action: (newNode: any) => any): any {
  const seg = (segs as (keyof T)[]).shift();
  if (seg) {
    if (!isNaN(seg as any)) { // must be an array key
      return (oldObj as any as any[]).map((e, i) => +seg === i
        ? { ...(oldObj as any)[i], ...copyObject((oldObj as any)[i], (newObj as any)[i], segs, action) }
        : e);
    }
    return { ...oldObj, [seg]: copyObject(oldObj[seg], newObj[seg], segs, action) };
  } else {
    return action(oldObj);
  }
}

function createPathReader<S extends Object>(state: S) {
  return (() => {
    const mutableStateCopy = deepCopy(state);
    const pathSegments = new Array<string>();
    const initialize = (state: S): S => {
      if (typeof (state) !== 'object') { // may happen if we have a top-level primitive
        return null as any as S;
      }
      return new Proxy(state, {
        get: function (target, prop: any) {
          const val = (target as any)[prop];
          if (val !== null && typeof (val) === 'object') {
            pathSegments.push(prop);
            return initialize(val);
          } else if (typeof (val) === 'function') {
            return function (...args: any[]) {
              if (prop === 'find' && Array.isArray(target)) {
                const found = val.apply(target, args);
                if (found) {
                  const indice = (target as unknown as any[]).findIndex(e => e === found);
                  pathSegments.push(indice.toString());
                }
                return initialize(found);
              } else {
                throw new Error(
                  `'${prop}()' is not allowed. If you're trying to filter elements, rather use a library function eg. 'getStore(s => s.todos).removeWhere(e => e.status === 'done')'`);
              }
            };
          }
          pathSegments.push(prop);
          return val;
        },
      });
    }
    const proxy = initialize(mutableStateCopy);
    const readSelector = <C>(selector: (state: S) => C) => {
      pathSegments.length = 0;
      selector(proxy);
      return pathSegments;
    }
    return { readSelector, mutableStateCopy, pathSegments }
  })();
}

function deepFreeze(o: any) {
  Object.freeze(o);
  Object.getOwnPropertyNames(o).forEach(prop => {
    if (o.hasOwnProperty(prop)
      && o[prop] !== null
      && (typeof (o[prop]) === 'object' || typeof (o[prop]) === 'function')
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

/**
 * Takes an arbitrary number of state selections as input, and performs an expensive calculation only when one of those inputs change value.  
 * FOR EXAMPLE:
 * ```Typescript
 * const memo = deriveFrom(
 *   getStore(s => s.some.property),
 *   getStore(s => s.some.other.property),
 * ).usingExpensiveCalc((someProperty, someOtherProperty) => {
 *   // perform some expensive calculation and return the result
 * });
 * 
 * const memoizedResult = memo.read();
 * ```
 */
export function deriveFrom<X extends AvailableOps<any, any, any>[]>(...args: X) {
  let previousParams = new Array<any>();
  let previousResult = null as any;
  return {
    usingExpensiveCalc: <R>(calculation: (...inputs: MappedDataTuple<X>) => R) => {
      const getValue = () => {
        const params = (args as Array<AvailableOps<any, any, any>>).map(arg => arg.read());
        if (previousParams.length && params.every((v, i) => v === previousParams[i])) {
          return previousResult;
        }
        const result = calculation(...(params as AvailableOps<any, any, any>));
        previousParams = params;
        previousResult = result;
        return result;
      }
      const changeListeners = new Set<(value: R) => any>();
      return {
        read: () => getValue(),
        onChange: (listener: (value: R) => any) => {
          changeListeners.add(listener);
          const unsubscribables: Unsubscribable[] = (args as Array<AvailableOps<any, any, any>>)
            .map(ops => ops.onChange(() => listener(getValue())));
          return {
            unsubscribe: () => {
              unsubscribables.forEach(u => u.unsubscribe());
              changeListeners.delete(listener);
            }
          }
        }
      } as Derivation<R>;
    }
  }
}
