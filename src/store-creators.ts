import { createStoreCore } from './core';
import {
  DeepReadonly,
  Deferred,
  OptionsForMakingAComponentStore,
  OptionsForMakingAnApplicationStore,
  SelectorFromAComponentStore,
  SelectorFromAStore,
  SelectorFromAStoreEnforcingTags,
  StoreForAComponent,
  Trackability,
} from './shapes-external';
import { OptionsForCreatingInternalApplicationStore, StoreForAComponentInternal } from './shapes-internal';
import { errorMessages } from './shared-consts';
import { libState } from './shared-state';
import { isEmpty } from './shared-utils';

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
): SelectorFromAComponentStore<L> {
  // If the instanceName is set to deferred, then deal with that scenario
  if (options.instanceName === Deferred) {
    const nStore = createStoreCore<L, 'untagged'>({
      state,
    });
    const select = (<C = L>(selector?: (arg: L) => C) => {
      const cStore: StoreForAComponentInternal<L, C> = selector ? nStore(selector as any) : nStore();
      cStore.isComponentStore = true;
      cStore.detachFromApplicationStore = () => { /* This is a no-op */ };
      cStore.setInstanceName = (instanceName: string) => {
        if (options.instanceName !== Deferred) { throw new Error(errorMessages.CANNOT_CHANGE_INSTANCE_NAME); }
        createComponentStoreInternal(select().read(), { ...options, instanceName });
        options.instanceName = instanceName;
        // get all changeListeners from component store and set them on container store
        Array.from(((nStore() as any).storeState.changeListeners as Map<(ar: any) => any, (arg: any) => any>).entries())
          .forEach(([performAction, selector]) =>
            libState.applicationStore!(s => selector(s.components[options.componentName][options.instanceName])).onChange(performAction))
      }
      if (options.instanceName !== Deferred) {
        return getComponentStoreWithinContainerStore(state, options, selector);
      } else {
        return cStore as StoreForAComponent<C>;
      }
    });
    return select as SelectorFromAComponentStore<L>;
  }

  if (!libState.applicationStore) {
    return createDetatchedComponentStore(state, options);
  }

  return createComponentStoreInternal(state, options as OptionsForMakingAComponentStore);
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

function getComponentStoreWithinContainerStore<L, C = L>(
  state: L,
  options: OptionsForMakingAComponentStore,
  selector?: (arg: L) => C
) {
  const cStore = libState.applicationStore!(s => {
    const nState = s.components[options.componentName][options.instanceName!];
    return selector ? selector(nState) : nState;
  }) as any as StoreForAComponentInternal<L, C>;
  cStore.reset = cStore.defineReset(state, selector);
  cStore.isComponentStore = true;
  cStore.detachFromApplicationStore = () => {
    if (!libState.applicationStore) { return; }
    const state = libState.applicationStore().read().components[options.componentName];
    if ((Object.keys(state).length === 1) && state[options.instanceName!]) {
      libState.applicationStore(s => s.components[options.componentName]).remove();
    } else {
      libState.applicationStore(s => s.components[options.componentName][options.instanceName]).remove();
    }
  }
  return cStore as StoreForAComponent<C>;
}

function createDetatchedComponentStore<L>(
  state: L,
  options: OptionsForMakingAComponentStore,
) {
  const devtoolsStoreName = `${options.componentName} : ${options.instanceName as string}`;
  const nStore = createStoreCore<L, 'untagged'>({
    state,
    devtools: options.devtools ? { ...options.devtools, name: options.devtools.name || devtoolsStoreName } : { name: devtoolsStoreName },
  });
  const get = (<C = L>(selector?: (arg: DeepReadonly<L>) => C) => {
    const cStore = selector ? nStore(selector) : nStore();
    cStore.isComponentStore = true;
    cStore.detachFromApplicationStore = () => { /* This is a no-op */ };
    cStore.setInstanceName = () => { /* This is a no-op */ }
    return cStore as StoreForAComponent<C>;
  });
  return get as SelectorFromAComponentStore<L>;
}

function createComponentStoreInternal<L>(
  state: L,
  options: OptionsForMakingAComponentStore,
) {
  // At this point, we've established that an app-store exists
  const containerStore = libState.applicationStore!();
  const wrapperState = containerStore.read();

  // If a component store with the same componentName and instanceName has not been added to the app-store, then add it now
  const thisComponentStoreHasNotBeenAttachedToTheAppStoreYet = isEmpty(wrapperState.components)
    || isEmpty(wrapperState.components[options.componentName])
    || isEmpty(wrapperState.components[options.componentName][options.instanceName!])
  if (thisComponentStoreHasNotBeenAttachedToTheAppStoreYet) {
    if (['number', 'boolean', 'string'].some(type => typeof (wrapperState) === type) || Array.isArray(wrapperState)) {
      throw new Error(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
    }
    libState.applicationStore!(s => s.components[options.componentName][options.instanceName]).replace(state);
  }
  return (<C = L>(selector?: (arg: L) => C) => getComponentStoreWithinContainerStore(state, options, selector)) as SelectorFromAComponentStore<L>;
}
