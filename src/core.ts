import { augmentations, booleanNumberString, errorMessages, libState } from './constant';
import { readState } from './read';
import { OptionsForMakingAStore, OptionsForMakingANestedStore, StateAction, Store, StoreAugment, DetachStore } from './type';
import { StoreInternals } from './type-internal';
import { deepFreeze } from './utility';
import { processPotentiallyAsyncUpdate } from './write';
import { setNewStateAndNotifyListeners } from './write-complete';

export function createStore<S>(
  args: OptionsForMakingAStore<S> & OptionsForMakingANestedStore
): Store<S> & (S extends never ? {} : StoreAugment<S>) & DetachStore;

export function createStore<S>(
  args: OptionsForMakingAStore<S>
): Store<S> & (S extends never ? {} : StoreAugment<S>)

export function createStore<S>(
  args: OptionsForMakingAStore<S> & OptionsForMakingANestedStore
): Store<S> & (S extends never ? {} : StoreAugment<S>) {
  validateState(args.state);
  removeStaleCacheReferences(args.state);
  const internals = {
    storeName: args.name,
    state: JSON.parse(JSON.stringify(args.state)),
    changeListeners: [],
    currentAction: { type: '' },
    batchedAction: {
      type: '',
      payloads: [],
      timeoutHandle: 0,
    },
  } as StoreInternals<S>;
  const recurseProxy = (s: any, topLevel: boolean, stateActions: StateAction[]): any => {
    if (typeof s !== 'object') { return null; }
    return new Proxy(s, {
      get: (target, dollarProp: string) => {
        const prop = dollarProp.startsWith('$') ? dollarProp.split('$')[1] : dollarProp;
        stateActions = topLevel ? new Array<StateAction>() : stateActions;
        if ('$internals' === dollarProp) {
          return internals;
        } else if (topLevel && !!internals.nestedStoreInfo?.isNested) {
          const { nestedStoreInfo: { containerName, instanceId, nestedStoreName } } = internals;
          return '$detachStore' === dollarProp
            ? () => libState.detachNestedStore?.(internals)
            : libState.stores[containerName].nested[nestedStoreName][instanceId][dollarProp];
        } else if (topLevel && internals.mergedStoreInfo?.isMerged) {
          return (libState.stores[internals.mergedStoreInfo.nameOfStoreToMergeInto] as any)[dollarProp];
        } else if (updateFunctions.includes(dollarProp)) {
          return processPotentiallyAsyncUpdate({ storeName: internals.storeName, stateActions, prop });
        } else if ('$invalidateCache' === dollarProp) {
          return () => {
            const actionType = stateActions.map(sa => sa.actionType).join('.');
            const newStateActions = [
              { type: 'property', name: 'cache', actionType: 'cache' },
              { type: 'property', name: actionType, actionType },
              { type: 'action', name: 'remove', actionType: 'remove()' },
            ] as StateAction[];
            try {
              setNewStateAndNotifyListeners({ storeName: internals.storeName, stateActions: newStateActions });
            } catch (e) {
              /* This can happen if a cache has already expired */
            }
          }
        } else if ('$repsertMatching' === dollarProp) {
          stateActions.push({ type: 'repsertMatching', name: prop, actionType: prop });
          return recurseProxy({}, false, stateActions);
        } else if ('$state' === dollarProp) {
          return deepFreeze(readState({ state: internals.state, stateActions: [...stateActions, { type: 'action', name: prop }], cursor: { index: 0 } }));
        } else if ('$onChange' === dollarProp) {
          return (listener: (arg: any) => any) => {
            const stateActionsCopy = [...stateActions, { type: 'action', name: prop }] as StateAction[];
            const unsubscribe = () => internals.changeListeners.splice(internals.changeListeners.findIndex(e => e === element), 1);
            const element = { actions: stateActionsCopy, listener, unsubscribe };
            internals.changeListeners.push(element);
            return { unsubscribe }
          }
        } else if (andOr.includes(dollarProp)) {
          stateActions.push({ type: 'searchConcat', name: prop, actionType: prop });
          return recurseProxy({}, false, stateActions);
        } else if (comparators.includes(dollarProp)) {
          return (arg: any) => {
            stateActions.push({ type: 'comparator', name: prop, arg, actionType: `${prop}(${arg})` });
            return recurseProxy({}, false, stateActions);
          }
        } else if (findFilter.includes(dollarProp)) {
          stateActions.push({ type: 'search', name: prop, actionType: prop });
          return recurseProxy({}, false, stateActions);
        } else if ('$detachStore' === dollarProp) {
          return () => null; // noop: for stores which could not be nested
        } else if (augmentations.selection[dollarProp]) {
          return augmentations.selection[dollarProp](recurseProxy({}, false, stateActions));
        } else if (augmentations.core[dollarProp]) {
          return augmentations.core[dollarProp](recurseProxy({}, false, stateActions));
        } else {
          stateActions.push({ type: 'property', name: prop, actionType: prop });
          return recurseProxy({}, false, stateActions);
        }
      }
    });
  };
  const store = recurseProxy({}, true, []);
  libState.stores[args.name] = store;
  if (libState.reduxDevtools) {
    libState.reduxDevtools.init(internals.storeName);
  }
  if (args.nestStore) {
    if (!libState.nestStore) { throw new Error(errorMessages.NESTED_STORES_NOT_ENABLED); }
    return libState.nestStore({ storeName: internals.storeName, containerName: args.nestStore.hostStoreName, instanceId: args.nestStore.instanceId });
  } else {
    store.$state = args.state;
    store.$onChange((state: any) => store.state = state);
    return libState.stores[args.name] as any;
  }
}

const updateFunctions = ['$replace', '$patch', '$deepMerge', '$remove', '$insert', '$add', '$subtract', '$clear', '$insertOne', '$insertMany', '$withOne', '$withMany'];
const comparators = ['$eq', '$ne', '$in', '$ni', '$gt', '$gte', '$lt', '$lte', '$match'];
const andOr = ['$and', '$or'];
const findFilter = ['$find', '$filter'];

export const validateState = (state: any) => {
  const throwError = (illegal: any) => {
    throw new Error(errorMessages.INVALID_STATE_INPUT(illegal));
  };
  if (
    state !== null
    && !booleanNumberString.some(type => typeof state === type)
  ) {
    if (!Array.isArray(state)) {
      if (typeof state !== "object") {
        throwError(state);
      }
      const proto = Object.getPrototypeOf(state);
      if (proto != null && proto !== Object.prototype) {
        throwError(state);
      }
    }
    Object.keys(state).forEach(key => {
      if (key.startsWith('$')) {
        throw new Error(errorMessages.DOLLAR_USED_IN_STATE);
      }
      validateState(state[key]);
    });
  }
}

export const removeStaleCacheReferences = (state: any) => {
  if (!state.cache) { return; }
  for (let key in state.cache) {
    if (new Date(state.cache[key]).getTime() <= Date.now()) {
      delete state.cache[key];
    }
  }
}