import { createStore } from './core';
import {
  OptionsForMakingANestedStore,
  OptionsForMakingAStore,
  SelectorFromANestedStore,
  SelectorFromAStore,
  SelectorFromAStoreEnforcingTags,
  StoreWhichIsNested,
  Trackability,
} from './shapes-external';
import { OptionsForCreatingInternalRootStore, StoreWhichIsNestedInternal } from './shapes-internal';
import { errorMessages } from './shared-consts';
import { libState } from './shared-state';

/**
 * Creates a new store which requires a 'tag' to be included with all updates.
 * These tags can improve the debugging experience by describing the source of an update event.
 * This tag could, for example, be the name of the component that an update was trigger from.
 * @param state the initial state  
 * @param options some additional configuration options
 * 
 * @example
 * const select = storeEnforcingTags({ prop: '' });
 * 
 * // Note that when updating state, we are now required to supply a string as the last argument (in this case 'MyComponent')
 * select(s => s.prop)                // type: 'prop.replace() [MyComponent]'
 *   .replace('test', 'MyComponent')  // replacement: 'test'
 */
export function storeEnforcingTags<S>(
  state: S,
  options: OptionsForMakingAStore = {},
) {
  return setInternalRootStore<S, 'tagged'>(state, { ...options, enforcesTags: true }) as SelectorFromAStoreEnforcingTags<S>;
}

/**
 * Creates a new store
 * @param state the initial state
 * @param options some additional configuration options
 * 
 * @example
 * const select = store({ todos: Array<{ id: number, text: string }>() });
 */
export function store<S>(
  state: S,
  options: OptionsForMakingAStore = {},
) {
  return setInternalRootStore<S, 'untagged'>(state, { ...options, enforcesTags: false }) as SelectorFromAStore<S>;
}

/**
 * Creates a new store which can be (but doesn't have to be) nested inside your application store.
 * If an existing store is already defined as `store({...}, { isContainerForNestedStores: true });`
 * then this store will be automatically nested within that store, under the property `nested`.
 * If the opposite is true, then a new top-level store will be registered within the devtools
 * @param state The initial state
 * @param options A configuration object which, at minimum, must contain the `componentName` of the nested store
 * 
 * @example
 * const select = nestedStore({
 *   id: number,
 *   text: string,
 *   done: boolean,
 * }, {
 *   storeName: 'TodoComponent',
 *   instanceName: todoId
 * })
 */
export function nestedStore<L>(
  state: L,
  { componentName, instanceName, dontTrackWithDevtools }: OptionsForMakingANestedStore,
) {
  const generateKey = (arg?: string) => (!arg && !instanceName) ? '0' :
    !instanceName ? (+arg! + 1).toString() : instanceName;
  if (!libState.nestedContainerStore) {
    const nStore = createStore<L, 'untagged'>({ state, devtools: dontTrackWithDevtools ? false : { name: componentName + ' : ' + generateKey() } }) as SelectorFromANestedStore<L>;
    return (<C = L>(selector?: (arg: L) => C) => {
      const cStore = selector ? nStore(selector as any) : nStore();
      cStore.storeDetach = () => console.info(errorMessages.NO_CONTAINER_STORE);
      cStore.reset = () => console.info(errorMessages.NO_CONTAINER_STORE);
      return cStore as any as StoreWhichIsNested<C>;
    }) as SelectorFromANestedStore<L>;
  }
  const containerStore = libState.nestedContainerStore();
  const wrapperState = containerStore.read();
  let key: string;
  if (!containerStore.read().nested) {
    key = generateKey();
    containerStore.patch({ nested: { [componentName]: { [key]: state } } });
    containerStore.renew({ ...wrapperState, nested: { [componentName]: { [key]: state } } });
  } else if (!containerStore.read().nested[componentName]) {
    key = generateKey();
    libState.nestedContainerStore(s => s.nested).patch({ [componentName]: { [key]: state } });
    containerStore.renew({ ...wrapperState, nested: { ...wrapperState.nested, [componentName]: { [key]: state } } });
  } else {
    const values = libState.nestedContainerStore(s => s.nested[componentName]).read();
    const keys = Object.keys(values);
    key = generateKey(keys[keys.length - 1]);
    libState.nestedContainerStore(s => s.nested[componentName]).patch({ [key]: state });
    containerStore.renew({ ...wrapperState, nested: { ...wrapperState.nested, [componentName]: { ...wrapperState.nested[componentName], [key]: state } } });
  }
  return (<C = L>(selector?: (arg: L) => C) => {
    const cStore = libState.nestedContainerStore!(s => {
      const nState = s.nested[componentName][key];
      return selector ? selector(nState) : nState;
    }) as any as StoreWhichIsNestedInternal<L, C>;
    cStore.storeDetach = cStore.defineStoreDetach(componentName, key);
    cStore.reset = cStore.defineReset(state);
    return cStore as StoreWhichIsNested<C>;
  }) as SelectorFromANestedStore<L>;
}

function setInternalRootStore<S, T extends Trackability>(
  state: S,
  options: OptionsForCreatingInternalRootStore,
) {
  if (options.isContainerForNestedStores && libState.nestedContainerStore) {
    throw new Error(errorMessages.CANNOT_CREATE_MORE_THAN_ONE_CONTAINER_STORE);
  }
  const store = createStore<S, T>({ state, devtools: options.devtools === undefined ? {} : options.devtools,
    tagSanitizer: options.tagSanitizer, tagsToAppearInType: options.tagsToAppearInType });
  if (options.isContainerForNestedStores) {
    if ((typeof (state) !== 'object') || Array.isArray(state)) {
      throw new Error(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
    }
    libState.nestedContainerStore = store as any;
  }
  return store;
}
