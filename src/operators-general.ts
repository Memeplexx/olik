import {
  DeepReadonly,
  Selector,
  StoreForAnArrayCommon,
  StoreForAnArrayOfObjects,
  StoreForAnObject,
  StoreOrDerivation,
  StoreWhichIsResettable,
  Tag,
  Trackability,
  UpdateOptions,
  UpdateOptionsInternal,
} from './shapes-external';
import { PathReader, UpdateStateFn } from './shapes-internal';
import { libState } from './shared-state';
import { copyPayload, createPathReader, deepCopy, deepFreeze, processAsyncPayload, toIsoString, validateSelectorFn } from './shared-utils';

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
  pathReader: PathReader<S>,
  updateState: UpdateStateFn<S, C, T, X>,
  selector: Selector<S, C, X>,
  initialState: S,
  isNested: () => boolean,
  storeResult: (selector?: (s: DeepReadonly<S>) => C) => any,
) => (
  updateOptions => replace(pathReader, updateState, selector, 'reset', isNested, storeResult)(selector(initialState), updateOptions)
) as StoreWhichIsResettable<C, T>['reset'];

export const replaceAll = <S, C, X extends C & Array<any>, T extends Trackability>(
  pathReader: PathReader<S>,
  updateState: UpdateStateFn<S, C, T, X>,
  selector: Selector<S, C, X>,
  isNested: () => boolean,
  storeResult: (selector?: (s: DeepReadonly<S>) => C) => any,
) => (
  (replacement, updateOptions) => replace(pathReader, updateState, selector, 'replaceAll', isNested, storeResult)(replacement as X, updateOptions as UpdateOptions<T, C, any>)
) as StoreForAnArrayCommon<X, T>['replaceAll'];

export const removeAll = <S, C, X extends C & Array<any>, T extends Trackability>(
  selector: Selector<S, C, X>,
  updateState: UpdateStateFn<S, C, T, X>,
  isNested: () => boolean,
) => (updateOptions => {
  validateSelector(selector, isNested);
  updateState({
    selector,
    replacer: () => [],
    mutator: old => old.length = 0,
    actionName: 'removeAll()',
    updateOptions,
  });
}) as StoreForAnArrayCommon<X, T>['removeAll'];

export const insert = <S, C, X extends C & Array<any>, T extends Trackability>(
  selector: Selector<S, C, X>,
  updateState: UpdateStateFn<S, C, T, X>,
  isNested: () => boolean,
  storeResult: (selector?: (s: DeepReadonly<S>) => C) => any,
  pathReader: PathReader<S>,
) => ((payload, updateOptions) => {
  validateSelector(selector, isNested);
  const processPayload = (payload: C) => {
    const { payloadFrozen, payloadCopied } = copyPayload(payload);
    updateState({
      selector,
      replacer: old => [...old, ...(deepCopy(Array.isArray(payloadFrozen) ? payloadFrozen : [payloadFrozen]))],
      mutator: old => old.push(...(Array.isArray(payloadCopied) ? payloadCopied : [payloadCopied])),
      actionName: 'insert()',
      payload: {
        insertion: payloadFrozen,
      },
      updateOptions: updateOptions as UpdateOptions<T, C, any>,
    });
  }
  return processAsyncPayload(selector, payload, pathReader, storeResult, processPayload, updateOptions as UpdateOptions<T, C, any>, 'insert()');
}) as StoreForAnArrayCommon<X, T>['insert'];

export const patch = <S, C, X extends C & Array<any>, T extends Trackability>(
  selector: Selector<S, C, X>,
  updateState: UpdateStateFn<S, C, T, X>,
  isNested: () => boolean,
  storeResult: (selector?: (s: DeepReadonly<S>) => C) => any,
  pathReader: PathReader<S>,
) => ((payload, updateOptions) => {
  validateSelector(selector, isNested);
  const processPayload = (payload: Partial<C>) => {
    const { payloadFrozen, payloadCopied } = copyPayload(payload);
    updateState({
      selector,
      replacer: old => ({ ...old, ...payloadFrozen }),
      mutator: old => Object.assign(old, payloadCopied),
      actionName: 'patch()',
      payload: {
        patch: payloadFrozen,
      },
      updateOptions: updateOptions as UpdateOptions<T, C, any>,
    });
  }
  return processAsyncPayload(selector, payload, pathReader, storeResult, processPayload, updateOptions as UpdateOptions<T, C, any>, 'patch()');
}) as StoreForAnObject<C, T>['patch'];

export const upsertMatching = <S, C, X extends C & Array<any>, T extends Trackability>(
  selector: Selector<S, C, X>,
  currentState: () => S,
  updateState: UpdateStateFn<S, C, T, X>,
  isNested: () => boolean,
  storeResult: (selector?: (s: DeepReadonly<S>) => C) => any,
  pathReader: PathReader<S>,
) => (getProp => {
  validateSelector(selector, isNested);
  return {
    with: (payload, updateOptions) => {
      validateSelector(selector, isNested);
      const processPayload = (payload: C) => {
        const segs = !getProp ? [] : createPathReader((selector(currentState()) as X)[0] || {}).readSelector(getProp);
        const { payloadFrozen, payloadCopied } = copyPayload(payload);
        const payloadFrozenArray: X[0][] = Array.isArray(payloadFrozen) ? payloadFrozen : [payloadFrozen];
        const payloadCopiedArray: X[0][] = Array.isArray(payloadCopied) ? payloadCopied : [payloadCopied];
        let replacementCount = 0;
        let insertionCount = 0;
        updateState({
          selector,
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
          mutator: old => {
            old.forEach((oe, oi) => { const found = payloadCopiedArray.find(ne => !getProp ? oe === ne : getProp(oe) === getProp(ne)); if (found) { old[oi] = deepCopy(found); } });
            payloadCopiedArray.filter(ne => !old.some(oe => !getProp ? oe === ne : getProp(oe) === getProp(ne))).forEach(ne => old.push(ne));
          },
          actionName: `upsertMatching(${segs.join('.')}).with()`,
          payload: null,
          getPayloadFn: () => ({
            argument: payloadFrozen,
            replacementCount,
            insertionCount,
          }),
          updateOptions: updateOptions as UpdateOptions<T, C, any>,
        });
      }
      return processAsyncPayload(selector, payload, pathReader, storeResult, processPayload, updateOptions as UpdateOptions<T, C, any>, 'upsertMatching()');
    }
  };
}) as StoreForAnArrayOfObjects<X, T>['upsertMatching'];

export const replace = <S, C, X extends C & Array<any>, T extends Trackability>(
  pathReader: PathReader<S>,
  updateState: UpdateStateFn<S, C, T, X>,
  selector: Selector<S, C, X>,
  name: string,
  isNested: () => boolean,
  storeResult: (selector?: (s: DeepReadonly<S>) => C) => any,
) => (payload: C | (() => Promise<C>), updateOptions: UpdateOptions<T, C, any>) => {
  validateSelector(selector, isNested);
  const processPayload = (payload: C) => replacePayload(pathReader, updateState, selector, name, payload as C, updateOptions);
  return processAsyncPayload(selector, payload, pathReader, storeResult, processPayload, updateOptions as UpdateOptions<T, C, any>, 'replace()');
};

export function replacePayload<S, C, X extends C & Array<any>, T extends Trackability>(
  pathReader: PathReader<S>,
  updateState: UpdateStateFn<S, C, T, X>,
  selector: Selector<S, C, X>,
  name: string,
  payload: C,
  updateOptions: UpdateOptions<T, C, any>
) {
  const pathSegments = pathReader.readSelector(selector);
  const { payloadFrozen, payloadCopied } = copyPayload(payload);
  let payloadReturnedByFn: C;
  let getPayloadFn = (() => payloadReturnedByFn ? { replacement: payloadReturnedByFn } : payloadReturnedByFn) as unknown as () => C;
  if (!pathSegments.length) {
    updateState({
      selector,
      replacer: old => payloadFrozen,
      mutator: old => {
        if (Array.isArray(old)) {
          (old as Array<any>).length = 0;
          Object.assign(old, payloadCopied);
        } else if (typeof (old) === 'boolean' || typeof (old) === 'number' || typeof (old) === 'string') {
          pathReader.mutableStateCopy = payloadCopied as any;
        } else {
          Object.assign(old, payloadCopied);
        }
      },
      actionName: `${name}()`,
      pathSegments: [],
      payload: {
        replacement: payloadFrozen,
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
        if (Array.isArray(old)) { return (old as Array<any>).map((o, i) => i === +lastSeg ? payloadFrozen : o); }
        return ({ ...old, [lastSeg]: payloadFrozen })
      },
      mutator: (old: Record<any, any>) => old[lastSeg] = payloadReturnedByFn || payloadCopied,
      actionName,
      actionNameOverride: true,
      pathSegments: segsCopy,
      payload: {
        replacement: payloadFrozen,
      },
      getPayloadFn,
      updateOptions,
    })
  }
}

export function stopBypassingPromises<S, C, X extends C & Array<any>>(
  pathReader: PathReader<S>,
  selector: Selector<S, C, X>,
  storeResult: (selector?: (s: DeepReadonly<S>) => C) => any,
) {
  pathReader.readSelector(selector);
  const pathSegs = pathReader.pathSegments.join('.');
  const patch = {} as { [key: string]: string };
  Object.keys(storeResult().read().promiseBypassTTLs)
    .filter(key => key.startsWith(pathSegs))
    .forEach(key => patch[key] = toIsoString(new Date()));
  storeResult(s => (s as any).promiseBypassTTLs).patch(patch);
}

const validateSelector = <S, C, X extends C & Array<any>>(
  selector: Selector<S, C, X>,
  isNested: () => boolean,
) => {
  if (isNested()) { libState.bypassSelectorFunctionCheck = true; }
  validateSelectorFn('select', selector);
  if (isNested()) { libState.bypassSelectorFunctionCheck = false; }
}
