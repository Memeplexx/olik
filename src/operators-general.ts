import {
  FunctionReturning,
  Selector,
  StoreForAnArray,
  StoreForAnObject,
  StoreOrDerivation,
  StoreWhichIsResettable,
  Tag,
  Trackability,
} from './shapes-external';
import { PathReader, UpdateStateFn } from './shapes-internal';
import { errorMessages } from './shared-consts';
import { copyPayload, createPathReader, deepCopy, deepFreeze } from './shared-utils';

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
) => (
  tag => replace(pathReader, updateState, selector, 'reset')(selector(initialState), tag)
) as StoreWhichIsResettable<C, T>['reset'];

export const replaceAll = <S, C, X extends C & Array<any>, T extends Trackability>(
  pathReader: PathReader<S>,
  updateState: UpdateStateFn<S, C, T, X>,
  selector: Selector<S, C, X>,
) => (
  (replacement, tag) => replace(pathReader, updateState, selector, 'replaceAll')(replacement, tag)
) as StoreForAnArray<any, T>['replaceAll'];

export const removeAll = <S, C, X extends C & Array<any>, T extends Trackability>(
  selector: Selector<S, C, X>,
  updateState: UpdateStateFn<S, C, T, X>,
) => (tag => {
  updateState({
    selector,
    replacer: () => [],
    mutator: old => old.length = 0,
    actionName: 'removeAll()',
    tag,
  });
}) as StoreForAnArray<X, T>['removeAll'];

export const insert = <S, C, X extends C & Array<any>, T extends Trackability>(
  selector: Selector<S, C, X>,
  updateState: UpdateStateFn<S, C, T, X>,
) => ((payload, tag) => {
  const { payloadFrozen, payloadCopied } = copyPayload(payload);
  updateState({
    selector,
    replacer: old => [...old, ...(deepCopy(Array.isArray(payloadFrozen) ? payloadFrozen : [payloadFrozen]))],
    mutator: old => old.push(...(Array.isArray(payloadCopied) ? payloadCopied : [payloadCopied])),
    actionName: 'insert()',
    payload: {
      insertion: payloadFrozen,
    },
    tag,
  });
}) as StoreForAnArray<X, T>['insert'];

export const patch = <S, C, X extends C & Array<any>, T extends Trackability>(
  selector: Selector<S, C, X>,
  updateState: UpdateStateFn<S, C, T, X>,
) => ((payload, tag) => {
  const { payloadFrozen, payloadCopied } = copyPayload(payload);
  updateState({
    selector,
    replacer: old => ({ ...old, ...payloadFrozen }),
    mutator: old => Object.assign(old, payloadCopied),
    actionName: 'patch()',
    payload: {
      patch: payloadFrozen,
    },
    tag,
  });
}) as StoreForAnObject<C, T>['patch'];

export const replaceElseInsert = <S, C, X extends C & Array<any>, T extends Trackability>(
  selector: Selector<S, C, X>,
  currentState: () => S,
  updateState: UpdateStateFn<S, C, T, X>,
) => ((payload, tag) => {
  let matchCalled = false;
  setTimeout(() => { if (!matchCalled) { throw new Error(errorMessages.REPLACE_ELSE_INSERT_WITHOUT_MATCH); } })
  return {
    match: getProp => {
      matchCalled = true;
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
        actionName: `replaceElseInsert().match(${segs.join('.')})`,
        payload: null,
        getPayloadFn: () => ({
          argument: payloadFrozen,
          replacementCount,
          insertionCount,
        }),
        tag,
      });
    }
  };
}) as StoreForAnArray<X, T>['replaceElseInsert'];

export const replace = <S, C, X extends C & Array<any>, T extends Trackability>(
  pathReader: PathReader<S>,
  updateState: UpdateStateFn<S, C, T, X>,
  selector: Selector<S, C, X>,
  name: string,
) => (payload: C | FunctionReturning<C>, tag: Tag<T>) => {
  const pathSegments = pathReader.readSelector(selector);
  const { payloadFrozen, payloadCopied, payloadFunction } = copyPayload(payload);
  let payloadReturnedByFn: C;
  let getPayloadFn = (() => payloadReturnedByFn ? { replacement: payloadReturnedByFn } : payloadReturnedByFn) as unknown as () => C;
  if (!pathSegments.length) {
    updateState({
      selector,
      replacer: old => {
        if (payloadFunction) {
          payloadReturnedByFn = payloadFunction(old);
          return payloadReturnedByFn;
        } else {
          return payloadFrozen;
        }
      },
      mutator: old => {
        const newValue = payloadFunction ? payloadFunction(old as any) : payloadCopied;
        if (Array.isArray(old)) {
          (old as Array<any>).length = 0;
          Object.assign(old, newValue);
        } else if (typeof (old) === 'boolean' || typeof (old) === 'number' || typeof (old) === 'string') {
          pathReader.mutableStateCopy = newValue as any;
        } else {
          Object.assign(old, newValue);
        }
      },
      actionName: `${name}()`,
      pathSegments: [],
      payload: {
        replacement: payloadFrozen,
      },
      getPayloadFn,
      tag,
    });
  } else {
    const lastSeg = pathSegments[pathSegments.length - 1] || '';
    const segsCopy = pathSegments.slice(0, pathSegments.length - 1);
    const selectorRevised = (((state: S) => {
      let res = state as Record<any, any>;
      segsCopy.forEach(seg => res = res[seg]);
      return res;
    })) as Selector<S, C, X>;
    const actionName = `${pathSegments.join('.')}${pathSegments.length ? '.' : ''}${name}()`;
    updateState({
      selector: selectorRevised,
      replacer: old => {
        if (Array.isArray(old)) { return (old as Array<any>).map((o, i) => i === +lastSeg ? payloadFrozen : o); }
        if (payloadFunction) { payloadReturnedByFn = payloadFunction((old as any)[lastSeg]); }
        return ({ ...old, [lastSeg]: payloadFunction ? payloadFunction((old as any)[lastSeg]) : payloadFrozen })
      },
      mutator: (old: Record<any, any>) => old[lastSeg] = payloadReturnedByFn || payloadCopied,
      actionName,
      actionNameOverride: true,
      pathSegments: segsCopy,
      payload: {
        replacement: payloadFrozen,
      },
      getPayloadFn,
      tag,
    })
  }
};
