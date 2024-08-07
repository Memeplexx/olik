import { ArrayOfElementsCommonAction, ArrayOfObjectsCommonAction, FindOrFilter, Trackability } from './shapes-external';
import { ArrayCustomState } from './shapes-internal';
import { errorMessages } from './shared-consts';
import { readSelector } from './shared-utils';
import { processStateUpdateRequest } from './store-updaters';
import { transact } from './transact';

export const replace = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayCustomState<S, C, X>,
) => ((payload, updateOptions) => {
  return processStateUpdateRequest({
    ...arg,
    selector: ((s: any) => (arg.selector(s) as any)[arg.type]((e: any) => arg.predicate(e))) as any, 
    payload,
    updateOptions,
    cacheKeySuffix: `${arg.type}(ex).replace()`,
    actionNameSuffix: `${arg.type}(ex).replace()`,
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
  arg: ArrayCustomState<S, C, X>,
) => ((payload, updateOptions) => {
  return processStateUpdateRequest({
    ...arg,
    selector: ((s: any) => (arg.selector(s) as any)[arg.type]((e: any) => arg.predicate(e))) as any,
    payload,
    updateOptions,
    cacheKeySuffix: `${arg.type}(ex).patch()`,
    actionNameSuffix: `${arg.type}(ex).patch()`,
    replacer: (old, payload) => {
      const elementIndices = getElementIndices(arg);
      return old.map((o: any, i: number) => elementIndices.includes(i) ? { ...o, ...payload } : o);
    },
    getPayload: (payload) => ({
      where: arg.predicate.toString(),
      patch: payload,
    }),
  });
}) as ArrayOfObjectsCommonAction<X, F, T>['patch'];

export const remove = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayCustomState<S, C, X>,
) => ((payload: any, updateOptions: any) => {
  return processStateUpdateRequest({
    ...arg,
    selector: ((s: any) => (arg.selector(s) as any)[arg.type]((e: any) => arg.predicate(e))) as any,
    payload,
    updateOptions,
    cacheKeySuffix: `${arg.type}(ex).remove()`,
    actionNameSuffix: `${arg.type}(ex).remove()`,
    replacer: old => {
      const elementIndices = getElementIndices(arg);
      return old.filter((o, i) => !elementIndices.includes(i));
    },
    getPayload: () => {
      const elementIndices = getElementIndices(arg);
      return {
        where: arg.predicate.toString(),
        toRemove: (arg.selector(arg.getCurrentState()) as X)[arg.type]((e, i) => elementIndices.includes(i)),
      };
    }
  });
}) as ArrayOfElementsCommonAction<X, F, T>['remove'];

export const onChange = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayCustomState<S, C, X>,
) => (performAction => {
  arg.storeState.changeListeners.set(performAction, nextState => arg.type === 'find'
    ? (arg.selector(nextState) as X).find(e => arg.predicate(e))
    : { $filtered: (arg.selector(nextState) as X).filter(e => arg.predicate(e)) });
  return { unsubscribe: () => arg.storeState.changeListeners.delete(performAction) };
}) as ArrayOfElementsCommonAction<X, F, T>['onChange'];

export const read = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayCustomState<S, C, X>,
) => (() => {
  return arg.type === 'find'
    ? (arg.selector(arg.getCurrentState()) as X).find(e => arg.predicate(e))
    : (arg.selector(arg.getCurrentState()) as X).map(e => arg.predicate(e) ? e : null).filter(e => e != null)
}) as ArrayOfElementsCommonAction<X, F, T>['read'];

export const invalidateCache = <S, C, X extends C & Array<any>>(
  arg: ArrayCustomState<S, C, X>,
) => {
  const segs = readSelector(arg.selector);
  const pathSegs = segs.join('.') + (segs.length ? '.' : '') + arg.type + '(' + arg.predicate + ')';
  transact(...Object.keys(arg.select().read().cacheTTLs).filter(key => key.startsWith(pathSegs))
    .map(key => () => arg.select(s => (s as any).cacheTTLs).remove(key)));
}

const getElementIndices = <S, C, X extends C & Array<any>>(
  arg: ArrayCustomState<S, C, X>,
) => {
  const elementIndices = arg.type === 'find'
    ? [(arg.selector(arg.getCurrentState()) as X).findIndex(e => arg.predicate(e))]
    : (arg.selector(arg.getCurrentState()) as X).map((e, i) => arg.predicate(e) ? i : null).filter(i => i !== null) as number[];
  if (arg.type === 'find' && elementIndices[0] === -1) { throw new Error(errorMessages.NO_ARRAY_ELEMENT_FOUND); }
  return elementIndices;
}

