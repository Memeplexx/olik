import { errorMessages } from './shared-consts';
import {
  ArrayOfElementsAction,
  ArrayOfElementsCommonAction,
  ArrayOfObjectsAction,
  DeepReadonly,
  FindOrFilter,
  Selector,
  Trackability,
  UpdateOptions,
  UpdateOptionsInternal,
} from './shapes-external';
import { ArrayOperatorState, PathReader } from './shapes-internal';
import { copyPayload, createPathReader, deepFreeze, processAsyncPayload, toIsoString, validateSelectorFn } from './shared-utils';
import { libState } from './shared-state';

export const getSegments = <S, C, X extends C & Array<any>, P>(
  selector: Selector<S, C, X>,
  getCurrentState: () => S,
  getProp?: (element: DeepReadonly<X[0]>) => P,
) => {
  return !getProp ? [] : createPathReader((selector(getCurrentState()) as X)[0] || {}).readSelector(getProp);
}

export const and = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  context: ArrayOperatorState<S, C, X, F, T>,
) => (prop => {
  const { whereClauseString, whereClauseStrings, whereClauseSpecs, recurseWhere, criteria, fn } = context;
  whereClauseStrings.push(`${whereClauseString} &&`);
  whereClauseSpecs.push({ filter: o => criteria(o, fn), type: 'and' });
  return recurseWhere(prop);
}) as ArrayOfElementsAction<X, F, T>['and'];

export const or = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  context: ArrayOperatorState<S, C, X, F, T>,
) => (prop => {
  const { whereClauseString, whereClauseStrings, whereClauseSpecs, recurseWhere, criteria, fn } = context;
  whereClauseStrings.push(`${whereClauseString} ||`);
  whereClauseSpecs.push({ filter: o => criteria(o, fn), type: 'or' });
  return recurseWhere(prop);
}) as ArrayOfElementsAction<X, F, T>['or'];

export const remove = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  context: ArrayOperatorState<S, C, X, F, T>,
) => (updateOptions => {
  const { updateState, selector, type, whereClauseStrings, getCurrentState } = context;
  const elementIndices = completeWhereClause(context);
  updateState({
    selector,
    replacer: old => old.filter((o, i) => !elementIndices.includes(i)),
    mutator: old => {
      for (var i = 0, j = 0; i < old.length; i++, j++) {
        if (elementIndices.includes(j)) {
          old.splice(i, 1); i--;
        }
      }
    },
    actionName: `${deriveType(type)}().remove()`,
    payload: {
      query: whereClauseStrings.join(' '),
      toRemove: (selector(getCurrentState()) as X)[type]((e, i) => elementIndices.includes(i)),
    },
    updateOptions,
  });
}) as ArrayOfObjectsAction<X, F, T>['remove'];

export const patch = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  context: ArrayOperatorState<S, C, X, F, T>,
) => ((payload, updateOptions) => {
  const { updateState, selector, type, whereClauseStrings, pathReader, storeResult } = context;
  const elementIndices = completeWhereClause(context);
  const processPayload = (payload: Partial<C>) => {
    const { payloadFrozen, payloadCopied } = copyPayload(payload);
    updateState({
      selector,
      replacer: old => old.map((o, i) => elementIndices.includes(i) ? { ...o, ...payloadFrozen } : o),
      mutator: old => elementIndices.forEach(i => Object.assign(old[i], payloadCopied)),
      actionName: `${deriveType(type)}().patch()`,
      payload: {
        query: whereClauseStrings.join(' '),
        patch: payloadFrozen,
      },
      updateOptions: updateOptions as UpdateOptions<T, C, any>,
    });
  }
  return processAsyncPayload(selector, payload, pathReader, storeResult, processPayload, updateOptions as UpdateOptions<T, C, any>, deriveType(type) + '(' + whereClauseStrings.join(' ') + ').patch');
}) as ArrayOfObjectsAction<X, F, T>['patch'];

export const replace = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  context: ArrayOperatorState<S, C, X, F, T>,
) => ((payload, updateOptions) => {
  const { updateState, selector, type, whereClauseStrings, pathReader, storeResult } = context;
  const processPayload = (payload: C) => {
    const { payloadFrozen, payloadCopied } = copyPayload(payload);
    const elementIndices = completeWhereClause(context);
    updateState({
      selector,
      replacer: old => old.map((o, i) => elementIndices.includes(i) ? payloadFrozen : o),
      mutator: old => { old.forEach((o, i) => { if (elementIndices.includes(i)) { old[i] = payloadCopied; } }) },
      actionName: `${deriveType(type)}().replace()`,
      payload: {
        query: whereClauseStrings.join(' '),
        replacement: payloadFrozen,
      },
      updateOptions: updateOptions as UpdateOptions<T, C, any>,
    })
  }
  return processAsyncPayload(selector, payload, pathReader, storeResult, processPayload, updateOptions as UpdateOptions<T, C, any>, whereClauseStrings.join(' ') + '.replace');
}) as ArrayOfElementsCommonAction<X, F, T>['replace'];

export const onChange = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  context: ArrayOperatorState<S, C, X, F, T>,
) => (performAction => {
  const { whereClauseSpecs, criteria, fn, changeListeners, type, selector } = context;
  whereClauseSpecs.push({ filter: o => criteria(o, fn), type: 'last' });
  changeListeners.set(performAction, nextState => deepFreeze(type === 'find'
    ? (selector(nextState) as X).find(e => bundleCriteria(e, whereClauseSpecs))
    : { $filtered: (selector(nextState) as X).map(e => bundleCriteria(e, whereClauseSpecs) ? e : null).filter(e => e !== null) }));
  return { unsubscribe: () => changeListeners.delete(performAction) };
}) as ArrayOfElementsCommonAction<X, F, T>['onChange'];

export const read = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  context: ArrayOperatorState<S, C, X, F, T>,
) => (() => {
  const { whereClauseSpecs, criteria, fn, type, selector, getCurrentState } = context;
  whereClauseSpecs.push({ filter: o => criteria(o, fn), type: 'last' });
  return deepFreeze(type === 'find'
    ? (selector(getCurrentState()) as X).find(e => bundleCriteria(e, whereClauseSpecs))
    : (selector(getCurrentState()) as X).map(e => bundleCriteria(e, whereClauseSpecs) ? e : null).filter(e => e != null));
}) as ArrayOfElementsCommonAction<X, F, T>['read'];

export const invalidateCache = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  context: ArrayOperatorState<S, C, X, F, T>,
) => {
  const { pathReader, storeResult, selector, whereClauseString, type } = context;
  pathReader.readSelector(selector);
  const pathSegs = pathReader.pathSegments.join('.') + (pathReader.pathSegments.length ? '.' : '') + deriveType(type) + '(' + whereClauseString + ')';
  const patch = {} as { [key: string]: string };
  Object.keys(storeResult().read().cacheExpiryTimes)
    .filter(key => key.startsWith(pathSegs))
    .forEach(key => patch[key] = toIsoString(new Date()));
  storeResult(s => (s as any).cacheExpiryTimes).patch(patch);
}

const deriveType = (type: FindOrFilter) => {
  return type === 'find' ? 'whereOne' : 'whereMany';
}

const completeWhereClause = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  context: ArrayOperatorState<S, C, X, F, T>,
) => {
  const { whereClauseStrings, whereClauseString, whereClauseSpecs, criteria, fn, getCurrentState, selector, type } = context;
  whereClauseStrings.push(whereClauseString);
  whereClauseSpecs.push({ filter: o => criteria(o, fn), type: 'last' });
  validateSelectorFn('select', context.selector);
  const elementIndices = type === 'find'
    ? [(selector(getCurrentState()) as X).findIndex(e => bundleCriteria(e, whereClauseSpecs))]
    : (selector(getCurrentState()) as X).map((e, i) => bundleCriteria(e, whereClauseSpecs) ? i : null).filter(i => i !== null) as number[];
  if (type === 'find' && elementIndices[0] === -1) { throw new Error(errorMessages.NO_ARRAY_ELEMENT_FOUND); }
  return elementIndices;
}

const bundleCriteria = <C, X extends C & Array<any>>(
  arrayElement: X[0],
  whereClauseSpecs: Array<{ filter: (arg: X[0]) => boolean, type: 'and' | 'or' | 'last' }>,
) => {
  const ors = new Array<(arg: X[0]) => boolean>();
  const ands = new Array<(arg: X[0]) => boolean>();
  for (let i = 0; i < whereClauseSpecs.length; i++) {
    const isLastClause = whereClauseSpecs[i].type === 'last';
    const isAndClause = whereClauseSpecs[i].type === 'and';
    const isOrClause = whereClauseSpecs[i].type === 'or';
    const previousClauseWasAnAnd = whereClauseSpecs[i - 1] && whereClauseSpecs[i - 1].type === 'and';
    if (isAndClause || previousClauseWasAnAnd) {
      ands.push(whereClauseSpecs[i].filter);
    }
    if ((isOrClause || isLastClause) && ands.length) {
      const andsCopy = ands.slice();
      ors.push(el => andsCopy.every(and => and(el)));
      ands.length = 0;
    }
    if (!isAndClause && !previousClauseWasAnAnd) {
      ors.push(whereClauseSpecs[i].filter);
    }
  }
  return ors.some(fn => fn(arrayElement));
}