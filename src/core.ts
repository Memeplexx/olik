import { devtoolsDebounce } from './consts';
import { integrateStoreWithReduxDevtools } from './devtools';
import { ArrayStore, CommonStore, DeepReadonly, DeepReadonlyObject, EnhancerOptions, LibStore, ObjectStore, Store } from './shape';
import { tests } from './tests';
import { copyObject, createPathReader, deepCopy, deepFreeze, validateState } from './utils';

let nestedContainerStore: ((selector?: ((s: DeepReadonly<any>) => any) | undefined) => Store<any, any, boolean>) | undefined;

/**
 * Creates a new store which, for typescript users, requires that users supply an additional 'tag' when performing a state update.
 * These tags can improve the debugging experience by describing the source of an update event, for example the name of the component an update was trigger from.
 * @param state the initial state  
 * 
 * FOR EXAMPLE:
 * ```
 * const store = makeEnforceTags({ todos: Array<{ id: number, text: string }>() });
 * 
 * // Note that when updating state, we are now required to supply a string as the last argument (in this case 'TodoDetailComponent')
 * store(s => s.todos)
 *   .patchWhere(t => t.id === 1)
 *   .with({ text: 'bake cookies' }, 'TodoDetailComponent')
 * ```
 */
export function makeEnforceTags<S>(state: S, options: { devtools?: EnhancerOptions | false, tagSanitizer?: (tag: string) => string, containerForNestedStores?: boolean } = {}) {
  const store = makeInternal(state, { devtools: options.devtools || {}, supportsTags: true });
  if (options.containerForNestedStores) {
    nestedContainerStore = store;
  }
  return store;
}

/**
 * Creates a new store
 * @param state the initial state
 * 
 * FOR EXAMPLE:
 * ```
 * const store = make({ todos: Array<{ id: number, text: string }>() });
 * ```
 */
export function make<S>(state: S, options: { devtools?: EnhancerOptions | false, containerForNestedStores?: boolean } = {}) {
  const store = makeInternal(state, { devtools: options.devtools || {}, supportsTags: false });
  if (options.containerForNestedStores) {
    nestedContainerStore = store;
  }
  return store;
}

/**
 * Creates a new store which is capable of being nested inside another store.
 * If an existing store is already defined as `make({...}, { containerForNestedStores: true });`
 * then this store will be automatically nested within that store, under the property `nested`.
 * If the opposite is true, then a new top-level store will be registered within the devtools
 * @param state The initial state
 * @param options A configuration object which, at minimum, must contain the `name` of the nested store
 */
export function makeNested<L>(state: L, options: { name: string }) {
  const name = options.name;
  if (!nestedContainerStore) {
    return <C = L>(selector?: (arg: DeepReadonly<L>) => C) => (selector
      ? makeInternal(state, { devtools: { name }, supportsTags: false })(selector)
      : null) as any as LibStore<L, C, any>;
  }
  const wrapperState = (nestedContainerStore() as any).read();
  if (!nestedContainerStore().read().nested) {
    (nestedContainerStore() as any as ObjectStore<any, any, any>).patchWith({ nested: { [name]: { '0': state } } });
    (nestedContainerStore() as any).renew({ ...wrapperState, nested: { [name]: { '0': state } } });
  } else if (!nestedContainerStore().read().nested[name]) {
    (nestedContainerStore(s => s.nested) as any as ObjectStore<any, any, any>).patchWith({ [name]: { '0': state } });
    (nestedContainerStore() as any).renew({ ...wrapperState, nested: { ...wrapperState.nested, [name]: { '0': state } } });
  } else {
    const values = (nestedContainerStore(s => s.nested[name]) as any as CommonStore<any, any, any>).read();
    const keys = Object.keys(values);
    const key = +keys[keys.length - 1] + 1;
    (nestedContainerStore(s => s.nested[name]) as any as ObjectStore<any, any, any>).patchWith({ [key]: state });
    (nestedContainerStore() as any).renew({ ...wrapperState, nested: { ...wrapperState.nested, [name]: { ...wrapperState.nested[name], [key]: state } } });
  }
  const index = Object.keys(nestedContainerStore(s => s.nested[name]).read()).length - 1;
  return <C = L>(selector?: (arg: DeepReadonlyObject<L>) => C) => {
    const lStore = nestedContainerStore!(s => {
      const libState = s.nested[name][index.toString()];
      return selector ? selector(libState) : libState;
    });
    (lStore as any)['removeFromContainingStore'] = (lStore as any)['defineRemoveFromContainingStore'](name, index);
    return lStore as any as LibStore<L, C, any>;
  };
}

function makeInternal<S>(state: S, options: { supportsTags: boolean, devtools: EnhancerOptions | false, tagSanitizer?: (tag: string) => string }) {
  validateState(state);
  const changeListeners = new Map<(ar: any) => any, (arg: S) => any>();
  let pathReader = createPathReader(state);
  let currentState = deepFreeze(state) as S;
  let initialState = currentState;
  let devtoolsDispatchListener: ((action: { type: string, payload?: any }) => any) | undefined;
  const setDevtoolsDispatchListener = (listener: (action: { type: string, payload?: any }) => any) => devtoolsDispatchListener = listener;
  const replace = <C>(selector: (s: S) => C, name: string) => (assignment: C, tag?: string) => {
    const isRootUpdate = !pathReader.readSelector(selector).length;
    if (isRootUpdate) {
      updateState<C>(selector, Array.isArray(currentState) ? `replaceAll()` : `replaceWith()`, assignment,
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
  const action = <C, X extends C & ReadonlyArray<any>>(selector: (s: S) => C) => ({
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
      old => [...old, ...(deepCopy(Array.isArray(assignment) ? assignment : [assignment]))],
      old => old.push(...(Array.isArray(assignment) ? assignment : [assignment])), { tag }),
    addBefore: (assignment: X[0][], tag?: string) => updateState<C>(selector, 'addBefore', assignment,
      old => [...(deepCopy(Array.isArray(assignment) ? assignment : [assignment])), ...old],
      old => old.unshift(...(Array.isArray(assignment) ? assignment : [assignment])), { tag }),
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
          ? (action(selector) as any).replaceWhere(criteria).with(element, tag)
          : (action(selector) as any).addAfter([element], tag);
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
    onChange: (performAction: (selection: C) => any) => {
      changeListeners.set(performAction, selector);
      return { unsubscribe: () => changeListeners.delete(performAction) };
    },
    read: () => deepFreeze(selector(currentState)),
    readInitial: () => selector(initialState),
    supportsTags: options.supportsTags,
    renew: (state: S) => {
      pathReader = createPathReader(state);
      currentState = deepFreeze(state) as S;
      initialState = currentState;
    },
    defineRemoveFromContainingStore: (name: string, key: string) => () => {
      if (nestedContainerStore) {
        state = deepCopy(currentState);
        if (Object.keys((state as any).nested[name]).length === 1) {
          delete (state as any).nested[name];
        } else {
          delete (state as any).nested[name][key];
        }
        pathReader = createPathReader(state);
        currentState = deepFreeze(state) as S;
        initialState = currentState;
      }
    }
  } as any as Store<S, C, any>);

  const storeResult = <C = S>(selector: ((s: DeepReadonly<S>) => C) = (s => s as any as C)) => {
    const selectorMod = selector as (s: S) => C;
    selectorMod(currentState);
    return action(selectorMod);
  };

  const previousAction: {
    timestamp: number,
    type: string,
    payloads: any[],
    debounceTimeout: number,
  } = {
    type: '',
    timestamp: 0,
    payloads: [],
    debounceTimeout: 0,
  };

  function updateState<C>(
    selector: (s: S) => C,
    actionName: string,
    payload: any,
    action: (newNode: any) => any,
    mutator: (newNode: any) => any,
    updateOptions: {
      overrideActionName?: boolean,
      tag?: string,
    } = {
        overrideActionName: false,
      },
  ) {
    const pathSegments = pathReader.readSelector(selector);
    const previousState = currentState;
    const result = Object.freeze(copyObject(currentState, { ...currentState }, pathSegments.slice(), action));
    mutator(selector(pathReader.mutableStateCopy));
    currentState = result;
    notifySubscribers(previousState, result);
    const actionToDispatch = {
      type: (updateOptions && updateOptions.overrideActionName ? actionName : ((pathSegments.join('.') + (pathSegments.length ? '.' : '') + actionName + '()')))
        + (updateOptions.tag ? ` [${options.tagSanitizer ? options.tagSanitizer(updateOptions.tag) : updateOptions.tag}]` : ''),
      payload,
    };
    tests.currentAction = actionToDispatch;
    tests.currentMutableState = pathReader.mutableStateCopy;
    if (devtoolsDispatchListener && (!updateOptions.tag || (updateOptions.tag !== 'dontTrackWithDevtools'))) {
      const dispatchToDevtools = (payload?: any[]) => {
        const action = payload ? { ...actionToDispatch, payload } : actionToDispatch;
        tests.currentActionForDevtools = action;
        devtoolsDispatchListener!(action);
      }
      if (previousAction.debounceTimeout) {
        window.clearTimeout(previousAction.debounceTimeout);
        previousAction.debounceTimeout = 0;
      }
      if (previousAction.type !== actionToDispatch.type) {
        previousAction.type = actionToDispatch.type;
        previousAction.payloads = [actionToDispatch.payload];
        dispatchToDevtools();
        previousAction.debounceTimeout = window.setTimeout(function () {
          previousAction.type = '';
          previousAction.payloads = [];
        }, devtoolsDebounce);
      } else {
        if (previousAction.timestamp < (Date.now() - devtoolsDebounce)) {
          previousAction.payloads = [actionToDispatch.payload];
        } else {
          previousAction.payloads.push(actionToDispatch.payload);
        }
        previousAction.timestamp = Date.now();
        previousAction.debounceTimeout = window.setTimeout(function () {
          dispatchToDevtools(previousAction.payloads);
          previousAction.type = '';
          previousAction.payloads = [];
        }, devtoolsDebounce);
      }
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

  if (options.devtools !== false) {
    integrateStoreWithReduxDevtools<S>(storeResult as any, options.devtools, setDevtoolsDispatchListener);
  }

  return storeResult;
}
