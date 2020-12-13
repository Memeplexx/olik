import { devtoolsDebounce, errorMessages } from './consts';
import { integrateStoreWithReduxDevtools } from './devtools';
import {
  DeepReadonly,
  OptionsForMakingAStore,
  OptionsForMakingAStoreEnforcingTags,
  OptionsForReduxDevtools,
  Selector,
  SelectorFromANestedStore,
  SelectorFromAStore,
  SelectorFromAStoreEnforcingTags,
  SimpleObject,
  Store,
  StoreWhichIsNested,
  StoreWhichIsNestedInternal,
  StoreWhichMayContainNestedStores,
} from './shape';
import { tests } from './tests';
import { copyObject, createPathReader, deepCopy, deepFreeze, validateState } from './utils';

let nestedContainerStore: ((selector?: ((s: DeepReadonly<any>) => any) | undefined) => StoreWhichMayContainNestedStores<any, any, boolean>) | undefined;

/**
 * Creates a new store which, for typescript users, requires that users supply an additional 'tag' when performing a state update.
 * These tags can improve the debugging experience by describing the source of an update event, for example the name of the component an update was trigger from.
 * @param state the initial state  
 * @param options some additional configuration options
 * 
 * FOR EXAMPLE:
 * ```
 * const select = makeEnforceTags({ todos: Array<{ id: number, text: string }>() });
 * 
 * // Note that when updating state, we are now required to supply a string as the last argument (in this case 'TodoDetailComponent')
 * select(s => s.todos)
 *   .patchWhere(t => t.id === 1)
 *   .with({ text: 'bake cookies' }, 'TodoDetailComponent')
 * ```
 */
export function makeEnforceTags<S>(state: S, options: OptionsForMakingAStoreEnforcingTags = {}): SelectorFromAStoreEnforcingTags<S> {
  return makeInternalRootStore<S, true>(state, { ...options, supportsTags: true });
}

/**
 * Creates a new store
 * @param state the initial state
 * @param options some additional configuration options
 * 
 * FOR EXAMPLE:
 * ```
 * const select = make({ todos: Array<{ id: number, text: string }>() });
 * ```
 */
export function make<S>(state: S, options: OptionsForMakingAStore = {}): SelectorFromAStore<S> {
  return makeInternalRootStore<S, false>(state, { ...options, supportsTags: false });
}

/**
 * Creates a new store which can be (but doesn't have to be) nested inside your application store.
 * If an existing store is already defined as `make({...}, { containerForNestedStores: true });`
 * then this store will be automatically nested within that store, under the property `nested`.
 * If the opposite is true, then a new top-level store will be registered within the devtools
 * @param state The initial state
 * @param options A configuration object which, at minimum, must contain the `name` of the nested store
 */
export function makeNested<L>(state: L, options: { name: string, storeKey?: string | ((previousKey?: string) => string) }): SelectorFromANestedStore<L> {
  const name = options.name;
  if (!nestedContainerStore) {
    return (<C = L>(selector?: (arg: DeepReadonly<L>) => C) => (selector
      ? makeInternal(state, { devtools: { name }, supportsTags: false })(selector)
      : null)) as SelectorFromANestedStore<L>;
  }
  const generateKey = (arg?: string) => (!arg && !options.storeKey) ? '0' :
    !options.storeKey ? (+arg! + 1).toString() : typeof (options.storeKey) === 'function' ? options.storeKey(arg) : options.storeKey;
  const wrapperState = nestedContainerStore().read();
  let key: string;
  if (!nestedContainerStore().read().nested) {
    key = generateKey();
    nestedContainerStore().patchWith({ nested: { [name]: { [key]: state } } });
    nestedContainerStore().renew({ ...wrapperState, nested: { [name]: { [key]: state } } });
  } else if (!nestedContainerStore().read().nested[name]) {
    key = generateKey();
    nestedContainerStore(s => s.nested).patchWith({ [name]: { [key]: state } });
    nestedContainerStore().renew({ ...wrapperState, nested: { ...wrapperState.nested, [name]: { [key]: state } } });
  } else {
    const values = nestedContainerStore(s => s.nested[name]).read();
    const keys = Object.keys(values);
    key = generateKey(keys[keys.length - 1]);
    nestedContainerStore(s => s.nested[name]).patchWith({ [key]: state });
    nestedContainerStore().renew({ ...wrapperState, nested: { ...wrapperState.nested, [name]: { ...wrapperState.nested[name], [key]: state } } });
  }
  return (<C = L>(selector?: (arg: DeepReadonly<L>) => C) => {
    const lStore = nestedContainerStore!(s => {
      const libState = s.nested[name][key];
      return selector ? selector(libState) : libState;
    }) as any as StoreWhichIsNestedInternal<L, C>;
    lStore.removeFromContainingStore = lStore.defineRemoveNestedStore(name, key);
    lStore.reset = lStore.defineReset(state);
    return lStore as StoreWhichIsNested<C>;
  }) as SelectorFromANestedStore<L>;
}

function makeInternalRootStore<S, B extends boolean>(state: S, options: { containerForNestedStores?: boolean, supportsTags: boolean, devtools?: OptionsForReduxDevtools | false, tagSanitizer?: (tag: string) => string }) {
  const store = makeInternal<S, B>(state, { devtools: options.devtools === undefined ? {} : options.devtools, supportsTags: options.supportsTags, tagSanitizer: options.tagSanitizer });
  if (options.containerForNestedStores) {
    if ((typeof (state) !== 'object') || Array.isArray(state)) {
      throw new Error(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
    }
    nestedContainerStore = store as any;
  }
  return store;
}

function makeInternal<S, B extends boolean>(state: S, options: { supportsTags: boolean, devtools: OptionsForReduxDevtools | false, tagSanitizer?: (tag: string) => string }) {
  validateState(state);
  const changeListeners = new Map<(ar: any) => any, (arg: S) => any>();
  let pathReader = createPathReader(state);
  let currentState = deepFreeze(state) as S;
  let initialState = currentState;
  let devtoolsDispatchListener: ((action: { type: string, payload?: any }) => any) | undefined;
  const setDevtoolsDispatchListener = (listener: (action: { type: string, payload?: any }) => any) => devtoolsDispatchListener = listener;
  const replace = <C>(selector: Selector<S, C>, name: string) => (assignment: C, tag?: string) => {
    const payloadFrozen = deepFreeze(assignment);
    const payloadCopied = deepCopy(assignment);
    const isRootUpdate = !pathReader.readSelector(selector).length;
    if (isRootUpdate) {
      updateState<C, C>(selector, Array.isArray(currentState) ? `replaceAll()` : `replaceWith()`, payloadFrozen,
        old => deepCopy(payloadFrozen),
        old => {
          if (Array.isArray(old)) {
            old.length = 0; Object.assign(old, payloadCopied);
          } else if (typeof (old) === 'boolean' || typeof (old) === 'number') {
            pathReader.mutableStateCopy = payloadCopied as any as S;
          } else {
            Object.assign(old, payloadCopied);
          }
        }, { overrideActionName: true, tag });
      return;
    }
    const pathSegments = pathReader.pathSegments;
    const lastSeg = pathSegments[pathSegments.length - 1] || '';
    const segsCopy = pathSegments.slice(0, pathSegments.length - 1);
    const selectorRevised = (((state: S) => {
      let res = state as SimpleObject;
      segsCopy.forEach(seg => res = res[seg]);
      return res;
    })) as Selector<S, C>;
    updateState<C, C>(selectorRevised, `${pathSegments.join('.')}.${name}()`, payloadFrozen,
      old => Array.isArray(old) ? old.map((o, i) => i === +lastSeg ? deepCopy(payloadFrozen) : o) : ({ ...old, [lastSeg]: deepCopy(payloadFrozen) }),
      (old: SimpleObject) => old[lastSeg] = payloadCopied, { overrideActionName: true, tag });
  };
  const action = <C, X extends C & Array<any>>(selector: Selector<S, C, X>) => ({
    replaceWith: replace(selector, 'replaceWith'),
    replaceAll: replace(selector, 'replaceAll'),
    patchWith: (assignment: Partial<C>, tag?: string) => {
      const payloadFrozen = deepFreeze(assignment);
      const payloadCopied = deepCopy(assignment);
      updateState<C, X>(selector, 'patchWith', assignment,
        old => ({ ...old, ...payloadFrozen }),
        old => Object.assign(old, payloadCopied), { tag });
    },
    patchWhere: (where: (e: X) => boolean) => ({
      with: (assignment: Partial<X[0]>, tag?: string) => {
        const payloadFrozen = deepFreeze(assignment);
        const payloadCopied = deepCopy(assignment);
        const itemIndices = (selector(currentState) as X).map((e, i) => where(e) ? i : null).filter(i => i !== null) as number[];
        const pathSegments = pathReader.readSelector(selector);
        return updateState<C, X>(selector, `${pathSegments.join('.')}${pathSegments.length ? '.' : ''}${itemIndices.join(',')}.patchWhere()`,
          { patch: payloadFrozen, whereClause: where.toString() },
          old => old.map((o, i) => itemIndices.includes(i) ? { ...o, ...payloadFrozen } : o),
          old => itemIndices.forEach(i => Object.assign(old[i], payloadCopied)), { overrideActionName: true, tag });
      }
    }),
    addAfter: (assignment: X[0][], tag?: string) => {
      const payloadFrozen = deepFreeze(assignment);
      const payloadCopied = deepCopy(assignment);
      updateState<C, X>(selector, 'addAfter', payloadFrozen,
        old => [...old, ...(deepCopy(Array.isArray(payloadFrozen) ? payloadFrozen : [payloadFrozen]))],
        old => old.push(...(Array.isArray(payloadCopied) ? payloadCopied : [payloadCopied])), { tag });
    },
    addBefore: (assignment: X[0][], tag?: string) => {
      const payloadFrozen = deepFreeze(assignment);
      const payloadCopied = deepCopy(assignment);
      updateState<C, X>(selector, 'addBefore', payloadFrozen,
        old => [...(deepCopy(Array.isArray(payloadFrozen) ? payloadFrozen : [payloadFrozen])), ...old],
        old => old.unshift(...(Array.isArray(payloadCopied) ? payloadCopied : [payloadCopied])), { tag })
    },
    removeFirst: (tag?: string) => {
      updateState<C, X>(selector, 'removeFirst', (selector(currentState) as X).slice(1),
        old => old.slice(1, old.length),
        old => old.shift(), { tag });
    },
    removeLast: (tag?: string) => {
      const selection = selector(currentState) as X;
      updateState<C, X>(selector, 'removeLast', selection.slice(0, selection.length - 1),
        old => old.slice(0, old.length - 1),
        old => old.pop(), { tag });
    },
    removeAll: (tag?: string) => updateState<C, X>(selector, 'removeAll', null,
      () => [],
      old => old.length = 0, { tag }),
    removeWhere: (predicate: (arg: X[0]) => boolean, tag?: string) => {
      const itemIndices = (selector(currentState) as X).map((e, i) => predicate(e) ? i : null).filter(i => i !== null);
      const pathSegments = pathReader.readSelector(selector);
      return updateState<C, X>(selector, `${pathSegments.join('.')}${pathSegments.length ? '.' : ''}${itemIndices.join(',')}.removeWhere()`,
        { toRemove: (selector(currentState) as X).filter(predicate), whereClause: predicate.toString() },
        old => old.filter(o => !predicate(o)),
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
        const payloadFrozen = deepFreeze(element);
        const payloadCopied = deepCopy(element);
        const itemIndices = (selector(currentState) as X).map((e, i) => criteria(e) ? i : null).filter(i => i !== null);
        if (itemIndices.length > 1) { throw new Error(errorMessages.UPSERT_MORE_THAN_ONE_MATCH); }
        const found = itemIndices.length;
        const indice = itemIndices[0];
        updateState<C, X>(selector, indice !== undefined ? `${indice}.upsertWhere` : 'upsertWhere', payloadFrozen,
          o => found ? o.map((o, i) => i === indice ? payloadFrozen : o) : [...o, payloadFrozen],
          o => found ? o[indice as number] = payloadCopied : o.push(payloadCopied), { tag })
      }
    }),
    mergeWhere: (criteria: (existingElement: X[0], newElement: X[0]) => boolean) => ({
      with: (elements: X, tag?: string) => {
        const payloadFrozen = deepFreeze(elements);
        const payloadCopied = deepCopy(elements);
        updateState<C, X>(selector, 'mergeWhere', payloadFrozen, old => [
          ...old.map(oe => payloadFrozen.find(ne => criteria(oe, ne)) || oe),
          ...payloadFrozen.filter(ne => !old.some(oe => criteria(oe, ne)))
        ], old => {
          old.forEach((oe, oi) => { const found = payloadCopied.find(ne => criteria(oe, ne)); if (found) { old[oi] = deepCopy(found); } });
          payloadCopied.filter(ne => !old.some(oe => criteria(oe, ne))).forEach(ne => old.push(ne));
        }, { tag })
      }
    }),
    replaceWhere: (criteria: (e: X[0]) => boolean) => ({
      with: (assignment: X[0], tag?: string) => {
        const payloadFrozen = deepFreeze(assignment);
        const payloadCopied = deepCopy(assignment);
        const itemIndices = (selector(currentState) as X).map((e, i) => criteria(e) ? i : null).filter(i => i !== null);
        const pathSegments = pathReader.readSelector(selector);
        return updateState<C, X>(selector, `${pathSegments.join('.')}${pathSegments.length ? '.' : ''}${itemIndices.join(',')}.replaceWhere()`,
          { replacement: payloadFrozen, whereClause: criteria.toString() },
          old => old.map((o, i) => itemIndices.includes(i) ? deepCopy(payloadFrozen) : o),
          old => {
            old.forEach((el, idx) => {
              if (itemIndices.includes(idx)) {
                old[idx] = payloadCopied;
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
    },
    defineRemoveNestedStore: (name: string, key: string) => () => {
      if (!nestedContainerStore) { return; }
      if (Object.keys((currentState as S & { nested: any }).nested[name]).length === 1) {
        return updateState<C>(((s: S & { nested: any }) => s.nested) as Selector<S, C>, 'remove', { name, key }, old => {
          const { [name]: toRemove, ...others } = old as SimpleObject;
          return others;
        }, (s: SimpleObject) => {
          delete s[name];
        })
      } else {
        return updateState<C>(((s: S & { nested: any }) => s.nested[name]) as Selector<S, C>, 'remove', key, old => {
          const { [key]: toRemove, ...others } = old as SimpleObject;
          return others;
        }, (s: SimpleObject) => {
          delete s[key];
        })
      }
    },
    defineReset: (initState: C) => () => replace((e => selector(e)) as Selector<S, C>, 'reset')(initState),
  } as any as Store<C, B>);

  const storeResult = <X extends C & Array<any>, C = S>(selector: ((s: DeepReadonly<S>) => C) = (s => s as any as C)) => {
    const selectorMod = selector as Selector<S, C, X>;
    selectorMod(currentState);
    return action<C, X>(selectorMod);
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

  function updateState<C, X extends C = C>(
    selector: Selector<S, C, X>,
    actionName: string,
    payload: any,
    action: (newNode: X) => any,
    mutator: (newNode: X) => any,
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
    mutator(selector(pathReader.mutableStateCopy) as X);
    currentState = result;
    notifySubscribers(previousState, result);
    const actionToDispatch = {
      type: (updateOptions && updateOptions.overrideActionName ? actionName : ((pathSegments.join('.') + (pathSegments.length ? '.' : '') + actionName + '()')))
        + (updateOptions.tag ? ` [${options.tagSanitizer ? options.tagSanitizer(updateOptions.tag) : updateOptions.tag}]` : ''),
      payload,
    };
    tests.currentAction = actionToDispatch;
    tests.currentMutableState = pathReader.mutableStateCopy as any;
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
