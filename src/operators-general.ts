import {
  DeepReadonly,
  Selector,
  StoreForAnArrayCommon,
  StoreForAnArrayOfObjects,
  StoreForAnObject,
  StoreOrDerivation,
  StoreWhichIsResettable,
  Trackability,
  UpdateAtIndex,
  UpdateOptions,
} from './shapes-external';
import { CoreActionsState, StoreState, UpdateStateFn } from './shapes-internal';
import {
  deepCopy,
  deepFreeze,
  isEmpty,
  processAsyncPayload,
  readSelector,
  validateSelectorFn,
} from './shared-utils';
import { transact } from './transact';

export const onChange = <S, C, X extends C & Array<any>>(
  selector: Selector<S, C, X>,
  changeListeners: Map<(ar: any) => any, (arg: S) => any>,
) => (performAction => {
  changeListeners.set(performAction, selector);
  return { unsubscribe: () => changeListeners.delete(performAction) };
}) as StoreOrDerivation<C>['onChange'];

export const read = <S, C, X extends C & Array<any>>(
  selector: Selector<S, C, X>,
  currentState: () => S,
) => (
  () => deepFreeze(selector(currentState()))
) as StoreOrDerivation<C>['read'];

export const reset = <S, C, X extends C & Array<any>, T extends Trackability>(
  context: CoreActionsState<S, C, X, T>,
) => (
  updateOptions => replace({ ...context, name: 'reset' })(context.selector(context.initialState), updateOptions as UpdateOptions<T, any>)
) as StoreWhichIsResettable<C, T>['reset'];

export const replaceAll = <S, C, X extends C & Array<any>, T extends Trackability>(
  context: CoreActionsState<S, C, X, T>,
) => (
  (replacement, updateOptions) => replace({ ...context, name: 'replaceAll' })(replacement as X, updateOptions as UpdateOptions<T, any>)
) as StoreForAnArrayCommon<X, T>['replaceAll'];

export const removeAll = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X, T>,
) => (updateOptions => {
  validateSelector(arg);
  arg.updateState({
    selector: arg.selector,
    replacer: () => [],
    actionName: 'removeAll()',
    updateOptions,
  });
}) as StoreForAnArrayCommon<X, T>['removeAll'];

export const insertIntoArray = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X, T>,
) => ((payload, updateOptions: UpdateAtIndex = {}) => {
  validateSelector(arg);
  return processAsyncPayload<S, C, X>({
    ...arg,
    updateOptions,
    suffix: 'insert()',
    payload,
    processPayload: (payload: C) => {
      arg.updateState({
        selector: arg.selector,
        replacer: old => {
          const input = deepCopy(Array.isArray(payload) ? payload : [payload]);
          return (!isEmpty(updateOptions.atIndex)) ? [...old.slice(0, updateOptions.atIndex), ...input, ...old.slice(updateOptions.atIndex)] : [...old, ...input];
        },
        actionName: 'insert()',
        payload: (!isEmpty(updateOptions.atIndex)) ? {
          insertion: payload,
          atIndex: updateOptions.atIndex
        } : {
          insertion: payload,
        },
        updateOptions: updateOptions as UpdateOptions<T, any>,
      });
    }
  });
}) as StoreForAnArrayCommon<X, T>['insert'];

export const patchOrInsertIntoObject = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X, T> & { type: 'patch' | 'insert', },
) => ((payload, updateOptions) => {
  validateSelector(arg);
  return processAsyncPayload({
    ...arg,
    payload,
    updateOptions,
    suffix: 'patch()',
    processPayload: (payload: Partial<C>) => {
      arg.updateState({
        selector: arg.selector,
        replacer: old => ({ ...old, ...payload }),
        actionName: `${arg.type}()`,
        payload: arg.type === 'patch' ? {
          patch: payload,
        } : {
          insertion: payload,
        },
        updateOptions,
      });
    }
  });
}) as StoreForAnObject<C, T>['patch'];

export const remove = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X, T>,
) => ((payload, updateOptions) => {
  validateSelector(arg);
  return processAsyncPayload({
    ...arg,
    updateOptions,
    suffix: 'remove()',
    payload,
    processPayload: (payload: any) => arg.updateState({
      selector: arg.selector,
      replacer: old => { const res = Object.assign({}, old); delete (res as any)[payload]; return res; },
      actionName: 'remove()',
      payload: {
        toRemove: payload,
      },
      updateOptions,
    })
  });
}) as StoreForAnObject<C, T>['remove'];

export const deepMerge = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X, T>,
) => ((
  payload: C | (() => Promise<C>),
  updateOptions: UpdateOptions<T, any>,
) => {
  validateSelector(arg);
  return processAsyncPayload({
    ...arg,
    payload,
    suffix: 'deepMerge()',
    updateOptions,
    processPayload: (payload: any) => arg.updateState({
      selector: arg.selector,
      replacer: old => {
        const isObject = <S>(item: S) => (item && typeof item === 'object' && !Array.isArray(item));
        const mergeDeep = <S>(target: S, source: S) => {
          let output = Object.assign({}, target);
          if (isObject(target) && isObject(source)) {
            (Object.keys(source) as Array<keyof S>).forEach(key => {
              if (isObject(source[key])) {
                if (!(key in target)) {
                  Object.assign(output, { [key]: source[key] });
                } else {
                  output[key] = mergeDeep(target[key], source[key]);
                }
              } else {
                Object.assign(output, { [key]: source[key] });
              }
            });
          }
          return output;
        }
        return mergeDeep(old, payload);
      },
      actionName: 'deepMerge()',
      payload: {
        toMerge: payload,
      },
      updateOptions,
    })
  });
}) as StoreForAnObject<C, T>['deepMerge'];

export const upsertMatching = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X, T>
) => (getProp => {
  validateSelector(arg);
  return {
    with: (payload, updateOptions) => {
      validateSelector(arg);
      return processAsyncPayload({
        ...arg,
        updateOptions,
        suffix: 'upsertMatching()',
        payload,
        processPayload: (payload: C) => {
          const segs = !getProp ? [] : readSelector(getProp);
          const payloadFrozenArray: X[0][] = Array.isArray(payload) ? payload : [payload];
          let replacementCount = 0;
          let insertionCount = 0;
          arg.updateState({
            selector: arg.selector,
            replacer: old => {
              const replacements = old.map(oe => {
                const found = payloadFrozenArray.find(ne => !getProp ? oe === ne : getProp(oe) === getProp(ne));
                if (found !== null && found !== undefined) { replacementCount++; }
                return found || oe;
              });
              const insertions = payloadFrozenArray.filter(ne => !old.some(oe => !getProp ? oe === ne : getProp(oe) === getProp(ne)));
              insertionCount = insertions.length;
              return [
                ...replacements,
                ...insertions
              ];
            },
            actionName: `upsertMatching(${segs.join('.')}).with()`,
            payload: null,
            getPayloadFn: () => ({
              argument: payload,
              replacementCount,
              insertionCount,
            }),
            updateOptions: updateOptions as UpdateOptions<T, any>,
          });
        }
      });
    }
  };
}) as StoreForAnArrayOfObjects<X, T>['upsertMatching'];

export const replace = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X, T> & { name: string },
) => (
  payload: C | (() => Promise<C>),
  updateOptions: UpdateOptions<T, any>,
  ) => {
    validateSelector(arg);
    const processPayload = (payload: C) => replacePayload(arg.updateState, arg.selector, arg.name, payload as C, updateOptions);
    return processAsyncPayload({
      ...arg,
      processPayload,
      updateOptions,
      suffix: arg.name + '()',
      payload,
    });
  };

export function replacePayload<S, C, X extends C & Array<any>, T extends Trackability>(
  updateState: UpdateStateFn<S, C, T, X>,
  selector: Selector<S, C, X>,
  name: string,
  payload: C,
  updateOptions: UpdateOptions<T, any>
) {
  const pathSegments = readSelector(selector);
  let payloadReturnedByFn: C;
  let getPayloadFn = (() => payloadReturnedByFn ? { replacement: payloadReturnedByFn } : payloadReturnedByFn) as unknown as () => C;
  if (!pathSegments.length) {
    updateState({
      selector,
      replacer: old => payload,
      actionName: `${name}()`,
      pathSegments: [],
      payload: {
        replacement: payload,
      },
      getPayloadFn,
      updateOptions,
    });
  } else {
    const lastSeg = pathSegments[pathSegments.length - 1] || '';
    const segsCopy = pathSegments.slice(0, pathSegments.length - 1);
    const selectorRevised = (((state: S) => {
      let res = state as Record<any, any>;
      segsCopy.forEach(seg => res = res[seg]);
      return res;
    })) as Selector<S, C, X>;
    const actionName = `${pathSegments.join('.')}.${name}()`;
    updateState({
      selector: selectorRevised,
      replacer: old => {
        if (Array.isArray(old)) { return (old as Array<any>).map((o, i) => i === +lastSeg ? payload : o); }
        return ({ ...old, [lastSeg]: payload })
      },
      actionName,
      actionNameOverride: true,
      pathSegments: segsCopy,
      payload: {
        replacement: payload,
      },
      getPayloadFn,
      updateOptions,
    })
  }
}

export function stopBypassingPromises<S, C, X extends C & Array<any>>(
  selector: Selector<S, C, X>,
  storeResult: (selector?: (s: DeepReadonly<S>) => C) => any,
) {
  const segs = readSelector(selector);
  const pathSegs = segs.join('.');
  transact(...Object.keys(storeResult().read().promiseBypassTimes).filter(key => key.startsWith(pathSegs))
    .map(key => () => storeResult(s => (s as any).promiseBypassTimes).remove(key)));
}

const validateSelector = <S, C, X extends C & Array<any>>(
  arg: {
    selector: Selector<S, C, X>,
    isComponentStore: () => boolean,
    storeState: StoreState<S>
  },
) => {
  arg.storeState.selector = arg.selector;
  if (arg.isComponentStore()) { arg.storeState.bypassSelectorFunctionCheck = true; }
  validateSelectorFn('get', arg.storeState, arg.selector);
  if (arg.isComponentStore()) { arg.storeState.bypassSelectorFunctionCheck = false; }
}
