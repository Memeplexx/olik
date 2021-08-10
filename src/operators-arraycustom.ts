import { ArrayOfElementsCommonAction, ArrayOfObjectsCommonAction, FindOrFilter, Trackability } from './shapes-external';
import { ArrayCustomState } from './shapes-internal';
import { errorMessages } from './shared-consts';
import { readSelector } from './shared-utils';
import { processStateUpdateRequest } from './store-updaters';
import { transact } from './transact';

export const replace = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayCustomState<S, C, X, T>,
) => ((payload, updateOptions) => {
  return processStateUpdateRequest({
    ...arg,
    selector: ((s: any) => (arg.selector(s) as any)[arg.type]((e: any) => arg.predicate(e))) as any, 
    payload,
    updateOptions,
    cacheKeySuffix: `${arg.type}(${arg.predicate}).replace()`,
    actionNameSuffix: `${arg.type}().replace()`,
    replacer: (old, payload) => {
      const elementIndices = getElementIndices(arg);
      return old.map((o: any, i: number) => elementIndices.includes(i) ? payload : o);
    },
    getPayload: payload => ({
      where: arg.predicate.toString(),
      replacement: payload,
    }),
  });
}) as ArrayOfElementsCommonAction<X, F, T>['replace'];

export const patch = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayCustomState<S, C, X, T>,
) => ((payload, updateOptions) => {
  return processStateUpdateRequest({
    ...arg,
    selector: ((s: any) => (arg.selector(s) as any)[arg.type]((e: any) => arg.predicate(e))) as any,
    payload,
    updateOptions,
    cacheKeySuffix: `${arg.type}(${arg.predicate}).patch()`,
    actionNameSuffix: `${arg.type}().patch()`,
    replacer: (old, payload) => {
      const elementIndices = getElementIndices(arg);
      return old.map((o: any, i: number) => elementIndices.includes(i) ? { ...o, ...payload } : o);
    },
    getPayload: (payload) => ({
      patch: payload,
      where: arg.predicate.toString(),
    }),
  });
}) as ArrayOfObjectsCommonAction<X, F, T>['patch'];

export const remove = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayCustomState<S, C, X, T>,
) => ((payload: any, updateOptions: any) => {
  const elementIndices = getElementIndices(arg);
  return processStateUpdateRequest({
    ...arg,
    selector: ((s: any) => (arg.selector(s) as any)[arg.type]((e: any) => arg.predicate(e))) as any,
    payload,
    updateOptions,
    cacheKeySuffix: `${arg.type}().remove()`,
    actionNameSuffix: `${arg.type}().remove()`,
    replacer: old => old.filter((o, i) => !elementIndices.includes(i)),
    getPayload: () => ({
      toRemove: (arg.selector(arg.getCurrentState()) as X)[arg.type]((e, i) => elementIndices.includes(i)), where: arg.predicate.toString(),
    })
  });
}) as ArrayOfElementsCommonAction<X, F, T>['remove'];

export const onChange = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayCustomState<S, C, X, T>,
) => (performAction => {
  arg.storeState.changeListeners.set(performAction, nextState => arg.type === 'find'
    ? (arg.selector(nextState) as X).find(e => arg.predicate(e))
    : { $filtered: (arg.selector(nextState) as X).filter(e => arg.predicate(e)) });
  return { unsubscribe: () => arg.storeState.changeListeners.delete(performAction) };
}) as ArrayOfElementsCommonAction<X, F, T>['onChange'];

export const read = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayCustomState<S, C, X, T>,
) => (() => {
  return arg.type === 'find'
    ? (arg.selector(arg.getCurrentState()) as X).find(e => arg.predicate(e))
    : (arg.selector(arg.getCurrentState()) as X).map(e => arg.predicate(e) ? e : null).filter(e => e != null)
}) as ArrayOfElementsCommonAction<X, F, T>['read'];

export const stopBypassingPromises = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: ArrayCustomState<S, C, X, T>,
) => {
  const segs = readSelector(arg.selector);
  const pathSegs = segs.join('.') + (segs.length ? '.' : '') + arg.type + '(' + arg.predicate + ')';
  transact(...Object.keys(arg.storeResult().read().promiseBypassTimes).filter(key => key.startsWith(pathSegs))
    .map(key => () => arg.storeResult(s => (s as any).promiseBypassTimes).remove(key)));
}

const getElementIndices = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: ArrayCustomState<S, C, X, T>,
) => {
  const elementIndices = arg.type === 'find'
    ? [(arg.selector(arg.getCurrentState()) as X).findIndex(e => arg.predicate(e))]
    : (arg.selector(arg.getCurrentState()) as X).map((e, i) => arg.predicate(e) ? i : null).filter(i => i !== null) as number[];
  if (arg.type === 'find' && elementIndices[0] === -1) { throw new Error(errorMessages.NO_ARRAY_ELEMENT_FOUND); }
  return elementIndices;
}

