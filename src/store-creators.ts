import { createStore } from './core';
import {
  DeepReadonly,
  OptionsForMakingANestedStore,
  OptionsForMakingAStore,
  SelectorFromANestedStore,
  SelectorFromAStore,
  SelectorFromAStoreEnforcingTags,
  StoreWhichIsNested,
  Trackability,
} from './shapes-external';
import { NestedContainerStore, OptionsForCreatingInternalRootStore, StoreWhichIsNestedInternal } from './shapes-internal';
import { errorMessages } from './shared-consts';

let nestedContainerStore: NestedContainerStore;

/**
 * Creates a new store which requires a 'tag' to be included with all updates.
 * These tags can improve the debugging experience by describing the source of an update event.
 * This tag could, for example, be the name of the component that an update was trigger from.
 * @param state the initial state  
 * @param options some additional configuration options
 * 
 * @example
 * const select = setEnforceTags({ prop: '' });
 * 
 * // Note that when updating state, we are now required to supply a string as the last argument (in this case 'MyComponent')
 * select(s => s.prop)                   // type: 'prop.replace() [MyComponent]'
 *   .replace('test', 'MyComponent')  // replacement: 'test'
 */
export function setEnforceTags<S>(
  state: S,
  options: OptionsForMakingAStore = {},
) {
  return setInternalRootStore<S, 'tagged'>(state, { ...options, supportsTags: true }) as SelectorFromAStoreEnforcingTags<S>;
}

/**
 * Creates a new store
 * @param state the initial state
 * @param options some additional configuration options
 * 
 * @example
 * const select = set({ todos: Array<{ id: number, text: string }>() });
 */
export function set<S>(
  state: S,
  options: OptionsForMakingAStore = {},
) {
  return setInternalRootStore<S, 'untagged'>(state, { ...options, supportsTags: false }) as SelectorFromAStore<S>;
}

/**
 * Creates a new store which can be (but doesn't have to be) nested inside your application store.
 * If an existing store is already defined as `make({...}, { isContainerForNestedStores: true });`
 * then this store will be automatically nested within that store, under the property `nested`.
 * If the opposite is true, then a new top-level store will be registered within the devtools
 * @param state The initial state
 * @param options A configuration object which, at minimum, must contain the `name` of the nested store
 */
export function setNested<L>(
  state: L,
  { storeName: name, instanceName: storeKey }: OptionsForMakingANestedStore,
) {
  if (!nestedContainerStore) {
    return (<C = L>(selector?: (arg: DeepReadonly<L>) => C) => (selector
      ? createStore({ state, devtools: { name }, supportsTags: false, nestedContainerStore })(selector)
      : null)) as SelectorFromANestedStore<L>;
  }
  const containerStore = nestedContainerStore();
  const generateKey = (arg?: string) => (!arg && !storeKey) ? '0' :
    !storeKey ? (+arg! + 1).toString() : typeof (storeKey) === 'function' ? storeKey(arg) : storeKey;
  const wrapperState = containerStore.read();
  let key: string;
  if (!containerStore.read().nested) {
    key = generateKey();
    containerStore.patch({ nested: { [name]: { [key]: state } } });
    containerStore.renew({ ...wrapperState, nested: { [name]: { [key]: state } } });
  } else if (!containerStore.read().nested[name]) {
    key = generateKey();
    nestedContainerStore(s => s.nested).patch({ [name]: { [key]: state } });
    containerStore.renew({ ...wrapperState, nested: { ...wrapperState.nested, [name]: { [key]: state } } });
  } else {
    const values = nestedContainerStore(s => s.nested[name]).read();
    const keys = Object.keys(values);
    key = generateKey(keys[keys.length - 1]);
    nestedContainerStore(s => s.nested[name]).patch({ [key]: state });
    containerStore.renew({ ...wrapperState, nested: { ...wrapperState.nested, [name]: { ...wrapperState.nested[name], [key]: state } } });
  }
  return (<C = L>(selector?: (arg: L) => C) => {
    const cStore = nestedContainerStore!(s => {
      const nState = s.nested[name][key];
      return selector ? selector(nState) : nState;
    }) as any as StoreWhichIsNestedInternal<L, C>;
    cStore.removeFromContainingStore = cStore.defineRemoveNestedStore(name, key);
    cStore.reset = cStore.defineReset(state);
    return cStore as StoreWhichIsNested<C>;
  }) as SelectorFromANestedStore<L>;
}

function setInternalRootStore<S, T extends Trackability>(
  state: S,
  options: OptionsForCreatingInternalRootStore,
) {
  const store = createStore<S, T>({ state, devtools: options.devtools === undefined ? {} : options.devtools, supportsTags: options.supportsTags, nestedContainerStore, tagSanitizer: options.tagSanitizer });
  if (options.isContainerForNestedStores) {
    if ((typeof (state) !== 'object') || Array.isArray(state)) {
      throw new Error(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
    }
    nestedContainerStore = store as any;
  }
  return store;
}
