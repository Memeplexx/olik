import {
  ActionOptions,
  AnyAsync,
  ArrayOfElementsAction,
  ArrayOfElementsCommonAction,
  ArrayOfObjectsAction,
  FindOrFilter,
  Trackability,
} from './shapes-external';
import { ArrayOperatorState } from './shapes-internal';
import { errorMessages } from './shared-consts';
import { readSelector } from './shared-utils';
import { processStateUpdateRequest } from './store-updaters';
import { transact } from './transact';

export const and = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => (prop => {
  arg.whereClauseStrings.push(`${arg.whereClauseString}).and(`);
  arg.whereClauseSpecs.push({ filter: o => arg.criteria(o, arg.comparator), type: 'and' });
  return arg.recurseWhere(prop);
}) as ArrayOfElementsAction<X, F, T>['and'];

export const or = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => (prop => {
  arg.whereClauseStrings.push(`${arg.whereClauseString}).or(`);
  arg.whereClauseSpecs.push({ filter: o => arg.criteria(o, arg.comparator), type: 'or' });
  return arg.recurseWhere(prop);
}) as ArrayOfElementsAction<X, F, T>['or'];

export const remove = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => ((argumentOrUpdateOptions?: (() => AnyAsync<any>) | ActionOptions<T>, updateOptionsAsync?: ActionOptions<T>) => processStateUpdateRequest({
  ...arg,
  selector: ((s: any) => (arg.selector(s) as any)[arg.type]((e: any) => bundleCriteria(e, arg.whereClauseSpecs))) as any,
  argument: argumentOrUpdateOptions,
  updateOptions: updateOptionsAsync || argumentOrUpdateOptions,
  actionNameSuffix: `${arg.type}(${completeWhereClause(arg)}).remove()`,
  replacer: old => {
    const elementIndices = getElementIndices(arg);
    return old.filter((o, i) => !elementIndices.includes(i));
  },
  getPayload: () => {
    const elementIndices = getElementIndices(arg);
    return {
      where: arg.payloadWhereClauses,
      toRemove: (arg.selector(arg.getCurrentState()) as X)[arg.type]((e, i) => elementIndices.includes(i)),
    };
  },
})) as ArrayOfElementsCommonAction<X, F, T>['remove'];

export const patch = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => ((argument, updateOptions) => processStateUpdateRequest({
  ...arg,
  selector: ((s: any) => (arg.selector(s) as any)[arg.type]((e: any) => bundleCriteria(e, arg.whereClauseSpecs))) as any,
  argument,
  updateOptions,
  actionNameSuffix: `${arg.type}(${completeWhereClause(arg)}).patch()`,
  replacer: (old, argument) => {
    const elementIndices = getElementIndices(arg);
    return old.map((o, i) => elementIndices.includes(i) ? { ...o, ...argument } : o);
  },
  getPayload: payload => ({
    where: arg.payloadWhereClauses,
    patch: payload,
  })
})) as ArrayOfObjectsAction<X, F, T>['patch'];

export const replace = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => ((argument, updateOptions) => processStateUpdateRequest<S, C, X>({
  ...arg,
  selector: ((s: any) => (arg.selector(s) as any)[arg.type]((e: any) => bundleCriteria(e, arg.whereClauseSpecs))) as any,
  argument,
  updateOptions,
  actionNameSuffix: `${arg.type}(${completeWhereClause(arg)}).replace()`,
  replacer: (old, argument) => {
    const elementIndices = getElementIndices(arg);
    return old.map((o, i) => elementIndices.includes(i) ? argument : o);
  },
  getPayload: (payload) => ({
    where: arg.payloadWhereClauses,
    replacement: payload,
  }),
})) as ArrayOfElementsCommonAction<X, F, T>['replace'];

export const onChange = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => (performAction => {
  arg.whereClauseSpecs.push({ filter: o => arg.criteria(o, arg.comparator), type: 'last' });
  arg.storeState.changeListeners.set(performAction, nextState => arg.type === 'find'
    ? (arg.selector(nextState) as X).find(e => bundleCriteria(e, arg.whereClauseSpecs))
    : { $filtered: (arg.selector(nextState) as X).map(e => bundleCriteria(e, arg.whereClauseSpecs) ? e : null).filter(e => e !== null) });
  return { unsubscribe: () => arg.storeState.changeListeners.delete(performAction) };
}) as ArrayOfElementsCommonAction<X, F, T>['onChange'];

export const read = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => (() => {
  arg.whereClauseSpecs.push({ filter: o => arg.criteria(o, arg.comparator), type: 'last' });
  return arg.type === 'find'
    ? (arg.selector(arg.getCurrentState()) as X).find(e => bundleCriteria(e, arg.whereClauseSpecs))
    : (arg.selector(arg.getCurrentState()) as X).map(e => bundleCriteria(e, arg.whereClauseSpecs) ? e : null).filter(e => e != null);
}) as ArrayOfElementsCommonAction<X, F, T>['read'];

export const invalidateCache = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => {
  const segs = readSelector(arg.selector);
  const pathSegs = segs.join('.') + (segs.length ? '.' : '') + arg.type + '(' + completeWhereClause(arg) + ')';
  transact(...Object.keys(arg.select().read().cache).filter(key => key.startsWith(pathSegs))
    .map(key => () => arg.select(s => (s as any).cache[key]).remove()));
}

const completeWhereClause = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => {
  arg.whereClauseStrings.push(arg.whereClauseString);
  arg.whereClauseSpecs.push({ filter: o => arg.criteria(o, arg.comparator), type: 'last' });
  return arg.whereClauseStrings.join('');
}

const getElementIndices = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayOperatorState<S, C, X, F, T>,
) => {
  const elementIndices = arg.type === 'find'
    ? [(arg.selector(arg.getCurrentState()) as X).findIndex(e => bundleCriteria(e, arg.whereClauseSpecs))]
    : (arg.selector(arg.getCurrentState()) as X).map((e, i) => bundleCriteria(e, arg.whereClauseSpecs) ? i : null).filter(i => i !== null) as number[];
  if (arg.type === 'find' && elementIndices[0] === -1) { throw new Error(errorMessages.NO_ARRAY_ELEMENT_FOUND); }
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