import { augmentations, booleanNumberString, errorMessages, libState } from './constant';
import { readState } from './read';
import { OptionsForMakingAStore, StateAction, Store, StoreAugment } from './type';
import { StoreInternal, StoreInternals } from './type-internal';
import { deepFreeze } from './utility';
import { processPotentiallyAsyncUpdate } from './write';
import { setNewStateAndNotifyListeners } from './write-complete';

export function createStore<S>(
  args: OptionsForMakingAStore<S>
): Store<S> & (S extends never ? {} : StoreAugment<S>) {
  validateKeyedState(args);
  validateState(args.state);
  removeStaleCacheReferences(args.state);
  const internals = {
    state: JSON.parse(JSON.stringify(args.state)),
    changeListeners: [],
    currentAction: { type: '' },
    initialState: args.state,
  } as StoreInternals<S>;
  const recurseProxy = (s: any, topLevel: boolean, stateActions: StateAction[]): any => {
    if (typeof s !== 'object') { return null; }
    return new Proxy(s, {
      get: (target, dollarProp: string) => {
        if (typeof(dollarProp) === 'symbol') { return; }
        const prop = dollarProp.startsWith('$') ? dollarProp.split('$')[1] : dollarProp;
        stateActions = topLevel ? new Array<StateAction>() : stateActions;
        if ('$internals' === dollarProp) {
          return internals;
        } else if (topLevel && internals.mergedStoreInfo?.isMerged) {
          return (libState.store as any)[dollarProp];
        } else if (updateFunctions.includes(dollarProp)) {
          return processPotentiallyAsyncUpdate({ stateActions, prop });
        } else if ('$invalidateCache' === dollarProp) {
          return () => {
            const actionType = stateActions.map(sa => sa.actionType).join('.');
            const newStateActions = [
              { type: 'property', name: 'cache', actionType: 'cache' },
              { type: 'property', name: actionType, actionType },
              { type: 'action', name: 'delete', actionType: 'delete()' },
            ] as StateAction[];
            try {
              setNewStateAndNotifyListeners({ stateActions: newStateActions });
            } catch (e) {
              /* This can happen if a cache has already expired */
            }
          }
        } else if ('$mergeMatching' === dollarProp) {
          stateActions.push({ type: 'mergeMatching', name: prop, actionType: prop });
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
  if (args.key) {
    internals.state = {} as any;
    if (!libState.store) {
      libState.store = recurseProxy({}, true, []);
    }
    (libState.store as any)[args.key].$setNew(args.state);
    const innerStore = new Proxy({}, {
      get: (_, prop: string) => {
        if (prop === '$destroyStore') {
          return () => {
            const changeListeners = libState.store.$internals.changeListeners;
            changeListeners.filter(l => l.actions[0].name === args.key).forEach(l => l.unsubscribe());
            (libState.store as any)[args.key!].$delete();
            libState.detached.push(args.key!);
            libState.innerStores.delete(args.key!);
          }
        }
        return (libState.store as any)[args.key!][prop];
      }
    }) as any;
    libState.innerStores.set(args.key, innerStore);
    return innerStore;
  } else {
    if (libState.store) {
      (libState.store as any).$setNew(args.state);
      return libState.store as any;
    }
    return libState.store = recurseProxy({}, true, []);
  }
}

const updateFunctions = ['$set', '$setSome', '$setSomeDeep', '$delete', '$setNew', '$add', '$subtract', '$clear', '$push', '$withOne', '$withMany', '$toggle'];
const comparators = ['$eq', '$ne', '$in', '$ni', '$gt', '$gte', '$lt', '$lte', '$match'];
const andOr = ['$and', '$or'];
const findFilter = ['$find', '$filter'];

export const validateKeyedState = <S>(args: OptionsForMakingAStore<S>) => {
  if (!args.key) { return; }
  const state = libState.store?.$state;
  if (state === null || state === undefined) { return; }
  if ((booleanNumberString.some(type => typeof (state) === type) || Array.isArray(state))) {
    throw new Error(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
  }
  const initialStateOfHostStore = libState.store.$internals.initialState;
  if (initialStateOfHostStore[args.key] !== undefined) {
    throw new Error(errorMessages.KEY_ALREADY_IN_USE(args.key));
  }
}

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

// export const registerChangeListener = (listener: (arg: any) => any) => {
//   const stateActionsCopy = [...stateActions, { type: 'action', name: prop }] as StateAction[];
//   const unsubscribe = () => internals.changeListeners.splice(internals.changeListeners.findIndex(e => e === element), 1);
//   const element = { actions: stateActionsCopy, listener, unsubscribe };
//   internals.changeListeners.push(element);
//   return { unsubscribe }
// }