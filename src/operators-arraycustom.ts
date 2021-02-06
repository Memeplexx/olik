import { errorMessages } from './shared-consts';
import { ArrayOfElementsCommonAction, ArrayOfObjectsCommonAction, FindOrFilter, Trackability } from './shapes-external';
import { ArrayCustomState } from './shapes-internal';
import { libState } from './shared-state';
import { copyPayload, deepFreeze } from './shared-utils';

export const arrayCustomReplace = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  context: ArrayCustomState<S, C, X, T>,
) => ((payload, tag) => {
  const { type, updateState, selector, predicate } = context;
  const { payloadFrozen, payloadCopied } = copyPayload(payload);
  const elementIndices = getElementIndices(context);
  updateState({
    selector,
    replacer: old => old.map((o, i) => elementIndices.includes(i) ? payloadFrozen : o),
    mutator: old => { old.forEach((o, i) => { if (elementIndices.includes(i)) { old[i] = payloadCopied; } }) },
    actionName: `${type}Custom().replace()`,
    payload: {
      query: predicate.toString(),
      replacement: payloadFrozen,
    },
    tag,
  });
}) as ArrayOfElementsCommonAction<X, F, T>['replace'];

export const arrayCustomRemove = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  context: ArrayCustomState<S, C, X, T>,
) => (tag => {
  const { type, updateState, selector, predicate, getCurrentState } = context;
  const elementIndices = getElementIndices(context);
  updateState({
    selector,
    replacer: old => old.filter((o, i) => !elementIndices.includes(i)),
    mutator: old => {
      if (type === 'find') {
        old.splice(elementIndices[0], 1);
      } else {
        const toRemove = old.filter(predicate);
        for (var i = 0; i < old.length; i++) {
          if (toRemove.includes(old[i])) {
            old.splice(i, 1); i--;
          }
        }
      }
    },
    actionName: `${type}Custom().remove()`,
    payload: { toRemove: (selector(getCurrentState()) as X)[type]((e, i) => elementIndices.includes(i)), query: predicate.toString() },
    tag,
  });
}) as ArrayOfElementsCommonAction<X, F, T>['remove'];

export const arrayCustomPatch = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  context: ArrayCustomState<S, C, X, T>,
) => ((payload, tag) => {
  const { type, updateState, selector, predicate } = context;
  const { payloadFrozen, payloadCopied } = copyPayload(payload);
  const elementIndices = getElementIndices(context);
  updateState({
    selector,
    replacer: old => old.map((o, i) => elementIndices.includes(i) ? { ...o, ...payloadFrozen } : o),
    mutator: old => elementIndices.forEach(i => Object.assign(old[i], payloadCopied)),
    actionName: `${type}Custom().patch()`,
    payload: { patch: payloadFrozen, query: predicate.toString() },
    tag,
  });
}) as ArrayOfObjectsCommonAction<X, F, T>['patch'];

export const arrayCustomOnChange = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  context: ArrayCustomState<S, C, X, T>,
) => (performAction => {
  const { type, selector, predicate, changeListeners } = context;
  changeListeners.set(performAction, nextState => deepFreeze(type === 'find'
    ? (selector(nextState) as X).find(e => predicate(e))
    : { $filtered: (selector(nextState) as X).filter(e => predicate(e)) }));
  return { unsubscribe: () => changeListeners.delete(performAction) };
}) as ArrayOfElementsCommonAction<X, F, T>['onChange'];

export const arrayCustomRead = <S, C, X extends C & Array<any>, F extends FindOrFilter, T extends Trackability>(
  context: ArrayCustomState<S, C, X, T>,
) => (() => {
  const { type, selector, predicate, getCurrentState } = context;
  return deepFreeze(type === 'find'
    ? (selector(getCurrentState()) as X).find(e => predicate(e))
    : (selector(getCurrentState()) as X).map(e => predicate(e) ? e : null).filter(e => e != null))
}) as ArrayOfElementsCommonAction<X, F, T>['read'];

const getElementIndices = <S, C, X extends C & Array<any>, T extends Trackability>(
  context: ArrayCustomState<S, C, X, T>,
) => {
  const { type, selector, predicate, getCurrentState } = context;
  libState.bypassArrayFunctionCheck = true;
  const elementIndices = type === 'find'
    ? [(selector(getCurrentState()) as X).findIndex(e => predicate(e))]
    : (selector(getCurrentState()) as X).map((e, i) => predicate(e) ? i : null).filter(i => i !== null) as number[];
  libState.bypassArrayFunctionCheck = false;
  if (type === 'find' && elementIndices[0] === -1) { throw new Error(errorMessages.NO_ARRAY_ELEMENT_FOUND); }
  return elementIndices;
}