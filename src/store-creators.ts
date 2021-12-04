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
  if (!libState.applicationStore) {
    const devtoolsStoreName = `${options.componentName} : ${options.instanceName as string}`;
    const componentStore = createStoreCore({
      state,
      devtools: options.devtools
        ? { ...options.devtools, name: options.devtools.name || `${options.componentName} : ${options.instanceName as string}` }
        : { name: devtoolsStoreName },
    }) as SelectorFromAComponentStore<L>;
    return ((selector?: (state: DeepReadonly<L>) => any) => {
      const selectorFromCompStore = componentStore(selector);
      selectorFromCompStore.removeFromApplicationStore = () => {}
      return selectorFromCompStore;
    }) as SelectorFromAComponentStore<L>;
  } else if (options.instanceName === Deferred) {
    const componentStore = createStoreCore({ state, devtools: false });
    return ((selector?: (state: DeepReadonly<L>) => any) => {
      const selectorFromCompStore = componentStore(selector);
      selectorFromCompStore.setDeferredInstanceName = (instanceName: string | number) => {
        libState.applicationStore!(s => s.cmp[options.componentName][instanceName]).replace(selectorFromCompStore.read());
        Array.from((selectorFromCompStore.storeState.changeListeners as Map<(ar: any) => any, (arg: any) => any>).entries())
          .forEach(([performAction, selector]) =>
            libState.applicationStore!(s => selector(s.cmp[options.componentName][instanceName])).onChange(performAction));
        options.instanceName = instanceName;
      };
      const result = options.instanceName === Deferred ? selectorFromCompStore : (selector
        ? libState.applicationStore!(s => selector(s.cmp[options.componentName][options.instanceName]))
        : libState.applicationStore!(s => s.cmp[options.componentName][options.instanceName]));
      (selectorFromCompStore as any).reset = (selectorFromCompStore as any).defineReset(state, selector);
      result.removeFromApplicationStore = () => {
        const state = libState.applicationStore!().read().cmp[options.componentName];
        if ((Object.keys(state).length === 1) && state[options.instanceName!]) {
          libState.applicationStore!(s => s.cmp[options.componentName]).remove();
        } else {
          libState.applicationStore!(s => s.cmp[options.componentName][options.instanceName]).remove();
        }
      }
      return result;
    }) as SelectorFromAComponentStore<L>;
  } else {
    const wrapperState = libState.applicationStore().read();
    if (['number', 'boolean', 'string'].some(type => typeof (wrapperState) === type) || Array.isArray(wrapperState)) {
      throw new Error(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
    }
    libState.applicationStore(s => s.cmp[options.componentName][options.instanceName]).replace(state);
    return (selector => {
      const selectorFromCompStore = selector
        ? libState.applicationStore!(s => selector(s.cmp[options.componentName][options.instanceName]))
        : libState.applicationStore!(s => s.cmp[options.componentName][options.instanceName]);
      (selectorFromCompStore as any).reset = (selectorFromCompStore as any).defineReset(state, selector);
      (selectorFromCompStore as any).removeFromApplicationStore = () => {
        const state = libState.applicationStore!().read().cmp[options.componentName];
        if ((Object.keys(state).length === 1) && state[options.instanceName!]) {
          libState.applicationStore!(s => s.cmp[options.componentName]).remove();
        } else {
          libState.applicationStore!(s => s.cmp[options.componentName][options.instanceName]).remove();
        }
      }
      return selectorFromCompStore as any;
    }) as SelectorFromAComponentStore<L>;
  }
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
