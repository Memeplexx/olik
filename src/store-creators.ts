import { errorMessages } from './shared-consts';
import { createStore } from './core';
import {
  DeepReadonly,
  OptionsForMakingAStore,
  OptionsForReduxDevtools,
  SelectorFromANestedStore,
  SelectorFromAStore,
  SelectorFromAStoreEnforcingTags,
  StoreWhichIsNested,
  Trackability,
} from './shapes-external';
import { NestedContainerStore, StoreWhichIsNestedInternal } from './shapes-internal';

let nestedContainerStore: NestedContainerStore;

/**
 * Creates a new store which requires a 'tag' to be included with all updates.
 * These tags can improve the debugging experience by describing the source of an update event.
 * This tag could, for example, be the name of the component that an update was trigger from.
 * @param state the initial state  
 * @param options some additional configuration options
 * 
 * @example
 * const get = setEnforceTags({ prop: '' });
 * 
 * // Note that when updating state, we are now required to supply a string as the last argument (in this case 'MyComponent')
 * get(s => s.prop)                   // type: 'prop.replace()'
 *   .replace('test', 'MyComponent')  // replacement: 'test'
 */
export function setEnforceTags<S>(state: S, options: OptionsForMakingAStore = {}): SelectorFromAStoreEnforcingTags<S> {
  return setInternalRootStore<S, 'tagged'>(state, { ...options, supportsTags: true });
}

/**
 * Creates a new store
 * @param state the initial state
 * @param options some additional configuration options
 * 
 * @example
 * const get = set({ todos: Array<{ id: number, text: string }>() });
 */
export function set<S>(state: S, options: OptionsForMakingAStore = {}): SelectorFromAStore<S> {
  return setInternalRootStore<S, 'untagged'>(state, { ...options, supportsTags: false });
}

/**
 * Creates a new store which can be (but doesn't have to be) nested inside your application store.
 * If an existing store is already defined as `make({...}, { isContainerForNestedStores: true });`
 * then this store will be automatically nested within that store, under the property `nested`.
 * If the opposite is true, then a new top-level store will be registered within the devtools
 * @param state The initial state
 * @param options A configuration object which, at minimum, must contain the `name` of the nested store
 */
export function setNested<L>(state: L, options: { name: string, storeKey?: string | ((previousKey?: string) => string) }): SelectorFromANestedStore<L> {
  const name = options.name;
  if (!nestedContainerStore) {
    return (<C = L>(selector?: (arg: DeepReadonly<L>) => C) => (selector
      ? createStore({ state, devtools: { name }, supportsTags: false, nestedContainerStore })(selector)
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

function setInternalRootStore<S, T extends Trackability>(state: S, options: { isContainerForNestedStores?: boolean, supportsTags: boolean, devtools?: OptionsForReduxDevtools | false, tagSanitizer?: (tag: string) => string }) {
  const store = createStore<S, T>({ state, devtools: options.devtools === undefined ? {} : options.devtools, supportsTags: options.supportsTags, nestedContainerStore, tagSanitizer: options.tagSanitizer });
  if (options.isContainerForNestedStores) {
    if ((typeof (state) !== 'object') || Array.isArray(state)) {
      throw new Error(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
    }
    nestedContainerStore = store as any;
  }
  return store;
}