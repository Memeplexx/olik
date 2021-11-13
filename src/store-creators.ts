import { createStoreCore } from './core';
import {
  DeepReadonly,
  OptionsForMakingAComponentStore,
  OptionsForMakingAnApplicationStore,
  SelectorFromAComponentStore,
  SelectorFromAStore,
  SelectorFromAStoreEnforcingTags,
  StoreForAComponent,
  Trackability,
  Deferred,
} from './shapes-external';
import { OptionsForCreatingInternalApplicationStore, StoreForAComponentInternal } from './shapes-internal';
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
 * const store = createApplicationStoreEnforcingTags({ prop: '' });
 * 
 * // Note that when updating state, we are now required to supply a string as the last argument (in this case 'MyComponent')
 * select(s => s.prop)                // type: 'prop.replace() [MyComponent]'
 *   .replace('test', 'MyComponent')  // replacement: 'test'
 */
export function createApplicationStoreEnforcingTags<S>(
  state: S,
  options: OptionsForMakingAnApplicationStore = {},
) {
  return createApplicationStoreInternal<S, 'tagged'>(state, options) as SelectorFromAStoreEnforcingTags<S>;
}

/**
 * Creates a new application-wide store
 * @param state the initial state
 * @param options some additional configuration options
 * 
 * @example
 * const select = createApplicationStore({ todos: Array<{ id: number, text: string }>() });
 */
export function createApplicationStore<S>(
  state: S,
  options: OptionsForMakingAnApplicationStore = {},
) {
  return createApplicationStoreInternal<S, 'untagged'>(state, options) as SelectorFromAStore<S>;
}

/**
 * Creates a new store which is nestable within inside your application store.
 * If you have already created an application store then this store will be automatically nested within that store, under the property `components`.
 * If the opposite is true, then a new top-level store will be registered within the devtools
 * @param state The initial state
 * @param options A configuration object which, at minimum, must contain the `componentName` of the component store
 * 
 * @example
 * const store = createComponentStore({
 *   id: number,
 *   text: string,
 *   done: boolean,
 * }, {
 *   componentName: 'TodoComponent',
 *   instanceName: todoId
 * })
 */
export function createComponentStore<L>(
  state: L,
  options: OptionsForMakingAComponentStore,
) {
  let detachedComponentStore: StoreForAComponent<any> | null;
  let instanceName = options.instanceName;
  const componentName = options.componentName;
  if (!libState.applicationStore) {
    detachedComponentStore = createDetachedComponentStore(state, options) as any;
  } else if (options.instanceName === Deferred) {
    detachedComponentStore = createDetachedComponentStore(state, { ...options, devtools: false }) as any;
  } else {
    const wrapperState = libState.applicationStore().read();
    if (['number', 'boolean', 'string'].some(type => typeof (wrapperState) === type) || Array.isArray(wrapperState)) {
      throw new Error(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
    }
    libState.applicationStore(s => s.cmp[componentName][instanceName]).replace(state);
  }
  return ((selector?: (state: L) => any) => {
    if (detachedComponentStore) {
      const selectorFromCompStore = (detachedComponentStore as any)(selector);
      selectorFromCompStore.attachToApplicationStore = (opts?: { instanceName: string | number }) => {
        if (!libState.applicationStore) { return; }
        if (options.instanceName === Deferred && (!opts?.instanceName || (typeof(opts?.instanceName) !== 'number' && typeof(opts?.instanceName) !== 'string'))) {
          throw new Error(errorMessages.MUST_SUPPLY_INSTANCE_NAME_WITH_DEFERRED_INSTANCE_NAMES);
        }
        instanceName = (opts?.instanceName || instanceName).toString();
        libState.applicationStore!(s => s.cmp[componentName][instanceName]).replace(selectorFromCompStore.read());
        Array.from(((detachedComponentStore as any)().storeState.changeListeners as Map<(ar: any) => any, (arg: any) => any>).entries())
          .forEach(([performAction, selector]) =>
            libState.applicationStore!(s => selector(s.cmp[componentName][instanceName])).onChange(performAction));
        detachedComponentStore = null;
      }
      return selectorFromCompStore;
    } else {
      const selectorFromCompStore = selector
        ? libState.applicationStore!(s => selector(s.cmp[componentName][instanceName]))
        : libState.applicationStore!(s => s.cmp[componentName][instanceName]);
      (selectorFromCompStore as any).detachFromApplicationStore = () => {
        if (!libState.applicationStore) { return; }
        const state = libState.applicationStore().read().cmp[componentName];
        if ((Object.keys(state).length === 1) && state[instanceName!]) {
          libState.applicationStore(s => s.cmp[componentName]).remove();
        } else {
          libState.applicationStore(s => s.cmp[componentName][instanceName]).remove();
        }
        detachedComponentStore = createDetachedComponentStore(state[instanceName], options) as any;
      }
      (selectorFromCompStore as any).reset = (selectorFromCompStore as any).defineReset(state, selector);
      return selectorFromCompStore;
    }
  }) as any as SelectorFromAComponentStore<L>;
}

function createDetachedComponentStore<L>(
  state: L,
  options: OptionsForMakingAComponentStore,
) {
  const devtoolsStoreName = options.devtools !== false ? `${options.componentName} : ${options.instanceName as string}` : '';
  const selectorFromAppStore = createStoreCore({
    state,
    devtools: options.devtools === false ? false : options.devtools ? { ...options.devtools, name: options.devtools.name || devtoolsStoreName } : { name: devtoolsStoreName },
  }) as SelectorFromAComponentStore<L>;
  return ((selector?: (state: DeepReadonly<L>) => any) => {
    const selectorFromCompStore = selectorFromAppStore(selector);
    selectorFromCompStore.detachFromApplicationStore = () => { /* noop */ }
    return selectorFromCompStore;
  }) as SelectorFromAComponentStore<L>;
}

function createApplicationStoreInternal<S, T extends Trackability>(
  state: S,
  options: OptionsForCreatingInternalApplicationStore,
) {
  if (!options.replaceExistingStoreIfItExists && libState.applicationStore) {
    (libState.applicationStore() as any).deepMerge(state);
    return libState.applicationStore;
  }
  const select = createStoreCore<S, T>({
    state,
    ...options,
  });
  libState.applicationStore = select;
  return select;
}
