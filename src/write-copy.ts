import { anyLibProp, errorMessages, findFilter, updateFunctions } from './constant';
import { constructQuery } from './query';
import { Actual, StateAction } from './type';
import { either, is } from './type-check';
import { setCurrentActionReturningNewState } from './write-action';

export const removeInvalidateCache = ['$delete', '$invalidateCache'];

export const copyNewState = (
  {
    currentState,
    stateToUpdate,
    stateActions,
    cursor
  }:
    {
      currentState: unknown,
      stateToUpdate: Actual,
      stateActions: ReadonlyArray<StateAction>,
      cursor: { index: number }
    }
): unknown => {
  if (Array.isArray(currentState) && !anyLibProp.includes(stateActions[cursor.index].name)) {
    return currentState.map((_, i) => currentState[i]
      ? { ...currentState[i], ...copyNewState({ currentState: either(currentState[i]).else({}), stateToUpdate: either((stateToUpdate as Array<Actual>)[i]).else({}), stateActions, cursor: { ...cursor } }) as Record<string, Actual> }
      : copyNewState({ currentState: currentState[i], stateToUpdate: (stateToUpdate as Array<Actual>)[i], stateActions, cursor: { ...cursor } }) as Actual);
  } else if (Array.isArray(currentState) && (stateActions[cursor.index].name === '$mergeMatching')) {
    cursor.index++;
    const queryPaths = stateActions
      .slice(cursor.index, cursor.index + stateActions.slice(cursor.index).findIndex(sa => updateFunctions.includes(sa.name)))
      .reduce((prev, curr) => {
        cursor.index++;
        return prev.concat(curr);
      }, new Array<StateAction>());
    const repsert = stateActions[cursor.index++];
    const repsertArgs = [...(Array.isArray(repsert.arg) ? repsert.arg : [repsert.arg!])];
    const result = currentState.map(e => {
      const elementValue = queryPaths.reduce((prev, curr) => (prev as Record<string, Actual>)[curr.name], e);
      const foundIndex = repsertArgs.findIndex(ua => queryPaths.reduce((prev, curr) => prev = (prev as Record<string, Actual>)[curr.name], ua) === elementValue);
      return foundIndex !== -1 ? repsertArgs.splice(foundIndex, 1)[0]! : e;
    });
    return setCurrentActionReturningNewState({ stateActions, payload: repsert.arg, newState: [...result, ...repsertArgs] });
  }
  const action = stateActions[cursor.index++];
  const payload = action.arg;
  if (cursor.index < stateActions.length) {
    if (findFilter.includes(action.name) && Array.isArray(currentState)) {
      const query = constructQuery({ stateActions, cursor });
      let findIndex = -1;
      if ('$find' === action.name) {
        findIndex = currentState.findIndex(query);
        if (findIndex === -1) { throw new Error(errorMessages.FIND_RETURNS_NO_MATCHES); }
      }
      if (stateActions[cursor.index].name === '$delete') {
        return setCurrentActionReturningNewState({ stateActions, payload, newState: '$find' === action.name ? currentState.filter((_, i) => findIndex !== i) : currentState.filter(e => !query(e)) });
      } else {
        if ('$find' === action.name) {
          return currentState.map((e, i) => i === findIndex
            ? copyNewState({ currentState: e, stateToUpdate: (stateToUpdate as Array<Actual>)[i], stateActions, cursor })
            : e);
        } else if ('$filter' === action.name) {
          if (stateActions[cursor.index]?.name === '$set') {
            return [
              ...currentState.filter(e => !query(e)),
              ...copyNewState({ currentState, stateToUpdate, stateActions, cursor }) as Array<Record<string, unknown>>,
            ];
          } else {
            return currentState.map((e, i) => query(e)
              ? copyNewState({ currentState: e, stateToUpdate: (stateToUpdate as Array<Actual>)[i], stateActions, cursor: { ...cursor } })
              : e);
          }
        }
      }
    } else if (removeInvalidateCache.includes(stateActions[cursor.index].name)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [stateActions[cursor.index - 1].name]: other, ...otherState } = currentState as Record<string, unknown>;
      return setCurrentActionReturningNewState({ stateActions, payload, newState: otherState })
    } else {

    return {
      ...either(currentState).else({}) as Record<string, unknown>,
      [action.name]: copyNewState({
        currentState: (either(currentState).else({}) as Record<string, unknown>)[action.name],
        stateToUpdate: either((either(stateToUpdate).else({}) as Record<string, unknown>)[action.name]).else({}),
        stateActions,
        cursor
      })
    };

    }
  } else if (action.name === '$set') {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: payload });
  } else if (action.name === '$patch') {
    if (Array.isArray(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState.map(e => ({ ...e, ...payload as Record<string, unknown> })) });
    } else {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: { ...currentState as Record<string, unknown>, ...payload as Record<string, unknown> } });
    }
  } else if (action.name === '$add') {
    if (Array.isArray(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState.map(e => (e as number) + (payload as number)) });
    } else {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: (currentState as number) + (payload as number) });
    }
  } else if (action.name === '$subtract') {
    if (Array.isArray(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState.map(e => (e as number) + (payload as number)) });
    } else {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: (currentState as number) - (payload as number) });
    }
  } else if (action.name === '$setNew') {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState === undefined ? payload : { ...currentState as Record<string, unknown>, ...payload as Record<string, unknown> } });
  } else if (action.name === '$patchDeep') {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: deepMerge(currentState as Record<string, unknown>, payload as Record<string, unknown>) });
  } else if (action.name === '$clear') {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: [] });
  } else if (action.name === '$push') {
    const newState = Array.isArray(payload) ? [...currentState as Array<Actual>, ...payload] : [...currentState as Array<Actual>, payload];
    return setCurrentActionReturningNewState({ stateActions, payload, newState });
  } else if (action.name === '$toggle') {
    if (Array.isArray(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState.map(e => !e) });
    } else {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: !currentState });
    }
  }
  throw new Error();
}

export const deepMerge = (old: Record<string, unknown>, payload: Record<string, unknown>) => {
  const mergeDeep = (target: Record<string, unknown>, source: Record<string, unknown>) => {
    const output = Object.assign({}, target);
    if (is.record(target) && is.record(source)) {
      Object.keys(source).forEach(key => {
        const val = source[key];
        if (is.record(val) && !is.array(val)) {
          if (!(key in target)) {
            Object.assign(output, { [key]: val });
          } else {
            output[key] = mergeDeep((target[key] as Record<string, unknown>), (val as Record<string, unknown>));
          }
        } else {
          Object.assign(output, { [key]: val });
        }
      });
    }
    return output;
  }
  return mergeDeep(old, payload);
}
