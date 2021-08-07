import {
  ArrayOfElementsAction,
  ArrayOfElementsCommonAction,
  ArrayOfObjectsAction,
  FindOrFilter,
  Trackability,
  UpdateOptions,
} from './shapes-external';
import { ArrayOperatorState } from './shapes-internal';
import { errorMessages } from './shared-consts';
import { deepFreeze, processAsyncPayload, readSelector, validateSelectorFn } from './shared-utils';
import { transact } from './transact';

export const andWhere = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => (prop => {
  arg.whereClauseStrings.push(`${arg.whereClauseString} &&`);
  arg.whereClauseSpecs.push({ filter: o => arg.criteria(o, arg.fn), type: 'and' });
  return arg.recurseWhere(prop);
}) as ArrayOfElementsAction<X, F, T>['andWhere'];

export const orWhere = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => (prop => {
  arg.whereClauseStrings.push(`${arg.whereClauseString} ||`);
  arg.whereClauseSpecs.push({ filter: o => arg.criteria(o, arg.fn), type: 'or' });
  return arg.recurseWhere(prop);
}) as ArrayOfElementsAction<X, F, T>['orWhere'];

export const remove = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => ((payload: any, updateOptions: any) => {
  const elementIndices = completeWhereClause(arg);
  const processPayload = () => arg.updateState({
    selector: arg.selector,
    replacer: old => old.filter((o, i) => !elementIndices.includes(i)),
    actionName: `${arg.type}().remove()`,
    payload: {
      where: arg.whereClauseStrings.join(' '),
      toRemove: (arg.selector(arg.getCurrentState()) as X)[arg.type]((e, i) => elementIndices.includes(i)),
    },
    updateOptions: typeof payload === 'function' ? updateOptions : payload,
  });
  return processAsyncPayload({
    ...arg,
    selector: ((s: any) => (arg.selector(s) as any)[arg.type]((e: any) => bundleCriteria(e, arg.whereClauseSpecs))) as any,
    payload,
    processPayload,
    updateOptions,
    suffix: arg.type + '(' + arg.whereClauseString + ').remove()',
  });
}) as ArrayOfObjectsAction<X, F, T>['remove'];

export const patch = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => ((payload, updateOptions) => {
  const elementIndices = completeWhereClause(arg);
  const processPayload = (payload: Partial<C>) => {
    arg.updateState({
      selector: arg.selector,
      replacer: old => old.map((o, i) => elementIndices.includes(i) ? { ...o, ...payload } : o),
      actionName: `${arg.type}().patch()`,
      payload: {
        where: arg.whereClauseString,
        patch: payload,
      },
      updateOptions: updateOptions as UpdateOptions<T, any>,
    });
  }
  return processAsyncPayload({
    ...arg,
    selector: ((s: any) => (arg.selector(s) as any)[arg.type]((e: any) => bundleCriteria(e, arg.whereClauseSpecs))) as any,
    payload,
    processPayload,
    updateOptions,
    suffix: arg.type + '(' + arg.whereClauseString + ').patch()',
  });
}) as ArrayOfObjectsAction<X, F, T>['patch'];

export const replace = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => ((payload, updateOptions) => {
  const processPayload = (payload: C) => {
    const elementIndices = completeWhereClause(arg);
    arg.updateState({
      selector: arg.selector,
      replacer: old => old.map((o, i) => elementIndices.includes(i) ? payload : o),
      actionName: `${arg.type}().replace()`,
      payload: {
        where: arg.whereClauseString,
        replacement: payload,
      },
      updateOptions: updateOptions as UpdateOptions<T, any>,
    })
  }
  return processAsyncPayload<S, C, X>({
    selector: ((s: any) => (arg.selector(s) as any)[arg.type]((e: any) => bundleCriteria(e, arg.whereClauseSpecs))) as any,
    payload,
    storeResult: arg.storeResult,
    processPayload,
    updateOptions,
    suffix: arg.type + '(' + arg.whereClauseString + ').replace()',
    storeState: arg.storeState,
  });
}) as ArrayOfElementsCommonAction<X, F, T>['replace'];

export const onChange = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => (performAction => {
  arg.whereClauseSpecs.push({ filter: o => arg.criteria(o, arg.fn), type: 'last' });
  arg.changeListeners.set(performAction, nextState => deepFreeze(arg.type === 'find'
    ? (arg.selector(nextState) as X).find(e => bundleCriteria(e, arg.whereClauseSpecs))
    : { $filtered: (arg.selector(nextState) as X).map(e => bundleCriteria(e, arg.whereClauseSpecs) ? e : null).filter(e => e !== null) }));
  return { unsubscribe: () => arg.changeListeners.delete(performAction) };
}) as ArrayOfElementsCommonAction<X, F, T>['onChange'];

export const read = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => (() => {
  arg.whereClauseSpecs.push({ filter: o => arg.criteria(o, arg.fn), type: 'last' });
  return deepFreeze(arg.type === 'find'
    ? (arg.selector(arg.getCurrentState()) as X).find(e => bundleCriteria(e, arg.whereClauseSpecs))
    : (arg.selector(arg.getCurrentState()) as X).map(e => bundleCriteria(e, arg.whereClauseSpecs) ? e : null).filter(e => e != null));
}) as ArrayOfElementsCommonAction<X, F, T>['read'];

export const stopBypassingPromises = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => {
  const segs = readSelector(arg.selector);
  const pathSegs = segs.join('.') + (segs.length ? '.' : '') + arg.type + '(' + arg.whereClauseString + ')';
  transact(...Object.keys(arg.storeResult().read().promiseBypassTimes).filter(key => key.startsWith(pathSegs))
    .map(key => () => arg.storeResult(s => (s as any).promiseBypassTimes).remove(key)));
}

const completeWhereClause = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => {
  arg.whereClauseStrings.push(arg.whereClauseString);
  arg.whereClauseSpecs.push({ filter: o => arg.criteria(o, arg.fn), type: 'last' });
  validateSelectorFn('get', arg.storeState, arg.selector);
  const elementIndices = arg.type === 'find'
    ? [(arg.selector(arg.getCurrentState()) as X).findIndex(e => bundleCriteria(e, arg.whereClauseSpecs))]
    : (arg.selector(arg.getCurrentState()) as X).map((e, i) => bundleCriteria(e, arg.whereClauseSpecs) ? i : null).filter(i => i !== null) as number[];
  if (arg.type === 'find' && elementIndices[0] === -1) { throw new Error(errorMessages.NO_ARRAY_ELEMENT_FOUND); }
  arg.storeState.selector = (state: S) => (arg.selector(state) as X)[arg.type]((e, i) => elementIndices.includes(i));
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