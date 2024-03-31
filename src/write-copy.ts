import { anyLibProp, errorMessages, updateFunctions } from './constant';
import { constructQuery } from './query';
import { Actual, StateAction } from './type';
import { is, mustBe, newRecord } from './type-check';
import { CopyNewStateArgs } from './type-internal';
import { getPayloadOrigAndSanitized } from './utility';
import { setCurrentActionReturningNewState } from './write-action';


export const copyNewState = (
  {
    currentState,
    stateToUpdate,
    stateActions,
    cursor,
  }: CopyNewStateArgs
): unknown => {
  if (!anyLibProp.includes(stateActions[cursor.index].name) && is.array<Record<string, unknown>>(currentState) && mustBe.array(stateToUpdate)) {
    return currentState.map((_, i) => {
      if (currentState[i]) {
        return {
          ...currentState[i],
          ...copyNewState({
            currentState: currentState[i] ?? newRecord(),
            stateToUpdate: stateToUpdate[i] ?? newRecord(),
            stateActions,
            cursor: { ...cursor }
          }) as Record<string, Actual>
        };
      }
      return copyNewState({
        currentState: currentState[i],
        stateToUpdate: stateToUpdate[i],
        stateActions,
        cursor: { ...cursor }
      });
    });
  }
  if (('$mergeMatching' === stateActions[cursor.index].name) && is.array(currentState)) {
    cursor.index++;
    const queryPaths = stateActions
      .slice(cursor.index, cursor.index + stateActions.slice(cursor.index).findIndex(sa => updateFunctions.includes(sa.name)))
      .reduce((prev, curr) => {
        cursor.index++;
        return prev.concat(curr);
      }, new Array<StateAction>());
    const merge = stateActions[cursor.index++];
    const mergeArgState = is.storeInternal(merge.arg) ? merge.arg.$state : merge.arg as Actual;
    const mergeArgs = [...(is.array(mergeArgState) ? mergeArgState : [mergeArgState])];
    const query = (e: Actual) => queryPaths.reduce((prev, curr) => (prev as Record<string, Actual>)[curr.name], e);
    const indicesOld = new Array<number>();
    const currentArrayModified = currentState.map((existingElement, i) => {
      const elementValue = query(existingElement);
      const found = mergeArgs.find(ua => query(ua) === elementValue);
      if (found !== undefined) { indicesOld.push(i); }
      return found ?? existingElement;
    });
    const indicesNew = new Array<number>();
    const newArrayElements = mergeArgs.filter(mergeArg => {
      const elementValue = query(mergeArg);
      const notFound = !currentArrayModified.some(ua => query(ua) === elementValue);
      if (notFound) { indicesNew.push(currentState.length + indicesNew.length) }
      return notFound;
    });
    const newState = [...currentArrayModified, ...newArrayElements];
    const { found, payloadOriginal, payloadSanitized } = getPayloadOrigAndSanitized(merge.arg);
    return setCurrentActionReturningNewState({ stateActions, payload: payloadSanitized, newState, payloadOrig: found ? payloadOriginal : undefined });
  }
  const action = stateActions[cursor.index];
  cursor.index++;
  const payload = action.arg;
  const type = action.name;
  if (cursor.index < stateActions.length) {
    if (type === '$at' && mustBe.number(payload) && mustBe.array(currentState) && mustBe.array(stateToUpdate)) {
      if (currentState[payload] === undefined) { throw new Error(errorMessages.AT_INDEX_OUT_OF_BOUNDS(payload)); }
      return currentState.map((e, i) => i === payload
        ? copyNewState({ currentState: e, stateToUpdate: stateToUpdate[i], stateActions, cursor })
        : e);
    }
    if (type === '$find' && mustBe.array(currentState) && mustBe.array(stateToUpdate)) {
      const query = constructQuery({ stateActions, cursor });
      const findIndex = currentState.findIndex(query);
      if (findIndex === -1) { throw new Error(errorMessages.FIND_RETURNS_NO_MATCHES); }
      if ('$delete' === stateActions[cursor.index].name) {
        return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState.filter((_, i) => findIndex !== i) });
      }
      return currentState.map((e, i) => i === findIndex
        ? copyNewState({ currentState: e, stateToUpdate: stateToUpdate[i], stateActions, cursor })
        : e);
    }
    if (type === '$filter' && mustBe.array(currentState)) {
      const query = constructQuery({ stateActions, cursor });
      if ('$delete' === stateActions[cursor.index].name) {
        return setCurrentActionReturningNewState({
          stateActions,
          payload,
          newState: currentState.filter((_, i) => !query(currentState[i])),
        });
      }
      if ('$set' === stateActions[cursor.index].name) {
        return [
          ...currentState.filter(e => !query(e)),
          ...copyNewState({ currentState, stateToUpdate, stateActions, cursor }) as Array<Record<string, unknown>>,
        ];
      }
      if (mustBe.array<Actual>(stateToUpdate)) {
        return currentState.map((e, i) => query(e)
          ? copyNewState({ currentState: e, stateToUpdate: stateToUpdate[i], stateActions, cursor: { ...cursor } })
          : e);
      }
    }
    const actionNext = stateActions[cursor.index];
    if (['$delete', '$invalidateCache'].includes(actionNext.name) && mustBe.record(currentState)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [type]: other, ...otherState } = currentState;
      return setCurrentActionReturningNewState({ stateActions, payload, newState: otherState })
    }
    if ('$setKey' === actionNext.name && mustBe.record(currentState) && mustBe.string(actionNext.arg)) {
      const { found, payloadOriginal, payloadSanitized } = getPayloadOrigAndSanitized(actionNext.arg);
      const newState = newRecord();
      Object.keys(currentState).forEach(k => {
        const newKey = k === type ? payloadSanitized : k;
        newState[newKey] = currentState[k];
      })
      return setCurrentActionReturningNewState({ stateActions, payload: payloadSanitized, newState, payloadOrig: found ? payloadOriginal : undefined });
    }
    if (is.record<Record<string, unknown>>(currentState) || is.undefined(currentState)) {
      const currentStateRecord = currentState ?? newRecord();
      return {
        ...currentStateRecord,
        [type]: copyNewState({
          currentState: currentStateRecord[type],
          stateToUpdate: (currentStateRecord[type] ?? newRecord()),
          stateActions,
          cursor,
        })
      };
    }
  }
  if (type === '$set') {
    const { found, payloadOriginal, payloadSanitized } = getPayloadOrigAndSanitized(payload);
    return setCurrentActionReturningNewState({ stateActions, newState: payloadSanitized, payload: payloadSanitized, payloadOrig: found ? payloadOriginal : undefined });
  }
  if (type === '$setUnique' && mustBe.array<Actual>(payload)) {
    const { found, payloadOriginal, payloadSanitized } = getPayloadOrigAndSanitized(payload);
    const payloadWithoutDuplicates = Array.from(new Set(payloadSanitized));
    return setCurrentActionReturningNewState({ stateActions, newState: payloadWithoutDuplicates, payload: payloadWithoutDuplicates, payloadOrig: found ? payloadOriginal : undefined });
  }
  if (type === '$patch' && mustBe.record(payload)) {
    if (is.array<Record<string, unknown>>(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState.map(e => ({ ...e, ...payload })) });
    }
    if (is.record(currentState)) {
      const { found, payloadOriginal, payloadSanitized } = getPayloadOrigAndSanitized(payload);
      return setCurrentActionReturningNewState({ stateActions, payload: payloadSanitized, newState: { ...currentState, ...payloadSanitized }, payloadOrig: found ? payloadOriginal : undefined });
    }
  }
  if (type === '$add' && mustBe.number(payload)) {
    if (is.array<number>(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState.map(e => e + payload) });
    }
    if (is.number(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState + payload });
    }
  }
  if (type === '$subtract' && mustBe.number(payload)) {
    if (is.array<number>(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState.map(e => e + payload) });
    }
    if (is.number(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState - payload });
    }
  }
  if (type === '$setNew' && mustBe.record(payload) && mustBe.record(currentState)) {
    const { found, payloadOriginal, payloadSanitized } = getPayloadOrigAndSanitized(payload);
    return setCurrentActionReturningNewState({ stateActions, payload: payloadSanitized, newState: currentState === undefined ? payload : { ...currentState, ...payloadSanitized }, payloadOrig: found ? payloadOriginal : undefined });
  }
  if (type === '$patchDeep' && mustBe.record(payload) && mustBe.record(currentState)) {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: deepMerge(currentState, payload) });
  }
  if (type === '$clear') {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: [] });
  }
  if (type === '$push' && mustBe.array(currentState)) {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: [...currentState, payload] });
  }
  if (type === '$pushMany' && mustBe.array(currentState) && mustBe.array(payload)) {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: [...currentState, ...payload] });
  }
  if (type === '$deDuplicate' && mustBe.array(currentState)) {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: [...new Set(currentState)] });
  }
  if (type === '$toggle') {
    if (is.array(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState.map(e => !e) });
    }
    if (is.boolean(currentState)) {
      return setCurrentActionReturningNewState({ stateActions, payload, newState: !currentState });
    }
  }
  if (type === '$merge' && mustBe.array<unknown>(currentState)) {
    const { found, payloadOriginal, payloadSanitized } = getPayloadOrigAndSanitized(payload);
    const newState = [...currentState, ...(is.array(payloadSanitized) ? payloadSanitized : [payloadSanitized]).filter(e => !currentState.includes(e))];
    return setCurrentActionReturningNewState({ stateActions, payload: payloadSanitized, newState, payloadOrig: found ? payloadOriginal : undefined });
  }
  throw new Error();
}

export const deepMerge = (old: Record<string, unknown>, payload: Record<string, unknown>) => {
  const mergeDeep = (target: Record<string, unknown>, source: Record<string, unknown>) => {
    const output = Object.assign({}, target);
    if (is.record<Record<string, unknown>>(target) && is.record(source)) {
      Object.keys(source).forEach(key => {
        const val = source[key];
        if (is.record(val) && !is.array(val)) {
          if (!(key in target)) {
            Object.assign(output, { [key]: val });
          } else {
            output[key] = mergeDeep(target[key], val);
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
