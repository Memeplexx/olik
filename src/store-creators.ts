import { createStoreCore } from './core';
import {
  OptionsForMakingANestedStore,
  OptionsForMakingAStore,
  SelectorFromANestedStore,
  SelectorFromAStore,
  SelectorFromAStoreEnforcingTags,
  SelectorReader,
  SelectorReaderNested,
  StoreWhichIsNested,
  Trackability,
} from './shapes-external';
import { OptionsForCreatingInternalRootStore, StoreWhichIsNestedInternal } from './shapes-internal';
import { errorMessages } from './shared-consts';
import { libState } from './shared-state';
import { isEmpty } from './shared-utils';
import { transact } from './transact';

/**
 * Creates a new store which requires a 'tag' to be included with all updates.
 * These tags can improve the debugging experience by describing the source of an update event.
 * This tag could, for example, be the name of the component that an update was trigger from.
 * @param state the initial state  
 * @param options some additional configuration options
 * 
 * @example
 * const select = createAppStoreEnforcingTags({ prop: '' });
 * 
 * // Note that when updating state, we are now required to supply a string as the last argument (in this case 'MyComponent')
 * select(s => s.prop)                // type: 'prop.replace() [MyComponent]'
 *   .replace('test', 'MyComponent')  // replacement: 'test'
 */
export function createAppStoreEnforcingTags<S>(
  state: S,
  options: OptionsForMakingAStore = {},
) {
  return setInternalRootStore<S, 'tagged'>(state, { ...options, enforcesTags: true }) as SelectorReader<S, SelectorFromAStoreEnforcingTags<S>>;
}

/**
 * Creates a new application-wide store
 * @param state the initial state
 * @param options some additional configuration options
 * 
 * @example
 * const select = createAppStore({ todos: Array<{ id: number, text: string }>() });
 */
export function createAppStore<S>(
  state: S,
  options: OptionsForMakingAStore = {},
) {
  return setInternalRootStore<S, 'untagged'>(state, { ...options, enforcesTags: false }) as SelectorReader<S, SelectorFromAStore<S>>;
}

/**
 * Creates a new store which is nestable within inside your application store.
 * If you have already created an application store then this store will be automatically nested within that store, under the property `nested`.
 * If the opposite is true, then a new top-level store will be registered within the devtools
 * @param state The initial state
 * @param options A configuration object which, at minimum, must contain the `componentName` of the nested store
 * 
 * @example
 * const select = createNestedStore({
 *   id: number,
 *   text: string,
 *   done: boolean,
 * }, {
 *   componentName: 'TodoComponent',
 *   instanceName: todoId
 * })
 */
export function createNestedStore<L>(
  state: L,
  { componentName, instanceName, dontTrackWithDevtools }: OptionsForMakingANestedStore,
) {
  const generateKey = () => {
    if (!instanceName) {
      if (isEmpty(libState.nestedStoresAutoGenKeys[componentName])) {
        libState.nestedStoresAutoGenKeys[componentName] = 0;
      } else {
        libState.nestedStoresAutoGenKeys[componentName]++;
      }
      return libState.nestedStoresAutoGenKeys[componentName].toString();
    } else {
      return instanceName;
    }
  }
  if (!libState.nestedContainerStore) {
    const nStore = createStoreCore<L, 'untagged'>({ state, devtools: dontTrackWithDevtools ? false : { name: componentName + ' : ' + generateKey() } }) as SelectorReader<L, SelectorFromANestedStore<L>>;
    const select = (<C = L>(selector?: (arg: L) => C) => {
      const cStore = selector ? nStore.select(selector as any) : nStore.select();
      (cStore as any).isNested = true;
      return cStore as any as StoreWhichIsNested<C>;
    });
    const read = () => select().read();
    const detachFromAppStore = () => { /* This is a no-op */ };
    return { select, read, detachFromAppStore } as SelectorReaderNested<L, SelectorFromANestedStore<L>>;
  }
  const containerStore = libState.nestedContainerStore();
  const wrapperState = containerStore.read();
  const key = generateKey();
  if (!wrapperState.nested) {
    if (['number', 'boolean', 'string'].some(type => typeof(wrapperState) === type) || Array.isArray(wrapperState)) {
      throw new Error(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
    }
    containerStore.patch({ nested: { [componentName]: { [key]: state } } });
    containerStore.renew({ ...wrapperState, nested: { [componentName]: { [key]: state } } });
  } else if (!wrapperState.nested[componentName]) {
    libState.nestedContainerStore(s => s.nested).patch({ [componentName]: { [key]: state } });
    containerStore.renew({ ...wrapperState, nested: { ...wrapperState.nested, [componentName]: { [key]: state } } });
  } else {
    libState.nestedContainerStore(s => s.nested[componentName]).patch({ [key]: state });
    containerStore.renew({ ...wrapperState, nested: { ...wrapperState.nested, [componentName]: { ...wrapperState.nested[componentName], [key]: state } } });
  }
  const select = (<C = L>(selector?: (arg: L) => C) => {
    const cStore = libState.nestedContainerStore!(s => {
      const nState = s.nested[componentName][key];
      return selector ? selector(nState) : nState;
    }) as any as StoreWhichIsNestedInternal<L, C>;
    cStore.reset = cStore.defineReset(state, selector);
    cStore.isNested = true;
    return cStore as StoreWhichIsNested<C>;
  });
  const detachFromAppStore = () => {
    if (!libState.nestedContainerStore) { return; }
    const state = libState.nestedContainerStore().read().nested[componentName];
    if ((Object.keys(state).length === 1) && state[key]) {
      libState.nestedContainerStore(s => s.nested).remove(componentName);/////
    } else {
      libState.nestedContainerStore(s => s.nested[componentName]).remove(key);
    }
  }
  const read = () => select().read();
  const setInstanceName = (name: string) => {
    const currentNestedState = (libState.nestedContainerStore!().read() as any).nested[componentName];
    const { [key]: value } = currentNestedState;
    transact(
      () => libState.nestedContainerStore!(s => (s as any).nested[componentName]).remove(key),
      () => libState.nestedContainerStore!(s => (s as any).nested[componentName]).insert({ [name]: value }),
    )
  }
  return { select, read, detachFromAppStore, setInstanceName } as SelectorReaderNested<L, SelectorFromANestedStore<L>>;
}

function setInternalRootStore<S, T extends Trackability>(
  state: S,
  options: OptionsForCreatingInternalRootStore,
) {
  const store = createStoreCore<S, T>({
    state, devtools: options.devtools === undefined ? {} : options.devtools,
    tagSanitizer: options.tagSanitizer, tagsToAppearInType: options.tagsToAppearInType
  });
  libState.nestedContainerStore = store.select as any;
  return store;
}
