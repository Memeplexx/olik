import { devtoolsDebounce } from './consts';
import { integrateStoreWithReduxDevtools } from './devtools';
import { DeepReadonly, EnhancerOptions, Store } from './shape';
import { tests } from './tests';
import { copyObject, createPathReader, deepCopy, deepFreeze, validateState } from './utils';
/**
 * Creates a new store which, for typescript users, requires that users supply an additional 'tag' when performing a state update.
 * These tags can improve the debugging experience by describing the source of an update event, for example the name of the component an update was trigger from.
 * @param nameOrDevtoolsConfig takes either a string, or an object
 * @param state the initial state  
 * 
 * FOR EXAMPLE:
 * ```
 * const store = makeEnforceTags('store', { todos: Array<{ id: number, text: string }>() });
 * 
 * // Note that when updating state, we are now required to supply a string as the last argument (in this case 'TodoDetailComponent')
 * store(s => s.todos)
 *   .patchWhere(t => t.id === 1)
 *   .with({ text: 'bake cookies' }, 'TodoDetailComponent')
 * ```
 */
export function makeEnforceTags<S>(nameOrDevtoolsConfig: string | false | EnhancerOptions, state: S, tagSanitizer?: (tag: string) => string) {
  return makeInternal(nameOrDevtoolsConfig, state, true, tagSanitizer) as any as <C = S>(selector?: (s: DeepReadonly<S>) => C) => Store<S, C, true>;
}

/**
 * Creates a new store
 * @param nameOrDevtoolsConfig takes either a string, or an object
 * @param state the initial state
 * 
 * FOR EXAMPLE:
 * ```
 * const store = make('store', { todos: Array<{ id: number, text: string }>() });
 * ```
 */
export function make<S>(nameOrDevtoolsConfig: string | false | EnhancerOptions, state: S) {
  return makeInternal(nameOrDevtoolsConfig, state, false) as any as <C = S>(selector?: (s: DeepReadonly<S>) => C) => Store<S, C, false>;
}

function makeInternal<S>(nameOrDevtoolsConfig: string | false | EnhancerOptions, state: S, supportsTags: boolean, tagSanitizer?: (tag: string) => string) {
  validateState(state);
  const changeListeners = new Map<(ar: any) => any, (arg: S) => any>();
  const pathReader = createPathReader(state);
  let currentState = deepFreeze(state) as S;
  const initialState = currentState;
  let devtoolsDispatchListener: ((action: { type: string, payload?: any }) => any) | undefined;
  const setDevtoolsDispatchListener = (listener: (action: { type: string, payload?: any }) => any) => devtoolsDispatchListener = listener;
  const replace = <C>(selector: (s: S) => C, name: string) => (assignment: C, tag?: string) => {
    const isRootUpdate = !pathReader.readSelector(selector).length;
    if (isRootUpdate) {
      updateState<C>(selector, Array.isArray(currentState) ? `replaceAll()` : `replaceWith()`, assignment,
        old => deepCopy(assignment),
        old => {
          if (Array.isArray(old)) {
            old.length = 0; Object.assign(old, assignment);
          } else if (typeof (old) === 'boolean' || typeof (old) === 'number') {
            pathReader.mutableStateCopy = assignment;
          } else {
            Object.assign(old, assignment);
          }
        }, { overrideActionName: true, tag });
      return;
    }
    const pathSegments = pathReader.pathSegments;
    const lastSeg = pathSegments[pathSegments.length - 1] || '';
    const segsCopy = pathSegments.slice(0, pathSegments.length - 1);
    const selectorRevised = (state: any) => {
      let res = state;
      segsCopy.forEach(seg => res = res[seg]);
      return res;
    }
    updateState<C>(selectorRevised, `${pathSegments.join('.')}.${name}()`, assignment,
      old => Array.isArray(old) ? old.map((o, i) => i === +lastSeg ? deepCopy(assignment) : o) : ({ ...old, [lastSeg]: deepCopy(assignment) }),
      old => old[lastSeg] = assignment, { overrideActionName: true, tag });
  };
  const action = <C, X extends C & ReadonlyArray<any>>(selector: (s: S) => C) => ({
    replaceWith: replace(selector, 'replaceWith'),
    replaceAll: replace(selector, 'replaceAll'),
    patchWith: (assignment: Partial<C>, tag?: string) => updateState<C>(selector, 'patchWith', assignment,
      old => ({ ...old, ...assignment }),
      old => Object.assign(old, assignment), { tag }),
    patchWhere: (where: (e: X) => boolean) => ({
      with: (assignment: Partial<X[0]>, tag?: string) => {
        const itemIndices = (selector(currentState) as any as X).map((e, i) => where(e) ? i : null).filter(i => i !== null);
        const pathSegments = pathReader.readSelector(selector);
        return updateState<C>(selector, `${pathSegments.join('.')}${pathSegments.length ? '.' : ''}${itemIndices.join(',')}.patchWhere()`,
          { patch: assignment, whereClause: where.toString() },
          old => (old as any[]).map((o, i) => itemIndices.includes(i) ? { ...o, ...assignment } : o),
          old => {
            (old as any[]).forEach((el, idx) => {
              if (itemIndices.includes(idx)) {
                Object.assign(old[idx], assignment);
              }
            })
          }, { overrideActionName: true, tag });
      }
    }),
    addAfter: (assignment: X[0][], tag?: string) => updateState<C>(selector, 'addAfter', assignment,
      old => [...old, ...deepCopy(assignment)],
      old => old.push(...assignment), { tag }),
    addBefore: (assignment: X[0][], tag?: string) => updateState<C>(selector, 'addBefore', assignment,
      old => [...deepCopy(assignment), ...old],
      old => old.unshift(...assignment), { tag }),
    removeFirst: (tag?: string) => updateState<C>(selector, 'removeFirst', (selector(currentState) as any as X).slice(1),
      old => old.slice(1, old.length),
      old => old.shift(), { tag }),
    removeLast: (tag?: string) => {
      const selection = selector(currentState) as any as X;
      updateState<C>(selector, 'removeLast', selection.slice(0, selection.length - 1),
        old => old.slice(0, old.length - 1),
        old => old.pop(), { tag });
    },
    removeAll: (tag?: string) => updateState<C>(selector, 'removeAll', null,
      () => [],
      old => old.length = 0, { tag }),
    removeWhere: (predicate: (arg: X[0]) => boolean, tag?: string) => {
      const itemIndices = (selector(currentState) as any as X).map((e, i) => predicate(e) ? i : null).filter(i => i !== null);
      const pathSegments = pathReader.readSelector(selector);
      return updateState<C>(selector, `${pathSegments.join('.')}${pathSegments.length ? '.' : ''}${itemIndices.join(',')}.removeWhere()`,
        { toRemove: (selector(currentState) as any as X).filter(predicate), whereClause: predicate.toString() },
        old => old.filter((o: any) => !predicate(o)),
        old => {
          const toRemove = old.filter(predicate);
          for (var i = 0; i < old.length; i++) {
            if (toRemove.includes(old[i])) {
              old.splice(i, 1);
              i--;
            }
          }
        }, { overrideActionName: true, tag });
    },
    upsertWhere: (criteria: (e: X[0]) => boolean) => ({
      with: (element: X[0], tag?: string) => {
        const itemIndices = (selector(currentState) as any as X).map((e, i) => criteria(e) ? i : null).filter(i => i !== null);
        if (itemIndices.length > 1) { throw new Error('Cannot upsert more than 1 element'); }
        return itemIndices.length
          ? (action(selector) as any).replaceWhere(criteria).with(element, tag)
          : (action(selector) as any).addAfter([element], tag);
      }
    }),
    replaceWhere: (criteria: (e: X[0]) => boolean) => ({
      with: (assignment: X[0], tag?: string) => {
        const itemIndices = (selector(currentState) as any as X).map((e, i) => criteria(e) ? i : null).filter(i => i !== null);
        const pathSegments = pathReader.readSelector(selector);
        return updateState<C>(selector, `${pathSegments.join('.')}${pathSegments.length ? '.' : ''}${itemIndices.join(',')}.replaceWhere()`,
          { replacement: assignment, whereClause: criteria.toString() },
          old => (old as any[]).map((o, i) => itemIndices.includes(i) ? deepCopy(assignment) : o),
          old => {
            (old as any[]).forEach((el, idx) => {
              if (itemIndices.includes(idx)) {
                old[idx] = assignment;
              }
            })
          }, { overrideActionName: true, tag });
      }
    }),
    reset: (tag?: string) => replace(selector, 'reset')(selector(initialState), tag),
    onChange: (performAction: (selection: C) => any) => {
      changeListeners.set(performAction, selector);
      return { unsubscribe: () => changeListeners.delete(performAction) };
    },
    read: () => deepFreeze(selector(currentState)),
    readInitial: () => selector(initialState),
    supportsTags,
  } as any as Store<S, C, any>);

  const storeResult = <C = S>(selector: ((s: DeepReadonly<S>) => C) = (s => s as any as C)) => {
    const selectorMod = selector as (s: S) => C;
    selectorMod(currentState);
    return action(selectorMod);
  };

  const previousAction: {
    timestamp: number,
    type: string,
    payloads: any[],
    debounceTimeout: number,
  } = {
    type: '',
    timestamp: 0,
    payloads: [],
    debounceTimeout: 0,
  };
  
  function updateState<C>(
    selector: (s: S) => C,
    actionName: string,
    payload: any,
    action: (newNode: any) => any,
    mutator: (newNode: any) => any,
    options: {
      overrideActionName?: boolean,
      tag?: string,
    } = {
        overrideActionName: false,
      },
  ) {
    const pathSegments = pathReader.readSelector(selector);
    const previousState = currentState;
    const result = Object.freeze(copyObject(currentState, { ...currentState }, pathSegments.slice(), action));
    mutator(selector(pathReader.mutableStateCopy));
    currentState = result;
    notifySubscribers(previousState, result);
    const actionToDispatch = {
      type: (options && options.overrideActionName ? actionName : ((pathSegments.join('.') + (pathSegments.length ? '.' : '') + actionName + '()')))
        + (options.tag ? ` [${tagSanitizer ? tagSanitizer(options.tag) : options.tag}]` : ''),
      payload,
    };
    tests.currentAction = actionToDispatch;
    tests.currentMutableState = pathReader.mutableStateCopy;
    if (devtoolsDispatchListener && (!options.tag || (options.tag !== 'dontTrackWithDevtools'))) {
      const dispatchToDevtools = (payload?: any[]) => {
        const action = payload ? { ...actionToDispatch, payload } : actionToDispatch;
        tests.currentActionForDevtools = action;
        devtoolsDispatchListener!(action);
      }
      if (previousAction.debounceTimeout) {
        window.clearTimeout(previousAction.debounceTimeout);
        previousAction.debounceTimeout = 0;
      }
      if (previousAction.type !== actionToDispatch.type) {
        previousAction.type = actionToDispatch.type;
        previousAction.payloads = [actionToDispatch.payload];
        dispatchToDevtools();
        previousAction.debounceTimeout = window.setTimeout(function () {
          previousAction.type = '';
          previousAction.payloads = [];
        }, devtoolsDebounce);
      } else {
        if (previousAction.timestamp < (Date.now() - devtoolsDebounce)) {
          previousAction.payloads = [actionToDispatch.payload];
        } else {
          previousAction.payloads.push(actionToDispatch.payload);
        }
        previousAction.timestamp = Date.now();
        previousAction.debounceTimeout = window.setTimeout(function () {
          dispatchToDevtools(previousAction.payloads);
          previousAction.type = '';
          previousAction.payloads = [];
        }, devtoolsDebounce);
      }
    }
  }

  function notifySubscribers(oldState: S, newState: S) {
    changeListeners.forEach((selector, subscriber) => {
      const selectedNewState = selector(newState);
      if (selector(oldState) !== selectedNewState) {
        subscriber(selectedNewState);
      }
    })
  }

  if (nameOrDevtoolsConfig !== false) {
    integrateStoreWithReduxDevtools<S>(storeResult as any, typeof (nameOrDevtoolsConfig) === 'string'
      ? { name: nameOrDevtoolsConfig } : nameOrDevtoolsConfig, setDevtoolsDispatchListener);
  }

  return storeResult;
}
