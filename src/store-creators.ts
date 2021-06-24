import { createStoreCore } from './core';
import {
  Deferred,
  OptionsForMakingAGlobalStore,
  OptionsForMakingANestedStore,
  SelectorFromANestedStore,
  SelectorFromAStore,
  SelectorFromAStoreEnforcingTags,
  SelectorReader,
  SelectorReaderNested,
  StoreWhichIsNested,
  Trackability,
  Unsubscribable,
} from './shapes-external';
import { OptionsForCreatingInternalRootStore, StoreWhichIsNestedInternal } from './shapes-internal';
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
 * const store = createGlobalStoreEnforcingTags({ prop: '' });
 * 
 * // Note that when updating state, we are now required to supply a string as the last argument (in this case 'MyComponent')
 * store.get(s => s.prop)                // type: 'prop.replace() [MyComponent]'
 *   .replace('test', 'MyComponent')  // replacement: 'test'
 */
export function createGlobalStoreEnforcingTags<S>(
  state: S,
  options: OptionsForMakingAGlobalStore = {},
) {
  return createGlobalStoreInternal<S, 'tagged'>(state, { ...options, enforcesTags: true }) as SelectorReader<S, SelectorFromAStoreEnforcingTags<S>>;
}

/**
 * Creates a new application-wide store
 * @param state the initial state
 * @param options some additional configuration options
 * 
 * @example
 * const store = createGlobalStore({ todos: Array<{ id: number, text: string }>() });
 */
export function createGlobalStore<S>(
  state: S,
  options: OptionsForMakingAGlobalStore = {},
) {
  return createGlobalStoreInternal<S, 'untagged'>(state, { ...options, enforcesTags: false }) as SelectorReader<S, SelectorFromAStore<S>>;
}

/**
 * Creates a new store which is nestable within inside your application store.
 * If you have already created an application store then this store will be automatically nested within that store, under the property `nested`.
 * If the opposite is true, then a new top-level store will be registered within the devtools
 * @param state The initial state
 * @param options A configuration object which, at minimum, must contain the `componentName` of the nested store
 * 
 * @example
 * const store = creatNestedStore({
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
  options: OptionsForMakingANestedStore,
) {
  // If the instanceName is set to deferred, then deal with that scenario
  if (options.instanceName === Deferred) {
    const nStore = createStoreCore<L, 'untagged'>({
      state,
      devtools: (!libState.nestedContainerStore || options.dontTrackWithDevtools) ? false : {
        name: options.componentName
      }
    }) as SelectorReader<L, SelectorFromANestedStore<L>>;
    const changeListeners = new Map<(ar: any) => any, (arg: L) => any>();
    const subscriptions = new Array<Unsubscribable>();
    const get = (<C = L>(selector?: (arg: L) => C) => {
      const cStore = selector ? nStore.get(selector as any) : nStore.get();
      (cStore as any).isNested = true;
      const onChange = (performAction: (v?: any) => any) => {
        subscriptions.push(cStore.onChange(performAction));
        changeListeners.set(performAction, selector || (e => e));
        return { unsubscribe: () => changeListeners.delete(performAction) };
      };
      return {
        ...cStore, onChange
      } as any as StoreWhichIsNested<C>
    });
    const read = () => get().read();
    const detachFromGlobalStore = () => { /* This is a no-op */ };
    const setInstanceName = (instanceName: string) => {
      if (options.instanceName !== Deferred) { throw new Error(errorMessages.CANNOT_CHANGE_INSTANCE_NAME); }
      Object.assign(result, createNestedStoreInternal(read(), { ...options, instanceName }));
      subscriptions.forEach(s => s.unsubscribe());
      options.instanceName = instanceName;
      Array.from(changeListeners.entries())
        .forEach(([key, val]) => libState.nestedContainerStore!(s => val(s.nested[options.componentName][options.instanceName]))
          .onChange(key));
      changeListeners.clear();
    }
    let result = { get, read, detachFromGlobalStore, setInstanceName } as SelectorReaderNested<L, SelectorFromANestedStore<L>>;
    return result;
  }

  // If there is no global store, then create a new top-level store
  if (!libState.nestedContainerStore) {
    const nStore = createStoreCore<L, 'untagged'>({
      state,
      devtools: options.dontTrackWithDevtools ? false : {
        name: options.componentName + ' : ' + options.instanceName
      }
    }) as SelectorReader<L, SelectorFromANestedStore<L>>;
    const get = (<C = L>(selector?: (arg: L) => C) => {
      const cStore = selector ? nStore.get(selector as any) : nStore.get();
      (cStore as any).isNested = true;
      return cStore as any as StoreWhichIsNested<C>;
    });
    const read = () => get().read();
    const detachFromGlobalStore = () => { /* This is a no-op */ };
    return { get, read, detachFromGlobalStore } as SelectorReaderNested<L, SelectorFromANestedStore<L>>;
  }

  return createNestedStoreInternal(state, options as OptionsForMakingANestedStore);
}

function createGlobalStoreInternal<S, T extends Trackability>(
  state: S,
  options: OptionsForCreatingInternalRootStore,
) {
  const store = createStoreCore<S, T>({
    state, devtools: options.devtools === undefined ? {} : options.devtools,
    tagSanitizer: options.tagSanitizer, tagsToAppearInType: options.tagsToAppearInType
  });
  libState.nestedContainerStore = store.get as any;
  return store;
}

function createNestedStoreInternal<L>(
  state: L,
  options: OptionsForMakingANestedStore,
) {
  // At this point, we've established that an app-store exists
  const containerStore = libState.nestedContainerStore!();
  const wrapperState = containerStore.read();

  // If a nested store with the same componentName and instanceName has not been added to the app-store, then add it now
  const thisNestedStoreHasNotBeenAttachedToTheAppStoreYet = isEmpty(wrapperState.nested)
    || isEmpty(wrapperState.nested[options.componentName])
    || isEmpty(wrapperState.nested[options.componentName][options.instanceName!])
  if (thisNestedStoreHasNotBeenAttachedToTheAppStoreYet) {
    if (!wrapperState.nested) {
      if (['number', 'boolean', 'string'].some(type => typeof (wrapperState) === type) || Array.isArray(wrapperState)) {
        throw new Error(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
      }
      containerStore.patch({
        nested: {
          [options.componentName]: {
            [options.instanceName!]: state
          }
        }
      });
      containerStore.renew({
        ...wrapperState,
        nested: {
          [options.componentName]: {
            [options.instanceName!]: state
          }
        }
      });
    } else if (!wrapperState.nested[options.componentName]) {
      libState.nestedContainerStore!(s => s.nested).patch({
        [options.componentName]: {
          [options.instanceName!]: state
        }
      });
      containerStore.renew({
        ...wrapperState,
        nested: {
          ...wrapperState.nested,
          [options.componentName]: {
            [options.instanceName!]: state
          }
        }
      });
    } else {
      libState.nestedContainerStore!(s => s.nested[options.componentName]).patch({
        [options.instanceName!]: state
      });
      containerStore.renew({
        ...wrapperState,
        nested: {
          ...wrapperState.nested,
          [options.componentName]: {
            ...wrapperState.nested[options.componentName],
            [options.instanceName!]: state
          }
        }
      });
    }
  }
  const get = (<C = L>(selector?: (arg: L) => C) => {
    const cStore = libState.nestedContainerStore!(s => {
      const nState = s.nested[options.componentName][options.instanceName!];
      return selector ? selector(nState) : nState;
    }) as any as StoreWhichIsNestedInternal<L, C>;
    cStore.reset = cStore.defineReset(state, selector);
    cStore.isNested = true;
    return cStore as StoreWhichIsNested<C>;
  });
  const detachFromGlobalStore = () => {
    if (!libState.nestedContainerStore) { return; }
    const state = libState.nestedContainerStore().read().nested[options.componentName];
    if ((Object.keys(state).length === 1) && state[options.instanceName!]) {
      libState.nestedContainerStore(s => s.nested).remove(options.componentName);
    } else {
      libState.nestedContainerStore(s => s.nested[options.componentName]).remove(options.instanceName!);
    }
  }
  const read = () => get().read();
  return { get, read, detachFromGlobalStore } as SelectorReaderNested<L, SelectorFromANestedStore<L>>;
}
