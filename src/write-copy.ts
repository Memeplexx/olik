import { errorMessages } from './constant';
import { constructQuery } from './query';
import { Actual, RecursiveRecord, StateAction } from './type';
import { either, is, mustBe } from './type-check';
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
      currentState: unknown,
      stateToUpdate: Actual,
      stateActions: ReadonlyArray<StateAction>,
      cursor: { index: number }
    }
): unknown => {
  if (is.arrayOf.record(currentState) && (stateActions[cursor.index].type === 'property')) {
    return currentState.map((e, i) => is.record(currentState[i])
      ? { ...currentState[i], ...mustBe.record(copyNewState({ currentState: currentState[i] || {}, stateToUpdate: (mustBe.arrayOf.record(stateToUpdate)[i] || {}), stateActions, cursor: { ...cursor } })) }
      : copyNewState({ currentState: currentState[i] || {}, stateToUpdate: (stateToUpdate as Array<RecursiveRecord>)[i] || {}, stateActions, cursor: { ...cursor } }) as Actual);
  } else if (is.arrayOf.actual(currentState) && (stateActions[cursor.index].type === 'mergeMatching')) {
    cursor.index++;
    const queryPaths = stateActions
      .slice(cursor.index, cursor.index + stateActions.slice(cursor.index).findIndex(sa => sa.type === 'action'))
      .reduce((prev, curr) => {
        cursor.index++;
        return prev.concat(curr);
      }, new Array<StateAction>());
    const repsert = stateActions[cursor.index++];
    const repsertArgs = [...(is.arrayOf.actual(repsert.arg) ? repsert.arg : [repsert.arg!])];
    const result = currentState.map(e => {
      const elementValue = queryPaths.reduce((prev, curr) => prev = prev[curr.name] as RecursiveRecord, mustBe.record(e));
      const foundIndex = repsertArgs.findIndex(ua => queryPaths.reduce((prev, curr) => prev = (prev as RecursiveRecord)[curr.name] as RecursiveRecord, ua) === elementValue);
      return foundIndex !== -1 ? repsertArgs.splice(foundIndex, 1)[0]! : e;
    });
    return setCurrentActionReturningNewState({ stateActions, payload: repsert.arg, newState: [...result, ...repsertArgs] });
  }
  const action = stateActions[cursor.index++];
  if (cursor.index < stateActions.length) {
    if (action.type === 'search' && is.arrayOf.actual(currentState)) {
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
            ? copyNewState({ currentState: e, stateToUpdate: mustBe.arrayOf.actual(stateToUpdate)[i], stateActions, cursor })
            : e);
        } else if ('filter' === action.name) {
          if (stateActions[cursor.index]?.name === 'set') {
            return [
              ...currentState.filter(e => !query(e)),
              ...(mustBe.arrayOf.record(copyNewState({ currentState, stateToUpdate: stateToUpdate, stateActions, cursor }))),
            ];
          } else {
            return currentState.map((e, i) => query(e)
              ? copyNewState({ currentState: e, stateToUpdate: mustBe.arrayOf.actual(stateToUpdate)[i], stateActions, cursor: { ...cursor } })
              : e);
          }
        }
      }
    } else if (removeInvalidateCache.includes(stateActions[cursor.index].name)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [stateActions[cursor.index - 1].name]: other, ...otherState } = mustBe.record(currentState);
      return setCurrentActionReturningNewState({ stateActions, payload: null, newState: otherState })
    } else {
      return {
        ...currentState as RecursiveRecord,
        [action.name]: copyNewState({
          currentState: mustBe.record(either(currentState).else({}))[action.name],
          stateToUpdate: either(mustBe.record(either(stateToUpdate).else({}))[action.name]).else({}),
          stateActions,
          cursor
        })
      };
    }
  } else if (action.name === 'setSome') {
    if (is.arrayOf.actual(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: currentState.map(e => ({ ...mustBe.record(e), ...mustBe.record(action.arg) })) });
    } else {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: { ...mustBe.record(currentState), ...mustBe.record(action.arg) } });
    }
  } else if (action.name === 'add') {
    if (is.arrayOf.actual(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: currentState.map(e => mustBe.number(e) + mustBe.number(action.arg)) });
    } else {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: mustBe.number(currentState) + mustBe.number(action.arg) });
    }
  } else if (action.name === 'subtract') {
    if (is.arrayOf.actual(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: currentState.map(e => mustBe.number(e) + mustBe.number(action.arg)) });
    } else {
      return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: mustBe.number(currentState) - mustBe.number(action.arg) });
    }
  } else if (action.name === 'setNew') {
    return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: currentState === undefined ? action.arg! : { ...mustBe.record(currentState), ...mustBe.record(action.arg) } });
  } else if (action.name === 'set') {
    return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: action.arg! });
  } else if (action.name === 'setSomeDeep') {
    return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState: deepMerge(mustBe.record(currentState), mustBe.record(action.arg)) });
  } else if (action.name === 'clear') {
    return setCurrentActionReturningNewState({ stateActions, payload: null, newState: [] });
  } else if (action.name === 'push') {
    const newState = is.arrayOf.actual(action.arg) ? [...mustBe.arrayOf.actual(currentState), ...action.arg] : [...mustBe.arrayOf.actual(currentState), action.arg!];
    return setCurrentActionReturningNewState({ stateActions, payload: action.arg, newState });
  } else if (action.name === 'toggle') {
    if (is.arrayOf.actual(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload: null, newState: currentState.map(e => !e) });
    } else {
      return setCurrentActionReturningNewState({ stateActions, payload: null, newState: !currentState });
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
        if (is.record(val) && !is.arrayOf.actual(val)) {
          if (!(key in target)) {
            Object.assign(output, { [key]: val });
          } else {
            output[key] = mergeDeep(mustBe.record(target[key]), mustBe.record(val));
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

