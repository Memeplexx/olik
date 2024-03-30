import { anyLibProp, errorMessages, updateFunctions } from './constant';
import { constructQuery } from './query';
import { Actual, StateAction } from './type';
import { either, is } from './type-check';
import { CopyNewStateArgs, StoreInternal } from './type-internal';
import { getPayloadOrigAndSanitized } from './utility';
import { setCurrentActionReturningNewState } from './write-action';


export const copyNewState = (
  {
    currentState,
    stateToUpdate,
    stateActions,
    cursor
  }: CopyNewStateArgs
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
    const repsertArgWhichIsPotentiallyAStore = repsert.arg as StoreInternal;
    const repsertArgState = repsertArgWhichIsPotentiallyAStore.$stateActions ? repsertArgWhichIsPotentiallyAStore.$state : repsert.arg;
    const repsertArgs = [...(Array.isArray(repsertArgState) ? repsertArgState : [repsertArgState])];
    const query = (e: Actual) => queryPaths.reduce((prev, curr) => (prev as Record<string, Actual>)[curr.name], e);
    const currentArrayModified = currentState.map(existingElement => {
      const elementValue = query(existingElement);
      return repsertArgs.find(ua => query(ua) === elementValue) ?? existingElement;
    });
    const newArrayElements = repsertArgs.filter(repsertArg => {
      const elementValue = query(repsertArg);
      return !currentArrayModified.some(ua => query(ua) === elementValue);
    });
    const newState = [...currentArrayModified, ...newArrayElements];
    const { found, payloadOriginal, payloadSanitized } = getPayloadOrigAndSanitized(repsert.arg);
    return setCurrentActionReturningNewState({ stateActions, payload: payloadSanitized, newState, payloadOrig: found ? payloadOriginal : undefined });
  }
  const action = stateActions[cursor.index++];
  const payload = action.arg;
  if (cursor.index < stateActions.length) {
    if (['$find', '$filter', '$at'].includes(action.name) && Array.isArray(currentState)) {
      const query = constructQuery({ stateActions, cursor });
      let findIndex = -1;
      if (['$find', '$at'].includes(action.name)) {
        findIndex = currentState.findIndex(query);
        if (findIndex === -1) { throw new Error(errorMessages.FIND_RETURNS_NO_MATCHES); }
      }
      if (stateActions[cursor.index].name === '$delete') {
        return setCurrentActionReturningNewState({ stateActions, payload, newState: ['$find', '$at'].includes(action.name) ? currentState.filter((_, i) => findIndex !== i) : currentState.filter((e, i) => !query(e, i)) });
      } else {
        if (['$find', '$at'].includes(action.name)) {
          return currentState.map((e, i) => i === findIndex
            ? copyNewState({ currentState: e, stateToUpdate: (stateToUpdate as Array<Actual>)[i], stateActions, cursor })
            : e);
        } else if ('$filter' === action.name) {
          if (stateActions[cursor.index]?.name === '$set') {
            return [
              ...currentState.filter((e, i) => !query(e, i)),
              ...copyNewState({ currentState, stateToUpdate, stateActions, cursor }) as Array<Record<string, unknown>>,
            ];
          } else {
            return currentState.map((e, i) => query(e, i)
              ? copyNewState({ currentState: e, stateToUpdate: (stateToUpdate as Array<Actual>)[i], stateActions, cursor: { ...cursor } })
              : e);
          }
        }
      }
    } else if (['$delete', '$invalidateCache'].includes(stateActions[cursor.index].name)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [stateActions[cursor.index - 1].name]: other, ...otherState } = currentState as Record<string, unknown>;
      return setCurrentActionReturningNewState({ stateActions, payload, newState: otherState })
    } else if ('$setKey' === stateActions[cursor.index].name) {
      const { found, payloadOriginal, payloadSanitized } = getPayloadOrigAndSanitized(stateActions[stateActions.length - 1].arg);
      const newState = {} as Record<string, unknown>;
      Object.keys(currentState as Record<string, unknown>).forEach(k => {
        const newKey = k === stateActions[stateActions.length - 2].name ? payloadSanitized as string : k;
        newState[newKey] = (currentState as Record<string, unknown>)[k];
      })
      return setCurrentActionReturningNewState({ stateActions, payload: payloadSanitized, newState, payloadOrig: found ? payloadOriginal : undefined });
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
    const { found, payloadOriginal, payloadSanitized } = getPayloadOrigAndSanitized(payload);
    return setCurrentActionReturningNewState({ stateActions, newState: payloadSanitized, payload: payloadSanitized, payloadOrig: found ? payloadOriginal : undefined });
  } else if (action.name === '$setUnique') {
    const { found, payloadOriginal, payloadSanitized } = getPayloadOrigAndSanitized(payload);
    const payloadWithoutDuplicates = Array.from(new Set(payloadSanitized as Array<Actual>));
    return setCurrentActionReturningNewState({ stateActions, newState: payloadWithoutDuplicates, payload: payloadWithoutDuplicates, payloadOrig: found ? payloadOriginal : undefined });
  } else if (action.name === '$patch') {
    if (Array.isArray(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState.map(e => ({ ...e, ...payload as Record<string, unknown> })) });
    } else {
      const { found, payloadOriginal, payloadSanitized } = getPayloadOrigAndSanitized(payload as Record<string, unknown>);
      return setCurrentActionReturningNewState({ stateActions, payload: payloadSanitized, newState: { ...currentState as Record<string, unknown>, ...payloadSanitized }, payloadOrig: found ? payloadOriginal : undefined });
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
    const { found, payloadOriginal, payloadSanitized } = getPayloadOrigAndSanitized(payload as Record<string, unknown>);
    return setCurrentActionReturningNewState({ stateActions, payload: payloadSanitized, newState: currentState === undefined ? payload : { ...currentState as Record<string, unknown>, ...payloadSanitized }, payloadOrig: found ? payloadOriginal : undefined });
  } else if (action.name === '$patchDeep') {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: deepMerge(currentState as Record<string, unknown>, payload as Record<string, unknown>) });
  } else if (action.name === '$clear') {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: [] });
  } else if (action.name === '$push') {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: [...currentState as Array<Actual>, payload] });
  } else if (action.name === '$pushMany') {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: [...currentState as Array<Actual>, ...payload as Array<Actual>] });
  } else if (action.name === '$deDuplicate') {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: Array.from(new Set(currentState as Array<Actual>)) });
  } else if (action.name === '$toggle') {
    if (Array.isArray(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState.map(e => !e) });
    } else {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: !currentState });
    }
  } else if (action.name === '$merge') {
    const { found, payloadOriginal, payloadSanitized } = getPayloadOrigAndSanitized(payload);
    const currentStateArray = currentState as unknown[];
    const newState = [...currentStateArray, ...(Array.isArray(payloadSanitized) ? payloadSanitized : [payloadSanitized]).filter(e => !currentStateArray.includes(e))];
    return setCurrentActionReturningNewState({ stateActions, payload: payloadSanitized, newState, payloadOrig: found ? payloadOriginal : undefined });
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


