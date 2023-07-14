import { errorMessages } from './constant';
import { constructQuery } from './query';
import { Primitive, RecursiveRecord, StateAction } from './type';
import { is, mustBe } from './type-check';
import { setCurrentActionReturningNewState } from './write-action';

export const removeInvalidateCache = ['delete', 'invalidateCache'];

export const copyNewState = (
  {
    currentState,
    stateToUpdate,
    stateActions,
    cursor
  }:
    {
      currentState: RecursiveRecord | Primitive | Array<RecursiveRecord | Primitive>,
      stateToUpdate: RecursiveRecord | Primitive | Array<RecursiveRecord | Primitive>,
      stateActions: ReadonlyArray<StateAction>,
      cursor: { index: number }
    }
): RecursiveRecord | Primitive | Array<RecursiveRecord | Primitive> => {
  if (Array.isArray(currentState) && (stateActions[cursor.index].type === 'property')) {
    return currentState.map((e, i) => is.object(currentState[i])
      ? { ...mustBe.object(currentState[i]), ...mustBe.object(copyNewState({ currentState: currentState[i] || {}, stateToUpdate: (mustBe.arrayOf.object(stateToUpdate)[i] || {}), stateActions, cursor: { ...cursor } })) }
      : copyNewState({ currentState: currentState[i] || {}, stateToUpdate: (stateToUpdate as Array<RecursiveRecord>)[i] || {}, stateActions, cursor: { ...cursor } }) as  RecursiveRecord | Primitive);
  } else if (Array.isArray(currentState) && (stateActions[cursor.index].type === 'mergeMatching')) {
    cursor.index++;
    const queryPaths = stateActions
      .slice(cursor.index, cursor.index + stateActions.slice(cursor.index).findIndex(sa => sa.type === 'action'))
      .reduce((prev, curr) => {
        cursor.index++;
        return prev.concat(curr);
      }, new Array<StateAction>());
    const repsert = stateActions[cursor.index++];
    const repsertArgs = [...(Array.isArray(repsert.arg) ? repsert.arg : [repsert.arg!])];
    const result = currentState.map(e => {
      const elementValue = queryPaths.reduce((prev, curr) => prev = prev[curr.name] as RecursiveRecord, mustBe.object(e));
      const foundIndex = repsertArgs.findIndex(ua => queryPaths.reduce((prev, curr) => prev = (prev as RecursiveRecord)[curr.name] as RecursiveRecord, ua) === elementValue);
      return foundIndex !== -1 ? repsertArgs.splice(foundIndex, 1)[0]! : e;
    });
    return setCurrentActionReturningNewState({ stateActions, payload: repsert.arg, newState: [...result, ...repsertArgs] });
  }
  const action = stateActions[cursor.index++];
  if (cursor.index < stateActions.length) {
    if (action.type === 'search' && Array.isArray(currentState)) {
      const query = constructQuery({ stateActions, cursor });
      let findIndex = -1;
      if ('find' === action.name) {
        findIndex = currentState.findIndex(query);
        if (findIndex === -1) { throw new Error(errorMessages.FIND_RETURNS_NO_MATCHES); }
      }
      if (stateActions[cursor.index].name === 'delete') {
        return setCurrentActionReturningNewState({ stateActions, payload: null, newState: 'find' === action.name ? currentState.filter((e, i) => findIndex !== i) : currentState.filter(e => !query(e)) });
      } else {
        if ('find' === action.name) {
          return currentState.map((e, i) => i === findIndex
            ? copyNewState({ currentState: e, stateToUpdate: mustBe.object(stateToUpdate)[i], stateActions, cursor }) as RecursiveRecord
            : e);
        } else if ('filter' === action.name) {
          if (stateActions[cursor.index]?.name === 'set') {
            return [
              ...currentState.filter(e => !query(e)),
              ...(mustBe.arrayOf.object(copyNewState({ currentState, stateToUpdate: stateToUpdate, stateActions, cursor }))),
            ];
          } else {
            return currentState.map((e, i) => query(e)
              ? copyNewState({ currentState: e, stateToUpdate: mustBe.arrayOf.object(stateToUpdate)[i], stateActions, cursor: { ...cursor } }) as RecursiveRecord
              : e);
          }
        }
      }
    } else if (removeInvalidateCache.includes(stateActions[cursor.index].name)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [stateActions[cursor.index - 1].name]: other, ...otherState } = mustBe.object(currentState);
      return setCurrentActionReturningNewState({ stateActions, payload: null, newState: otherState })
    } else {
      return { ...currentState as RecursiveRecord, [action.name]: copyNewState({ currentState: mustBe.object(currentState || {})[action.name], stateToUpdate: mustBe.object(stateToUpdate || {})[action.name], stateActions, cursor }) };
    }
  } else if (action.name === 'setSome') {
    if (Array.isArray(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: currentState.map(e => ({ ...mustBe.object(e), ...mustBe.object(action.arg) })) });
    } else {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: { ...mustBe.object(currentState), ...mustBe.object(action.arg) } });
    }
  } else if (action.name === 'add') {
    if (Array.isArray(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: currentState.map(e => mustBe.number(e) + mustBe.number(action.arg)) });
    } else {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: mustBe.number(currentState) + mustBe.number(action.arg) });
    }
  } else if (action.name === 'subtract') {
    if (Array.isArray(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: currentState.map(e => mustBe.number(e) + mustBe.number(action.arg)) });
    } else {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: mustBe.number(currentState) - mustBe.number(action.arg) });
    }
  } else if (action.name === 'setNew') {
    return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: currentState === undefined ? action.arg! : { ...mustBe.object(currentState), ...mustBe.object(action.arg) } });
  } else if (action.name === 'set') {
    return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: action.arg! });
  } else if (action.name === 'setSomeDeep') {
    return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: deepMerge(mustBe.object(currentState), mustBe.object(action.arg)) });
  } else if (action.name === 'clear') {
    return setCurrentActionReturningNewState({ stateActions, payload: null, newState: [] });
  } else if (action.name === 'push') {
    const newState = Array.isArray(action.arg) ? [...mustBe.arrayOf.object(currentState), ...action.arg] : [...mustBe.arrayOf.object(currentState), action.arg!];
    return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState });
  } else if (action.name === 'toggle') {
    if (Array.isArray(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload: null, newState: currentState.map(e => !e) });
    } else {
      return setCurrentActionReturningNewState({ stateActions, payload: null, newState: !currentState });
    }
  }
  throw new Error();
}

export const deepMerge = (old: RecursiveRecord, payload: RecursiveRecord) => {
  const mergeDeep = (target: RecursiveRecord, source: RecursiveRecord) => {
    const output = Object.assign({}, target);
    if (is.object(target) && is.object(source)) {
      Object.keys(source).forEach(key => {
        const val = source[key];
        if (is.object(val) && !is.arrayOf.actual(val)) {
          if (!(key in target)) {
            Object.assign(output, { [key]: val });
          } else {
            output[key] = mergeDeep(mustBe.object(target[key]), mustBe.object(val));
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

