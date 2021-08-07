import { ArrayOfElementsCommonAction, ArrayOfObjectsCommonAction, FindOrFilter, Trackability } from './shapes-external';
import { ArrayCustomState } from './shapes-internal';
import { errorMessages } from './shared-consts';
import { deepFreeze, processAsyncPayload, readSelector } from './shared-utils';
import { transact } from './transact';

export const replace = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayCustomState<S, C, X, T>,
) => ((payload, updateOptions) => {
  const processPayload = (payload: C) => {
    const elementIndices = getElementIndices(arg);
    arg.updateState({
      selector: arg.selector,
      replacer: old => old.map((o, i) => elementIndices.includes(i) ? payload : o),
      actionName: `${arg.type}().replace()`,
      payload: {
        where: arg.predicate.toString(),
        replacement: payload,
      },
      updateOptions,
    });
  }
  return processAsyncPayload({
    ...arg,
    selector: ((s: any) => (arg.selector(s) as any)[arg.type]((e: any) => arg.predicate(e))) as any, 
    payload,
    processPayload,
    updateOptions,
    suffix: `${arg.type}(${arg.predicate}).replace()`,
  });
}) as ArrayOfElementsCommonAction<X, F, T>['replace'];

export const patch = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayCustomState<S, C, X, T>,
) => ((payload, updateOptions) => {
  const processPayload = (payload: C) => {
    const elementIndices = getElementIndices(arg);
    arg.updateState({
      selector: arg.selector,
      replacer: old => old.map((o, i) => elementIndices.includes(i) ? { ...o, ...payload } : o),
      actionName: `${arg.type}().patch()`,
      payload: {
        patch: payload,
        where: arg.predicate.toString(),
      },
      updateOptions,
    });
  }
  return processAsyncPayload({
    ...arg,
    selector: ((s: any) => (arg.selector(s) as any)[arg.type]((e: any) => arg.predicate(e))) as any,
    payload,
    processPayload,
    updateOptions,
    suffix: `${arg.type}(${arg.predicate}).patch()`,
  });
}) as ArrayOfObjectsCommonAction<X, F, T>['patch'];

export const remove = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayCustomState<S, C, X, T>,
) => ((payload: any, updateOptions: any) => {
  const elementIndices = getElementIndices(arg);
  const processPayload = () => arg.updateState({
    selector: arg.selector,
    replacer: old => old.filter((o, i) => !elementIndices.includes(i)),
    actionName: `${arg.type}().remove()`,
    payload: {
      toRemove: (arg.selector(arg.getCurrentState()) as X)[arg.type]((e, i) => elementIndices.includes(i)), where: arg.predicate.toString(),
    },
    updateOptions: typeof payload === 'function' ? updateOptions : payload,
  });
  return processAsyncPayload({
    ...arg,
    selector: ((s: any) => (arg.selector(s) as any)[arg.type]((e: any) => arg.predicate(e))) as any,
    payload,
    processPayload,
    updateOptions,
    suffix: `${arg.type}(${arg.predicate}).remove()`,
  });
}) as ArrayOfElementsCommonAction<X, F, T>['remove'];

export const onChange = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayCustomState<S, C, X, T>,
) => (performAction => {
  arg.changeListeners.set(performAction, nextState => deepFreeze(arg.type === 'find'
    ? (arg.selector(nextState) as X).find(e => arg.predicate(e))
    : { $filtered: (arg.selector(nextState) as X).filter(e => arg.predicate(e)) }));
  return { unsubscribe: () => arg.changeListeners.delete(performAction) };
}) as ArrayOfElementsCommonAction<X, F, T>['onChange'];

export const read = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  arg: ArrayCustomState<S, C, X, T>,
) => (() => {
  return deepFreeze(arg.type === 'find'
    ? (arg.selector(arg.getCurrentState()) as X).find(e => arg.predicate(e))
    : (arg.selector(arg.getCurrentState()) as X).map(e => arg.predicate(e) ? e : null).filter(e => e != null))
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

