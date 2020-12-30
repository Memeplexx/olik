import { devtoolsDebounce, errorMessages } from './consts';
import { integrateStoreWithReduxDevtools } from './devtools';
import {
  DeepReadonly,
  OptionsForMakingAStore,
  OptionsForMakingAStoreEnforcingTags,
  OptionsForReduxDevtools,
  LiteralOrPromiseReturning,
  Selector,
  SelectorFromANestedStore,
  SelectorFromAStore,
  SelectorFromAStoreEnforcingTags,
  SimpleObject,
  Store,
  StoreForAnArrayOfObjects,
  StoreForAnArray,
  StoreWhichIsNested,
  StoreWhichIsNestedInternal,
  StoreWhichIsReadable,
  StoreWhichIsResettable,
  StoreWhichMayContainNestedStores,
  StoreForAnObject,
  StoreForAnObjectOrPrimitive,
  Trackability,
  Tag,
} from './shape';
import { tests } from './tests';
import { copyObject, copyPayload, copyPayloadOrPromise, createPathReader, deepCopy, deepFreeze, getCacheKey, validateState } from './utils';

let nestedContainerStore: ((selector?: ((s: DeepReadonly<any>) => any) | undefined) => StoreWhichMayContainNestedStores<any, any, any>) | undefined;

/**
 * Creates a new store which, for typescript users, requires that users supply an additional 'tag' when performing a state update.
 * These tags can improve the debugging experience by describing the source of an update event, for example the name of the component an update was trigger from.
 * @param state the initial state  
 * @param options some additional configuration options
 * 
 * FOR EXAMPLE:
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
 * FOR EXAMPLE:
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
  const cache = new Map<string, any>();
  const cacheExpiredListeners = new Map<(ar: any) => any, () => any>();
  const doPromise = <C>(cacheKey: string, selector: Function, promise: () => Promise<C>, ttl: number, updateStateFn: (frozen: C, copied: C) => any) => new Promise<C>((resolve, reject) => {
    if (cache.has(cacheKey)) {
      resolve(cache.get(cacheKey));
      return;
    }
    promise().then(res => {
      const copiedRes = copyPayload(res);
      cache.set(cacheKey, copiedRes);
      setTimeout(() => {
        cache.delete(cacheKey);
        Array.from(cacheExpiredListeners.keys()).filter(l => l.toString() === selector.toString()).forEach(key => {
          cacheExpiredListeners.get(key)!();
          cacheExpiredListeners.delete(key);
        });
      }, ttl);
      updateStateFn(copiedRes.payloadFrozen, copiedRes.payloadCopied);
      resolve(copiedRes.payloadFrozen);
    }).catch(err => reject(err));
  });
  const processPayloadOrPromise = <C>(specs: { cacheKey: string, selector: Function, payloadOrPromise: LiteralOrPromiseReturning<C>, updateStateFn: (frozen: C, copied: C) => any }) => {
    const { payloadFrozen, payloadCopied, promise, cachedPromise } = copyPayloadOrPromise(specs.payloadOrPromise);
    if (promise) {
      return doPromise(specs.cacheKey, specs.selector, promise, 0, specs.updateStateFn);
    } else if (cachedPromise) {
      return doPromise(specs.cacheKey, specs.selector, cachedPromise.promise, cachedPromise.ttl, specs.updateStateFn);
    } else if (payloadFrozen !== undefined && payloadCopied !== undefined) {
      specs.updateStateFn(payloadFrozen, payloadCopied);
    }
  }
  const replace = <C, T extends Trackability>(selector: Selector<S, C>, name: string) => (payloadOrPromise: LiteralOrPromiseReturning<C>, tag: Tag<T>) => {
    const pathSegments = pathReader.readSelector(selector);
    if (!pathSegments.length) {
      return processPayloadOrPromise({
        cacheKey: name,
        selector,
        payloadOrPromise,
        updateStateFn: (frozen, copied) => updateState({
          selector,
          replacer: old => frozen,
          mutator: old => {
            if (Array.isArray(old)) {
              (old as Array<any>).length = 0; Object.assign(old, copied);
            } else if (typeof (old) === 'boolean' || typeof (old) === 'number') {
              pathReader.mutableStateCopy = copied as any as S;
            } else {
              Object.assign(old, copied);
            }
          },
          actionName: name,
          pathSegments: [],
          payload: frozen,
          tag,
        })
      })
    } else {
      const lastSeg = pathSegments[pathSegments.length - 1] || '';
      const segsCopy = pathSegments.slice(0, pathSegments.length - 1);
      const selectorRevised = (((state: S) => {
        let res = state as SimpleObject;
        segsCopy.forEach(seg => res = res[seg]);
        return res;
      })) as Selector<S, C>;
      const cacheKey = getCacheKey(pathSegments, name);
      return processPayloadOrPromise({
        cacheKey: getCacheKey(pathSegments, name),
        selector,
        payloadOrPromise,
        updateStateFn: (frozen, copied) => updateState({
          selector: selectorRevised,
          replacer: old => Array.isArray(old) ? (old as Array<any>).map((o, i) => i === +lastSeg ? deepCopy(frozen) : o) : ({ ...old, [lastSeg]: deepCopy(frozen) }),
          mutator: (old: SimpleObject) => old[lastSeg] = copied,
          actionName: cacheKey,
          actionNameOverride: true,
          pathSegments: segsCopy,
          payload: frozen,
          tag,
        })
      })
    }
  };

  const action = <C, X extends C & Array<any>>(selector: Selector<S, C, X>) => {
    return {
      replace: replace(selector, 'replace'
      ) as StoreForAnObjectOrPrimitive<C, Trackability>['replace'],
      replaceAll: replace(
        selector, 'replaceAll'
      ) as StoreForAnArray<any, Trackability>['replaceAll'],
      patch: ((payloadOrPromise, tag) => {
        const pathSegments = pathReader.readSelector(selector);
        return processPayloadOrPromise({
          cacheKey: getCacheKey(pathSegments, 'patch'),
          selector,
          payloadOrPromise,
          updateStateFn: (frozen, copied) => updateState({
            selector,
            replacer: old => ({ ...old, ...frozen }),
            mutator:  old => Object.assign(old, copied),
            actionName: 'patch',
            pathSegments,
            payload: frozen,
            tag,
          })
        })
      }) as StoreForAnObject<C, T>['patch'],
      patchWhere: (where => ({
        with: (payloadOrPromise, tag) => {
          const indicesOfElementsToPatch = (selector(currentState) as X).map((e, i) => where(e) ? i : null).filter(i => i !== null) as number[];
          const pathSegments = pathReader.readSelector(selector);
          return processPayloadOrPromise({
            cacheKey: getCacheKey(pathSegments, 'patchWhere'),
            selector,
            payloadOrPromise,
            updateStateFn: (frozen, copied) => updateState({
              selector,
              replacer: old => old.map((o, i) => indicesOfElementsToPatch.includes(i) ? { ...o, ...frozen } : o),
              mutator: old => indicesOfElementsToPatch.forEach(i => Object.assign(old[i], copied)),
              actionName: `${indicesOfElementsToPatch.join(',')}.patchWhere`,
              pathSegments,
              payload: { patch: frozen, whereClause: where.toString() },
              tag,
            })
          })
        }
      })) as StoreForAnArrayOfObjects<X, T>['patchWhere'],
      addAfter: ((payloadOrPromise, tag) => {
        const pathSegments = pathReader.readSelector(selector);
        return processPayloadOrPromise({
          cacheKey: getCacheKey(pathSegments, 'addAfter'),
          selector,
          payloadOrPromise,
          updateStateFn: (frozen, copied) => updateState({
            selector,
            replacer: old => [...old, ...(deepCopy(Array.isArray(frozen) ? frozen : [frozen]))],
            mutator: old => old.push(...(Array.isArray(copied) ? copied : [copied])),
            actionName: 'addAfter',
            pathSegments,
            payload: frozen,
            tag,
          })
        });
      }) as StoreForAnArray<X, T>['addAfter'],
      addBefore: ((payloadOrPromise, tag) => {
        const pathSegments = pathReader.readSelector(selector);
        return processPayloadOrPromise({
          cacheKey: getCacheKey(pathSegments, 'addBefore'),
          selector,
          payloadOrPromise,
          updateStateFn: (frozen, copied) => updateState({
            selector,
            replacer: old => [...(deepCopy(Array.isArray(frozen) ? frozen : [frozen])), ...old],
            mutator:  old => old.unshift(...(Array.isArray(copied) ? copied : [copied])),
            actionName: 'addBefore',
            pathSegments,
            payload: frozen,
            tag,
          })
        });
      }) as StoreForAnArray<X, T>['addBefore'],
      removeFirst: (tag => {
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
        updateState<C, T, X>({
          selector,
          replacer: old => old.slice(0, old.length - 1),
          mutator: old => old.pop(),
          actionName: 'removeLast',
          pathSegments: pathReader.readSelector(selector),
          payload: selection.slice(0, selection.length - 1),
          tag
        })
      }) as StoreForAnArray<X, T>['removeLast'],
      removeAll: (tag => {
        updateState<C, T, X>({
          selector,
          replacer: () => [],
          mutator: old => old.length = 0,
          actionName: 'removeAll',
          pathSegments: pathReader.readSelector(selector),
          payload: null,
          tag,
        })
      }) as StoreForAnArray<X, T>['removeAll'],
      removeWhere: ((predicate, tag) => {
        const indicesOfElementsToRemove = (selector(currentState) as X).map((e, i) => predicate(e) ? i : null).filter(i => i !== null);
        const pathSegments = pathReader.readSelector(selector);
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
          pathSegments,
          payload: { toRemove: (selector(currentState) as X).filter(predicate), whereClause: predicate.toString() },
          tag,
        });
      }) as StoreForAnArray<X, T>['removeWhere'],
      upsertWhere: (criteria => ({
        with: (payloadOrPromise, tag) => {
          const indicesOfElementsToReplace = (selector(currentState) as X).map((e, i) => criteria(e) ? i : null).filter(i => i !== null);
          if (indicesOfElementsToReplace.length > 1) { throw new Error(errorMessages.UPSERT_MORE_THAN_ONE_MATCH); }
          const indice = indicesOfElementsToReplace[0];
          const pathSegments = pathReader.readSelector(selector);
          return processPayloadOrPromise({
            cacheKey: getCacheKey(pathSegments, 'upsertWhere'),
            selector,
            payloadOrPromise,
            updateStateFn: (frozen, copied) => updateState({
              selector,
              replacer: old => indicesOfElementsToReplace.length ? old.map((o, i) => i === indice ? frozen : o) : [...old, frozen],
              mutator: old => indicesOfElementsToReplace.length ? old[indice as number] = copied : old.push(copied),
              actionName: `${indice !== undefined ? indice + '.' : ''}upsertWhere`,
              pathSegments,
              payload: frozen,
              tag,
            })
          })
        }
      })) as StoreForAnArray<X, T>['upsertWhere'],
      mergeWhere: (criteria => ({
        with: (payloadOrPromise, tag) => {
          const pathSegments = pathReader.readSelector(selector);
          return processPayloadOrPromise({
            cacheKey: getCacheKey(pathSegments, 'mergeWhere'),
            selector,
            payloadOrPromise,
            updateStateFn: (frozen, copied) => updateState({
              selector,
              replacer: old => [
                ...old.map(oe => frozen.find(ne => criteria(oe, ne)) || oe),
                ...frozen.filter(ne => !old.some(oe => criteria(oe, ne)))
              ],
              mutator: old => {
                old.forEach((oe, oi) => { const found = copied.find(ne => criteria(oe, ne)); if (found) { old[oi] = deepCopy(found); } });
                copied.filter(ne => !old.some(oe => criteria(oe, ne))).forEach(ne => old.push(ne));
              },
              actionName: 'mergeWhere',
              pathSegments,
              payload: frozen,
              tag,
            })
          })
        }
      })) as StoreForAnArray<X, T>['mergeWhere'],
      replaceWhere: (criteria => ({
        with: (payloadOrPromise, tag) => {
          const indicesOfElementsToReplace = (selector(currentState) as X).map((e, i) => criteria(e) ? i : null).filter(i => i !== null);
          const pathSegments = pathReader.readSelector(selector);
          return processPayloadOrPromise({
            cacheKey: getCacheKey(pathSegments, 'replaceWhere'),
            selector,
            payloadOrPromise,
            updateStateFn: (frozen, copied) => updateState<C, T, X>({
              selector,
              replacer: old => old.map((o, i) => indicesOfElementsToReplace.includes(i) ? deepCopy(frozen) : o),
              mutator: old => {
                old.forEach((el, idx) => {
                  if (indicesOfElementsToReplace.includes(idx)) {
                    old[idx] = copied;
                  }
                })
              },
              pathSegments,
              actionName: `${indicesOfElementsToReplace.join(',')}.replaceWhere`,
              payload: { replacement: frozen, whereClause: criteria.toString() },
              tag,
            })
          })
        }
      })) as StoreForAnArray<X, T>['replaceWhere'],
      reset: (
        tag => replace(selector, 'reset')(selector(initialState), tag)
      ) as StoreWhichIsResettable<C, T>['reset'],
      onChange: (performAction => {
        changeListeners.set(performAction, selector);
        return { unsubscribe: () => changeListeners.delete(performAction) };
      }) as StoreWhichIsReadable<C>['onChange'],
      read: (
        () => deepFreeze(selector(currentState))
      ) as StoreWhichIsReadable<C>['read'],
      readInitial: (
        () => selector(initialState)
      ) as StoreWhichIsReadable<C>['readInitial'],
      renew: (state => {
        pathReader = createPathReader(state);
        currentState = deepFreeze(state) as S;
      }) as StoreWhichMayContainNestedStores<S, C, T>['renew'],
      defineRemoveNestedStore: ((name, key) => () => {
        if (!nestedContainerStore) { return; }
        if (Object.keys((currentState as S & { nested: any }).nested[name]).length === 1) {
          return updateState({
            selector: ((s: S & { nested: any }) => s.nested) as Selector<S, C>,
            replacer: old => {
              const { [name]: toRemove, ...others } = old as SimpleObject;
              return others;
            },
            mutator: (s: SimpleObject) => delete s[name],
            pathSegments: ['nested'],
            actionName: 'remove',
            payload: { name, key },
            tag: null as unknown as void,
          })
        } else {
          return updateState({
            selector: ((s: S & { nested: any }) => s.nested[name]) as Selector<S, C>,
            replacer: old => {
              const { [key]: toRemove, ...others } = old as SimpleObject;
              return others;
            },
            mutator: (s: SimpleObject) => delete s[key],
            pathSegments: ['nested', name],
            actionName: 'remove',
            payload: key,
            tag: null as unknown as void,
          })
        }
      }) as StoreWhichIsNestedInternal<S, C>['defineRemoveNestedStore'],
      defineReset: (
        (initState: C) => () => replace((e => selector(e)) as Selector<S, C>, 'reset')(initState, null as unknown as T)
      ) as StoreWhichIsNestedInternal<S, C>['defineReset'],
      invalidateCache: (() => {
        const segs = pathReader.readSelector(selector).join('.');
        Array.from(cache.keys()).filter(key => key.startsWith(segs)).forEach(key => cache.delete(key));
      }) as StoreWhichIsReadable<C>['invalidateCache'],
      onCacheExpired: (performAction => {
        cacheExpiredListeners.set(selector, performAction);
        return { unsubscribe: () => cacheExpiredListeners.delete(selector) };
      }) as StoreWhichIsReadable<C>['onCacheExpired'],
      supportsTags: options.supportsTags,
    } as unknown as Store<C, T>;
  };

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

  function updateState<C, T extends Trackability, X extends C = C>(specs: {
    selector: Selector<S, C, X>,
    replacer: (newNode: X) => any,
    mutator: (newNode: X) => any,
    pathSegments: string[],
    actionName: string,
    payload: any,
    tag: Tag<T>,
    actionNameOverride?: boolean,
  }) {
    const previousState = currentState;
    const result = Object.freeze(copyObject(currentState, { ...currentState }, specs.pathSegments.slice(), specs.replacer));
    specs.mutator(specs.selector(pathReader.mutableStateCopy) as X);
    currentState = result;
    notifySubscribers(previousState, result);
    const actionToDispatch = {
      type: (specs.actionNameOverride ? specs.actionName : (specs.pathSegments.join('.') + (specs.pathSegments.length ? '.' : '') + specs.actionName + '()')) +
        (specs.tag ? ` [${options.tagSanitizer ? options.tagSanitizer(specs.tag as string) : specs.tag}]` : ''),
      payload: specs.payload,
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
