import { devtoolsDebounce, errorMessages } from './consts';
import { integrateStoreWithReduxDevtools } from './devtools';
import {
  OptionsForMakingAStore,
  OptionsForMakingAStoreEnforcingTags,
  OptionsForReduxDevtools,
  Selector,
  SelectorFromANestedStore,
  SelectorFromAStore,
  SelectorFromAStoreEnforcingTags,
  Store,
  StoreForAnArrayOfObjects,
  StoreForAnArray,
  StoreWhichIsNested,
  StoreWhichIsNestedInternal,
  StoreWhichIsResettable,
  StoreWhichMayContainNestedStores,
  StoreForAnObject,
  StoreForAnObjectOrPrimitive,
  Trackability,
  Tag,
  StoreOrDerivation,
  DeepReadonly,
  FunctionReturning,
} from './shape';
import { tests } from './tests';
import { copyObject, copyPayload, createPathReader, deepCopy, deepFreeze, validateState } from './utils';

let nestedContainerStore: ((selector?: ((s: any) => any) | undefined) => StoreWhichMayContainNestedStores<any, any, any>) | undefined;

/**
 * Creates a new store which, for typescript users, requires that users supply an additional 'tag' when performing a state update.
 * These tags can improve the debugging experience by describing the source of an update event, for example the name of the component an update was trigger from.
 * @param state the initial state  
 * @param options some additional configuration options
 * 
 * @example
 * ```
 * const get = makeEnforceTags({ todos: Array<{ id: number, text: string }>() });
 * 
 * // Note that when updating state, we are now required to supply a string as the last argument (in this case 'TodoDetailComponent')
 * get(s => s.todos)
 *   .patchWhere(t => t.id === 1)
 *   .with({ text: 'bake cookies' }, 'TodoDetailComponent')
 * ```
 */
export function makeEnforceTags<S>(state: S, options: OptionsForMakingAStoreEnforcingTags = {}): SelectorFromAStoreEnforcingTags<S> {
  return makeInternalRootStore<S, 'tagged'>(state, { ...options, supportsTags: true });
}

/**
 * Creates a new store
 * @param state the initial state
 * @param options some additional configuration options
 * 
 * @example
 * ```
 * const select = make({ todos: Array<{ id: number, text: string }>() });
 * ```
 */
export function make<S>(state: S, options: OptionsForMakingAStore = {}): SelectorFromAStore<S> {
  return makeInternalRootStore<S, 'untagged'>(state, { ...options, supportsTags: false });
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
    nestedContainerStore().patch({ nested: { [name]: { [key]: state } } });
    nestedContainerStore().renew({ ...wrapperState, nested: { [name]: { [key]: state } } });
  } else if (!nestedContainerStore().read().nested[name]) {
    key = generateKey();
    nestedContainerStore(s => s.nested).patch({ [name]: { [key]: state } });
    nestedContainerStore().renew({ ...wrapperState, nested: { ...wrapperState.nested, [name]: { [key]: state } } });
  } else {
    const values = nestedContainerStore(s => s.nested[name]).read();
    const keys = Object.keys(values);
    key = generateKey(keys[keys.length - 1]);
    nestedContainerStore(s => s.nested[name]).patch({ [key]: state });
    nestedContainerStore().renew({ ...wrapperState, nested: { ...wrapperState.nested, [name]: { ...wrapperState.nested[name], [key]: state } } });
  }
  return (<C = L>(selector?: (arg: L) => C) => {
    const lStore = nestedContainerStore!(s => {
      const libState = s.nested[name][key];
      return selector ? selector(libState) : libState;
    }) as any as StoreWhichIsNestedInternal<L, C>;
    lStore.removeFromContainingStore = lStore.defineRemoveNestedStore(name, key);
    lStore.reset = lStore.defineReset(state);
    return lStore as StoreWhichIsNested<C>;
  }) as unknown as SelectorFromANestedStore<L>;
}

function makeInternalRootStore<S, T extends Trackability>(state: S, options: { containerForNestedStores?: boolean, supportsTags: boolean, devtools?: OptionsForReduxDevtools | false, tagSanitizer?: (tag: string) => string }) {
  const store = makeInternal<S, T>(state, { devtools: options.devtools === undefined ? {} : options.devtools, supportsTags: options.supportsTags, tagSanitizer: options.tagSanitizer });
  if (options.containerForNestedStores) {
    if ((typeof (state) !== 'object') || Array.isArray(state)) {
      throw new Error(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
    }
    nestedContainerStore = store as any;
  }
  return store;
}

function makeInternal<S, T extends Trackability>(state: S, options: { supportsTags: boolean, devtools: OptionsForReduxDevtools | false, tagSanitizer?: (tag: string) => string }) {
  validateState(state);
  const changeListeners = new Map<(ar: any) => any, (arg: S) => any>();
  let pathReader = createPathReader(state);
  let currentState = deepFreeze(state) as S;
  let initialState = currentState;
  let devtoolsDispatchListener: ((action: { type: string, payload?: any }) => any) | undefined;
  const setDevtoolsDispatchListener = (listener: (action: { type: string, payload?: any }) => any) => devtoolsDispatchListener = listener;
  const replace = <C, T extends Trackability>(selector: Selector<S, C>, name: string) => (payload: C | FunctionReturning<C>, tag: Tag<T>) => {
    const pathSegments = pathReader.readSelector(selector);
    const { payloadFrozen, payloadCopied, payloadFunction } = copyPayload(payload);
    let payloadReturnedByFn: C;
    let getPayloadFn = (() => payloadReturnedByFn) as unknown as () => C;
    if (!pathSegments.length) {
      updateState({
        selector,
        replacer: old => {
          if (payloadFunction) {
            payloadReturnedByFn = payloadFunction(old);
            return payloadReturnedByFn;
          } else {
            return payloadFrozen;
          }
        },
        mutator: old => {
          const newValue = payloadFunction ? payloadFunction(old as any) : payloadCopied;
          if (Array.isArray(old)) {
            (old as Array<any>).length = 0;
            Object.assign(old, newValue);
          } else if (typeof (old) === 'boolean' || typeof (old) === 'number' || typeof (old) === 'string') {
            pathReader.mutableStateCopy = newValue as any;
          } else {
            Object.assign(old, newValue);
          }
        },
        actionName: name,
        pathSegments: [],
        payload: payloadFrozen,
        getPayloadFn,
        tag,
      });
    } else {
      const lastSeg = pathSegments[pathSegments.length - 1] || '';
      const segsCopy = pathSegments.slice(0, pathSegments.length - 1);
      const selectorRevised = (((state: S) => {
        let res = state as Record<any, any>;
        segsCopy.forEach(seg => res = res[seg]);
        return res;
      })) as Selector<S, C>;
      const actionName = `${pathSegments.join('.')}${pathSegments.length ? '.' : ''}${name}()`;
      updateState({
        selector: selectorRevised,
        replacer: old => {
          if (Array.isArray(old)) { return (old as Array<any>).map((o, i) => i === +lastSeg ? payloadCopied : o); }
          if (payloadFunction) { payloadReturnedByFn = payloadFunction((old as any)[lastSeg]); }
          return ({ ...old, [lastSeg]: payloadFunction ? payloadFunction((old as any)[lastSeg]) : payloadCopied })
        },
        mutator: (old: Record<any, any>) => old[lastSeg] = payloadReturnedByFn || payloadCopied,
        actionName,
        actionNameOverride: true,
        pathSegments: segsCopy,
        payload: payloadFrozen,
        getPayloadFn,
        tag,
      })
    }
    return payloadCopied;
  };

  const action = <C, X extends C & Array<any>>(selector: Selector<S, C, X>) => {
    return {
      replace: replace(selector, 'replace'
      ) as StoreForAnObjectOrPrimitive<C, Trackability>['replace'],
      replaceAll: replace(
        selector, 'replaceAll'
      ) as StoreForAnArray<any, Trackability>['replaceAll'],
      patch: ((payload, tag) => {
        const { payloadFrozen, payloadCopied } = copyPayload(payload);
        updateState({
          selector,
          replacer: old => ({ ...old, ...payloadFrozen }),
          mutator: old => Object.assign(old, payloadCopied),
          actionName: 'patch',
          payload: payloadFrozen,
          tag,
        });
        return payloadCopied;
      }) as StoreForAnObject<C, T>['patch'],
      patchWhere: (where => ({
        with: (payload, tag) => {
          const indicesOfElementsToPatch = (selector(currentState) as X).map((e, i) => where(e) ? i : null).filter(i => i !== null) as number[];
          const { payloadFrozen, payloadCopied } = copyPayload(payload);
          updateState({
            selector,
            replacer: old => old.map((o, i) => indicesOfElementsToPatch.includes(i) ? { ...o, ...payloadFrozen } : o),
            mutator: old => indicesOfElementsToPatch.forEach(i => Object.assign(old[i], payloadCopied)),
            actionName: `${indicesOfElementsToPatch.join(',')}.patchWhere`,
            payload: { patch: payloadFrozen, whereClause: where.toString() },
            tag,
          });
          return payloadCopied;
        }
      })) as StoreForAnArrayOfObjects<X, T>['patchWhere'],
      addAfter: ((payload, tag) => {
        const { payloadFrozen, payloadCopied } = copyPayload(payload);
        updateState({
          selector,
          replacer: old => [...old, ...(deepCopy(Array.isArray(payloadFrozen) ? payloadFrozen : [payloadFrozen]))],
          mutator: old => old.push(...(Array.isArray(payloadCopied) ? payloadCopied : [payloadCopied])),
          actionName: 'addAfter',
          payload: payloadFrozen,
          tag,
        });
        return payloadCopied;
      }) as StoreForAnArray<X, T>['addAfter'],
      addBefore: ((payload, tag) => {
        const { payloadFrozen, payloadCopied } = copyPayload(payload);
        updateState({
          selector,
          replacer: old => [...(Array.isArray(payloadFrozen) ? payloadFrozen : [payloadFrozen]), ...old],
          mutator: old => old.unshift(...(Array.isArray(payloadCopied) ? payloadCopied : [payloadCopied])),
          actionName: 'addBefore',
          payload: payloadFrozen,
          tag,
        });
        return payloadCopied;
      }) as StoreForAnArray<X, T>['addBefore'],
      removeFirst: (tag => {
        const selection = selector(currentState) as X;
        if (!selection.length) { throw new Error(errorMessages.NO_ARRAY_ELEMENTS_TO_REMOVE); }
        updateState<C, T, X>({
          selector,
          replacer: old => old.slice(1, old.length),
          mutator: old => old.shift(),
          actionName: 'removeFirst',
          pathSegments: pathReader.readSelector(selector),
          payload: (selector(currentState) as X).slice(1),
          tag,
        });
      }) as StoreForAnArray<X, T>['removeFirst'],
      removeLast: (tag => {
        const selection = selector(currentState) as X;
        if (!selection.length) { throw new Error(errorMessages.NO_ARRAY_ELEMENTS_TO_REMOVE); }
        updateState<C, T, X>({
          selector,
          replacer: old => old.slice(0, old.length - 1),
          mutator: old => old.pop(),
          actionName: 'removeLast',
          payload: selection.slice(0, selection.length - 1),
          tag
        });
      }) as StoreForAnArray<X, T>['removeLast'],
      removeAll: (tag => {
        updateState<C, T, X>({
          selector,
          replacer: () => [],
          mutator: old => old.length = 0,
          actionName: 'removeAll',
          payload: null,
          tag,
        });
      }) as StoreForAnArray<X, T>['removeAll'],
      removeWhere: ((predicate, tag) => {
        const indicesOfElementsToRemove = (selector(currentState) as X).map((e, i) => predicate(e) ? i : null).filter(i => i !== null);
        updateState<C, T, X>({
          selector,
          replacer: old => old.filter(o => !predicate(o)),
          mutator: old => {
            const toRemove = old.filter(predicate);
            for (var i = 0; i < old.length; i++) {
              if (toRemove.includes(old[i])) {
                old.splice(i, 1);
                i--;
              }
            }
          },
          actionName: `${indicesOfElementsToRemove.join(',')}.removeWhere`,
          payload: { toRemove: (selector(currentState) as X).filter(predicate), whereClause: predicate.toString() },
          tag,
        });
      }) as StoreForAnArray<X, T>['removeWhere'],
      upsertWhere: (criteria => ({
        with: (payload, tag) => {
          const indicesOfElementsToReplace = (selector(currentState) as X).map((e, i) => criteria(e) ? i : null).filter(i => i !== null);
          if (indicesOfElementsToReplace.length > 1) { throw new Error(errorMessages.UPSERT_MORE_THAN_ONE_MATCH); }
          const indice = indicesOfElementsToReplace[0];
          const { payloadFrozen, payloadCopied } = copyPayload(payload);
          updateState({
            selector,
            replacer: old => indicesOfElementsToReplace.length ? old.map((o, i) => i === indice ? payloadFrozen : o) : [...old, payloadFrozen],
            mutator: old => indicesOfElementsToReplace.length ? old[indice as number] = payloadCopied : old.push(payloadCopied),
            actionName: `${indice !== undefined ? indice + '.' : ''}upsertWhere`,
            payload: payloadFrozen,
            tag,
          });
          return payloadCopied;
        }
      })) as StoreForAnArray<X, T>['upsertWhere'],
      mergeMatching: (criteria => ({
        with: (payload, tag) => {
          const { payloadFrozen, payloadCopied } = copyPayload(payload);
          updateState({
            selector,
            replacer: old => [
              ...old.map(oe => payloadFrozen.find(ne => criteria(oe) === criteria(ne)) || oe),
              ...payloadFrozen.filter(ne => !old.some(oe => criteria(oe) === criteria(ne)))
            ],
            mutator: old => {
              old.forEach((oe, oi) => { const found = payloadCopied.find(ne => criteria(oe) === criteria(ne)); if (found) { old[oi] = deepCopy(found); } });
              payloadCopied.filter(ne => !old.some(oe => criteria(oe) === criteria(ne))).forEach(ne => old.push(ne));
            },
            actionName: 'mergeMatching',
            payload: payloadFrozen,
            tag,
          });
          return payloadCopied;
        }
      })) as StoreForAnArray<X, T>['mergeMatching'],
      replaceWhere: (criteria => ({
        with: (payload, tag) => {
          const indicesOfElementsToReplace = (selector(currentState) as X).map((e, i) => criteria(e) ? i : null).filter(i => i !== null);
          const { payloadFrozen, payloadCopied } = copyPayload(payload);
          updateState<C, T, X>({
            selector,
            replacer: old => old.map((o, i) => indicesOfElementsToReplace.includes(i) ? deepCopy(payloadFrozen) : o),
            mutator: old => {
              old.forEach((el, idx) => {
                if (indicesOfElementsToReplace.includes(idx)) {
                  old[idx] = payloadCopied;
                }
              })
            },
            actionName: `${indicesOfElementsToReplace.join(',')}.replaceWhere`,
            payload: { replacement: payloadFrozen, whereClause: criteria.toString() },
            tag,
          });
          return payloadCopied;
        }
      })) as StoreForAnArray<X, T>['replaceWhere'],
      reset: (
        tag => replace(selector, 'reset')(selector(initialState), tag)
      ) as StoreWhichIsResettable<C, T>['reset'],
      onChange: (performAction => {
        changeListeners.set(performAction, selector);
        return { unsubscribe: () => changeListeners.delete(performAction) };
      }) as StoreOrDerivation<C>['onChange'],
      read: (
        () => deepFreeze(selector(currentState))
      ) as StoreOrDerivation<C>['read'],
      readInitial: (
        () => selector(initialState)
      ),
      renew: (state => {
        pathReader = createPathReader(state);
        currentState = deepFreeze(state) as S;
      }) as StoreWhichMayContainNestedStores<S, C, T>['renew'],
      defineRemoveNestedStore: ((name, key) => () => {
        if (!nestedContainerStore) { return; }
        if (Object.keys((currentState as S & { nested: any }).nested[name]).length === 1) {
          updateState({
            selector: ((s: S & { nested: any }) => s.nested) as Selector<S, C>,
            replacer: old => {
              const { [name]: toRemove, ...others } = old as Record<any, any>;
              return others;
            },
            mutator: (s: Record<any, any>) => delete s[name],
            pathSegments: ['nested'],
            actionName: 'removeNested',
            payload: { name, key },
            tag: null as unknown as void,
          })
        } else {
          updateState({
            selector: ((s: S & { nested: any }) => s.nested[name]) as Selector<S, C>,
            replacer: old => {
              const { [key]: toRemove, ...others } = old as Record<any, any>;
              return others;
            },
            mutator: (s: Record<any, any>) => delete s[key],
            pathSegments: ['nested', name],
            actionName: 'removeNested',
            payload: key,
            tag: null as unknown as void,
          })
        }
      }) as StoreWhichIsNestedInternal<S, C>['defineRemoveNestedStore'],
      defineReset: (
        (initState: C) => () => replace((e => selector(e)) as Selector<S, C>, 'reset')(initState, null as unknown as T)
      ) as StoreWhichIsNestedInternal<S, C>['defineReset'],
      supportsTags: options.supportsTags,
    } as unknown as Store<C, T>;
  };

  const storeResult = <X extends C & Array<any>, C = S>(selector: ((s: DeepReadonly<S>) => C) = (s => s as any as C)) => {
    const selectorMod = selector as Selector<S, C, X>;
    selectorMod(currentState);
    return action<C, X>(selectorMod) as any;
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

  function updateState<C, T extends Trackability, X extends C = C>(specs: {
    selector: Selector<S, C, X>,
    replacer: (newNode: DeepReadonly<X>) => any,
    mutator: (newNode: X) => any,
    pathSegments?: string[],
    actionName: string,
    payload: any,
    tag: Tag<T>,
    actionNameOverride?: boolean,
    getPayloadFn?: () => X,
  }) {
    const previousState = currentState;
    const pathSegments = specs.pathSegments || pathReader.readSelector(specs.selector);
    const result = Object.freeze(copyObject(currentState, { ...currentState }, pathSegments.slice(), specs.replacer));
    specs.mutator(specs.selector(pathReader.mutableStateCopy) as X);
    currentState = result;
    notifySubscribers(previousState, result);
    const actionToDispatch = {
      type: (specs.actionNameOverride ? specs.actionName : (pathSegments.join('.') + (pathSegments.length ? '.' : '') + specs.actionName + '()')) +
        (specs.tag ? ` [${options.tagSanitizer ? options.tagSanitizer(specs.tag as string) : specs.tag}]` : ''),
      payload: (specs.getPayloadFn && (specs.getPayloadFn() !== undefined)) ? specs.getPayloadFn() : specs.payload,
    };
    tests.currentAction = actionToDispatch;
    tests.currentMutableState = pathReader.mutableStateCopy as any;
    if (devtoolsDispatchListener && (!specs.tag || (specs.tag !== 'dontTrackWithDevtools'))) {
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
        previousAction.debounceTimeout = window.setTimeout(() => {
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
        previousAction.debounceTimeout = window.setTimeout(() => {
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
