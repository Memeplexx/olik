import {
  DeepReadonly,
  Selector,
  StoreForAnArrayCommon,
  StoreForAnArrayOfObjects,
  StoreForAnObject,
  StoreForANumber,
  StoreOrDerivation,
  StoreWhichIsResettable,
  Trackability,
  UpdateAtIndex,
  UpdateOptions,
} from './shapes-external';
import { CoreActionsState, StoreState } from './shapes-internal';
import { deepCopy, isEmpty, readSelector, validateSelectorFn } from './shared-utils';
import { performStateUpdate, processStateUpdateRequest } from './store-updaters';
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
  () => selector(currentState())
) as StoreOrDerivation<C>['read'];

export const reset = <S, C, X extends C & Array<any>, T extends Trackability>(
  context: CoreActionsState<S, C, X>,
) => (
  updateOptions => replace({ ...context, name: 'reset' })(context.selector(context.initialState), updateOptions as UpdateOptions<T, any>)
) as StoreWhichIsResettable<C, T>['reset'];

export const replaceAll = <S, C, X extends C & Array<any>, T extends Trackability>(
  context: CoreActionsState<S, C, X>,
) => (
  (replacement, updateOptions) => replace({ ...context, name: 'replaceAll' })(replacement as X, updateOptions as UpdateOptions<T, any>)
) as StoreForAnArrayCommon<X, T>['replaceAll'];

export const patchAll = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X>,
) => ((payload, updateOptions) => {
  validateSelector(arg);
  return processStateUpdateRequest<S, C, X>({
    ...arg,
    updateOptions,
    actionNameSuffix: `patchAll()`,
    payload,
    replacer: (old, payload) => old.map(o => ({...o, ...payload})),
    getPayload: payload => ({ patch: payload }),
  });
}) as StoreForAnArrayCommon<X, T>['patchAll'];

export const removeAll = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X>,
) => (updateOptions => {
  validateSelector(arg);
  const pathSegments = readSelector(arg.selector);
  performStateUpdate({
    ...arg,
    selector: arg.selector,
    replacer: () => [],
    actionName: `${!pathSegments.length ? '' : pathSegments.join('.') + '.'}removeAll()`,
    updateOptions: updateOptions as {},
  });
}) as StoreForAnArrayCommon<X, T>['removeAll'];

export const insertIntoArray = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X>,
) => ((payload, updateOptions: UpdateAtIndex = {}) => {
  validateSelector(arg);
  return processStateUpdateRequest<S, C, X>({
    ...arg,
    updateOptions,
    actionNameSuffix: `insert()`,
    payload,
    replacer: (old, payload) => {
      const input = deepCopy(Array.isArray(payload) ? payload : [payload]);
      return (!isEmpty(updateOptions.atIndex)) ? [...old.slice(0, updateOptions.atIndex), ...input, ...old.slice(updateOptions.atIndex)] : [...old, ...input];
    },
    getPayload: payload => (!isEmpty(updateOptions.atIndex))
      ? { insertion: payload, atIndex: updateOptions.atIndex }
      : { insertion: payload },
  });
}) as StoreForAnArrayCommon<X, T>['insert'];

export const patchOrInsertIntoObject = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X> & { type: 'patch' | 'insert', },
) => ((payload, updateOptions) => {
  validateSelector(arg);
  return processStateUpdateRequest({
    ...arg,
    payload,
    updateOptions,
    actionNameSuffix: `${arg.type}()`,
    replacer: (old, payload) => ({ ...old, ...payload }),
    getPayload: payload => arg.type === 'patch'
      ? { patch: payload }
      : { insertion: payload }
  });
}) as StoreForAnObject<C, T>['patch'];

export const remove = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X>,
) => ((payload, updateOptions) => {
  validateSelector(arg);
  return processStateUpdateRequest({
    ...arg,
    updateOptions,
    actionNameSuffix: `remove()`,
    payload,
    replacer: (old, payload) => { const res = Object.assign({}, old); delete (res as any)[payload]; return res; },
    getPayload: payload => ({ toRemove: payload }),
  });
}) as StoreForAnObject<C, T>['remove'];

export const increment = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X>,
) => ((payload, updateOptions) => {
  validateSelector(arg);
  return processStateUpdateRequest({
    ...arg,
    updateOptions,
    actionNameSuffix: `increment()`,
    payload,
    replacer: (old, payload) => (old as any as number) + (payload as any as number),
    getPayload: payload => ({ incrementBy: payload }),
  });
}) as StoreForANumber<T>['increment'];

export const deepMerge = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X>,
) => ((
  payload: C | (() => Promise<C>),
  updateOptions: UpdateOptions<T, any>,
) => {
  validateSelector(arg);
  return processStateUpdateRequest({
    ...arg,
    payload,
    updateOptions,
    actionNameSuffix: `deepMerge()`,
    replacer: (old, payload) => {
      const isObject = (item: any) => (item && typeof item === 'object' && !Array.isArray(item));
      const mergeDeep = (target: any, source: any) => {
        let output = Object.assign({}, target);
        if (isObject(target) && isObject(source)) {
          Object.keys(source).forEach(key => {
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
    getPayload: payload => ({
      toMerge: payload,
    }),
  });
}) as StoreForAnObject<C, T>['deepMerge'];

export const upsertMatching = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X>
) => (getProp => {
  validateSelector(arg);
  return {
    with: (payload, updateOptions) => {
      validateSelector(arg);
      const segs = !getProp ? [] : readSelector(getProp);
      let replacementCount = 0;
      let insertionCount = 0;
      return processStateUpdateRequest({
        ...arg,
        updateOptions,
        actionNameSuffix: `upsertMatching(${segs.join('.')}).with()`,
        payload,
        getPayload: () => null,
        getPayloadFn: () => ({
          argument: payload,
          replacementCount,
          insertionCount,
        }),
        replacer: (old, payload) => {
          const payloadFrozenArray: X[0][] = Array.isArray(payload) ? payload : [payload];
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
      });
    }
  };
}) as StoreForAnArrayOfObjects<X, T>['upsertMatching'];

export const replace = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X> & { name: string },
) => (
  payload: C | (() => Promise<C>),
  updateOptions: UpdateOptions<T, any>,
  ) => {
    validateSelector(arg);
    const pathSegments = readSelector(arg.selector);
    return processStateUpdateRequest({
      ...arg,
      updateOptions,
      actionNameSuffix: `${arg.name}()`,
      payload,
      pathSegments: pathSegments.slice(0, pathSegments.length - 1),
      getPayload: (payload) => ({ replacement: payload }),
      replacer: (old, payload) => {
        if (!pathSegments.length) { return payload; }
        const lastSeg = pathSegments[pathSegments.length - 1];
        if (Array.isArray(old)) { return (old as Array<any>).map((o, i) => i === +lastSeg ? payload : o); }
        return ({ ...old, [lastSeg]: payload });
      },
    });
  };

export function invalidateCache<S, C, X extends C & Array<any>>(
  selector: Selector<S, C, X>,
  select: (selector?: (s: DeepReadonly<S>) => C) => any,
) {
  const segs = readSelector(selector);
  const pathSegs = segs.join('.');
  transact(...Object.keys(select().read().cacheTTLs).filter(key => key.startsWith(pathSegs))
    .map(key => () => select(s => (s as any).cacheTTLs).remove(key)));
}

const validateSelector = <S, C, X extends C & Array<any>>(
  arg: {
    selector: Selector<S, C, X>,
    isComponentStore: () => boolean,
    storeState: StoreState<S>
  },
) => {
  if (arg.isComponentStore()) { arg.storeState.bypassSelectorFunctionCheck = true; }
  validateSelectorFn('get', arg.storeState, arg.selector);
  if (arg.isComponentStore()) { arg.storeState.bypassSelectorFunctionCheck = false; }
}
