import { errorMessages } from './constant';
import { constructQuery } from './query';
import { StateAction } from './type';
import { setCurrentActionReturningNewState } from './write-action';

export const removeInvalidateCache = ['delete', 'invalidateCache'];

export const copyNewState = (
  { currentState, stateToUpdate, stateActions, cursor }:
    { currentState: any, stateToUpdate: any, stateActions: ReadonlyArray<StateAction>, cursor: { index: number } }
): any => {
  if (Array.isArray(currentState) && (stateActions[cursor.index].type === 'property')) {
    return (currentState as any[]).map((e, i) => (typeof (currentState[i]) === 'object')
      ? { ...currentState[i], ...copyNewState({ currentState: currentState[i] || {}, stateToUpdate: stateToUpdate[i] || {}, stateActions, cursor: { ...cursor } }) }
      : copyNewState({ currentState: currentState[i] || {}, stateToUpdate: stateToUpdate[i] || {}, stateActions, cursor: { ...cursor } }));
  } else if (Array.isArray(currentState) && (stateActions[cursor.index].type === 'mergeMatching')) {
    cursor.index++;
    const queryPaths = stateActions
      .slice(cursor.index, cursor.index + stateActions.slice(cursor.index).findIndex(sa => sa.type === 'action'))
      .reduce((prev, curr) => {
        cursor.index++;
        return prev.concat(curr);
      }, new Array<StateAction>());
    const repsert = stateActions[cursor.index++];
    const repsertArgs = [...(Array.isArray(repsert.arg) ? repsert.arg : [repsert.arg])];
    const result = (currentState as any[]).map(e => {
      const elementValue = queryPaths.reduce((prev, curr) => prev = prev[curr.name], e);
      const foundIndex = repsertArgs.findIndex(ua => queryPaths.reduce((prev, curr) => prev = prev[curr.name], ua) === elementValue);
      return foundIndex !== -1 ? repsertArgs.splice(foundIndex, 1)[0] : e;
    });
    return setCurrentActionReturningNewState({ stateActions, payload: repsert.arg, newState: [...result, ...repsertArgs], currentState });
  }
  const action = stateActions[cursor.index++];
  if (cursor.index < stateActions.length) {
    if (action.type === 'search' && Array.isArray(currentState)) {
      const query = constructQuery({ stateActions, cursor });
      let findIndex = -1;
      if ('find' === action.name) {
        findIndex = (currentState as any[]).findIndex(query);
        if (findIndex === -1) { throw new Error(errorMessages.FIND_RETURNS_NO_MATCHES); }
      }
      if (stateActions[cursor.index].name === 'delete') {
        return setCurrentActionReturningNewState({ stateActions, payload: null, newState: 'find' === action.name ? (currentState as any[]).filter((e, i) => findIndex !== i) : (currentState as any[]).filter(e => !query(e)), currentState });
      } else {
        if ('find' === action.name) {
          return (currentState as any[]).map((e, i) => i === findIndex
            ? copyNewState({ currentState: e, stateToUpdate: stateToUpdate[i], stateActions, cursor })
            : e);
        } else if ('filter' === action.name) {
          if (stateActions[cursor.index]?.name === 'set') {
            return [
              ...(currentState as any[]).filter(e => !query(e)),
              ...copyNewState({ currentState, stateToUpdate: stateToUpdate, stateActions, cursor }),
            ];
          } else {
            return (currentState as any[]).map((e, i) => query(e)
              ? copyNewState({ currentState: e, stateToUpdate: stateToUpdate[i], stateActions, cursor: { ...cursor } })
              : e);
          }
        }
      }
    } else if (removeInvalidateCache.includes(stateActions[cursor.index].name)) {
      const { [stateActions[cursor.index - 1].name]: other, ...otherState } = currentState;
      return setCurrentActionReturningNewState({ stateActions, payload: null, newState: otherState, currentState })
    } else {
      return { ...currentState, [action.name]: copyNewState({ currentState: (currentState || {})[action.name], stateToUpdate: ((stateToUpdate as any) || {})[action.name], stateActions, cursor }) };
    }
  } else if (action.name === 'setSome') {
    if (Array.isArray(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: (currentState as any[]).map(e => ({ ...e, ...action.arg })), currentState });
    } else {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: { ...currentState, ...(action.arg as any) }, currentState });
    }
  } else if (action.name === 'add') {
    if (Array.isArray(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: Array.isArray(currentState) ? currentState.map((e: any) => e + action.arg) : currentState + action.arg, currentState });
    } else {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: currentState + action.arg, currentState });
    }
  } else if (action.name === 'subtract') {
    if (Array.isArray(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: Array.isArray(currentState) ? currentState.map((e: any) => e + action.arg) : currentState - action.arg, currentState });
    } else {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: currentState - action.arg, currentState });
    }
  } else if (action.name === 'setNew') {
    return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: currentState === undefined ? action.arg : { ...currentState, ...action.arg }, currentState });
  } else if (action.name === 'set') {
    return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: action.arg, currentState });
  } else if (action.name === 'setSomeDeep') {
    return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: deepMerge(currentState, action.arg), currentState });
  } else if (action.name === 'clear') {
    return setCurrentActionReturningNewState({ stateActions, payload: null, newState: [], currentState });
  } else if (action.name === 'push') {
    const newState = Array.isArray(action.arg) ? [...currentState, ...action.arg] : [...currentState, action.arg];
    return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState, currentState });
  }
}

export const deepMerge = (old: any, payload: any) => {
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
}
