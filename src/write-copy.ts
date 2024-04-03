import { errorMessages } from './constant';
import { constructQuery } from './query';
import { Actual } from './type';
import { assertIsArray, assertIsBoolean, assertIsNumber, assertIsRecord, assertIsRecordOrUndefined, assertIsString, is, newRecord } from './type-check';
import { CopyNewStateArgs, CopyNewStateArgsAndPayload } from './type-internal';
import { getPayloadOrigAndSanitized } from './utility';
import { setCurrentActionReturningNewState } from './write-action';


export const copyNewState = (
  arg: CopyNewStateArgs
): unknown => {
  const { currentState, stateActions, cursor } = arg;
  const { arg: payload, name: type } = stateActions[cursor.index];
  // const p = extractPayload(payload);
  const args = { ...arg, payload, type };
  if (cursor.index < stateActions.length - 1) {
    if (!is.libArg(type) && is.array(currentState))
      return updateArrayObjectProperties(arg);
    cursor.index++;
    if ('$at' === type)
      return atArray(args);
    if ('$find' === type)
      return findArray(args);
    if ('$filter' === type)
      return filterArray(args);
    if ('$mergeMatching' === type)
      return mergeMatching(args);
    const typeNext = stateActions[cursor.index].name;
    if ('$delete' === typeNext || '$invalidateCache' === typeNext)
      return deleteObjectValue(args);
    if ('$setKey' === typeNext)
      return setObjectKey(args);
    if (is.record(currentState) || is.undefined(currentState))
      return copyObjectProperty(args);
  }
  if ('$set' === type)
    return set(args);
  if ('$setUnique' === type)
    return setUnique(args);
  if ('$patch' === type)
    return patch(args);
  if ('$add' === type)
    return addNumber(args);
  if ('$subtract' === type)
    return subtractNumber(args);
  if ('$setNew' === type)
    return setNew(args);
  if ('$patchDeep' === type)
    return patchDeep(args);
  if ('$clear' === type)
    return clear(args);
  if ('$push' === type)
    return push(args);
  if ('$pushMany' === type)
    return pushMany(args);
  if ('$deDuplicate' === type)
    return deDuplicate(args);
  if ('$toggle' === type)
    return toggle(args);
  if ('$merge' === type)
    return merge(args);
  throw new Error();
}

const deDuplicate = ({ currentState, stateActions, payload }: CopyNewStateArgsAndPayload) => {
  assertIsArray(currentState);
  return setCurrentActionReturningNewState({ stateActions, payload, newState: [...new Set(currentState)] });
}

const push = ({ currentState, stateActions, payload }: CopyNewStateArgsAndPayload) => {
  assertIsArray(currentState);
  return setCurrentActionReturningNewState({ stateActions, payload, newState: [...currentState, payload] });
}

const pushMany = ({ currentState, stateActions, payload }: CopyNewStateArgsAndPayload) => {
  assertIsArray(currentState); assertIsArray(payload);
  return setCurrentActionReturningNewState({ stateActions, payload, newState: [...currentState, ...payload] });
}

const merge = ({ currentState, stateActions, payload }: CopyNewStateArgsAndPayload) => {
  assertIsArray<unknown>(currentState);
  const p = getPayloadOrigAndSanitized(payload);
  const newState = [...currentState, ...(is.array(p.payloadSanitized) ? p.payloadSanitized : [p.payloadSanitized]).filter(e => !currentState.includes(e))];
  return setCurrentActionReturningNewState({ stateActions, payload: p.payloadSanitized, newState, ...p });
}

const toggle = ({ currentState, stateActions, payload }: CopyNewStateArgsAndPayload) => {
  if (is.array(currentState)) {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState.map(e => !e) });
  }
  assertIsBoolean(currentState);
  return setCurrentActionReturningNewState({ stateActions, payload, newState: !currentState });
}

const setNew = ({ currentState, stateActions, payload }: CopyNewStateArgsAndPayload) => {
  assertIsRecord(payload); assertIsRecord(currentState);
  const p = getPayloadOrigAndSanitized(payload);
  return setCurrentActionReturningNewState({ stateActions, payload: p.payloadSanitized, newState: currentState === undefined ? payload : { ...currentState, ...p.payloadSanitized }, ...p });
}

const set = ({ stateActions, payload }: CopyNewStateArgsAndPayload) => {
  const p = getPayloadOrigAndSanitized(payload);
  return setCurrentActionReturningNewState({ stateActions, newState: p.payloadSanitized, payload: p.payloadSanitized, ...p });
}

const setUnique = ({ stateActions, payload }: CopyNewStateArgsAndPayload) => {
  assertIsArray(payload);
  const p = getPayloadOrigAndSanitized(payload);
  const payloadWithoutDuplicates = [...new Set(p.payloadSanitized)];
  return setCurrentActionReturningNewState({ stateActions, newState: payloadWithoutDuplicates, payload: payloadWithoutDuplicates, ...p });
}

const patch = ({ currentState, stateActions, payload }: CopyNewStateArgsAndPayload) => {
  assertIsRecord(payload);
  if (is.array<Record<string, unknown>>(currentState)) {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState.map(e => ({ ...e, ...payload })) });
  }
  assertIsRecord(currentState);
  const p = getPayloadOrigAndSanitized(payload);
  return setCurrentActionReturningNewState({ stateActions, payload: p.payloadSanitized, newState: { ...currentState, ...p.payloadSanitized }, ...p });
}

const addNumber = ({ currentState, stateActions, payload }: CopyNewStateArgsAndPayload) => {
  assertIsNumber(payload);
  if (is.array<number>(currentState)) {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState.map(e => e + payload) });
  }
  assertIsNumber(currentState);
  return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState + payload });
}

const subtractNumber = ({ currentState, stateActions, payload }: CopyNewStateArgsAndPayload) => {
  assertIsNumber(payload);
  if (is.array<number>(currentState)) {
    return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState.map(e => e + payload) });
  }
  assertIsNumber(currentState);
  return setCurrentActionReturningNewState({ stateActions, payload, newState: currentState - payload });
}

const clear = ({ stateActions, payload }: CopyNewStateArgsAndPayload) => {
  return setCurrentActionReturningNewState({ stateActions, payload, newState: [] });
}

const patchDeep = ({ currentState, stateActions, payload }: CopyNewStateArgsAndPayload) => {
  assertIsRecord(payload); assertIsRecord(currentState);
  const recurse = (target: Record<string, unknown>, source: Record<string, unknown>) => {
    const output = { ...target };
    if (!is.record<Record<string, unknown>>(target) || !is.record(source)) return output;
    Object.entries(source).forEach(([key, val]) => {
      if (is.record(val) && !is.array(val)) {
        if (!(key in target)) {
          Object.assign(output, { [key]: val });
        } else {
          output[key] = recurse(target[key], val);
        }
      } else {
        Object.assign(output, { [key]: val });
      }
    });
    return output;
  }
  const newState = recurse(currentState, payload);
  return setCurrentActionReturningNewState({ stateActions, payload, newState });
}

const updateArrayObjectProperties = ({ stateToUpdate, currentState, cursor, stateActions }: CopyNewStateArgs) => {
  assertIsArray(stateToUpdate);
  assertIsArray<Record<string, unknown>>(currentState);
  return currentState.map((_, i) => {
    if (currentState[i]) {
      const newState = copyNewState({
        currentState: currentState[i] ?? newRecord(),
        stateToUpdate: stateToUpdate[i] ?? newRecord(),
        stateActions,
        cursor: { ...cursor }
      });
      assertIsRecord(newState);
      return {
        ...currentState[i],
        ...newState
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

const mergeMatching = ({ currentState, cursor, stateActions }: CopyNewStateArgsAndPayload) => {
  assertIsArray(currentState);
  const nextUpdateIndex = stateActions.slice(cursor.index).findIndex(sa => is.anyUpdateFunction(sa.name));
  const queryPaths = stateActions.slice(cursor.index, cursor.index + nextUpdateIndex);
  cursor.index += queryPaths.length;
  const merge = stateActions[cursor.index++];
  const mergeArgState = is.storeInternal(merge.arg) ? merge.arg.$state : merge.arg;
  const mergeArgs = [...(is.array(mergeArgState) ? mergeArgState : [mergeArgState])];
  assertIsArray(mergeArgs);
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
  const p = getPayloadOrigAndSanitized(merge.arg);
  return setCurrentActionReturningNewState({ stateActions, payload: p.payloadSanitized, newState, ...p });
}

const setObjectKey = ({ currentState, stateActions, cursor, type: oldKey }: CopyNewStateArgsAndPayload) => {
  const newKey = stateActions[cursor.index].arg;
  assertIsRecord(currentState); assertIsString(newKey);
  const p = getPayloadOrigAndSanitized(newKey);
  const newState = newRecord();
  Object.entries(currentState).forEach(([key, value]) => {
    const newKey = key === oldKey ? p.payloadSanitized : key;
    newState[newKey] = value;
  })
  return setCurrentActionReturningNewState({ stateActions, payload: p.payloadSanitized, newState, ...p });
}

const atArray = ({ stateToUpdate, currentState, cursor, stateActions, payload }: CopyNewStateArgsAndPayload) => {
  assertIsNumber(payload); assertIsArray(currentState); assertIsArray(stateToUpdate);
  if (currentState[payload] === undefined) { throw new Error(errorMessages.AT_INDEX_OUT_OF_BOUNDS(payload)); }
  return currentState.map((e, i) => i === payload
    ? copyNewState({ currentState: e, stateToUpdate: stateToUpdate[i], stateActions, cursor })
    : e);
}

const findArray = ({ stateToUpdate, currentState, cursor, stateActions, payload }: CopyNewStateArgsAndPayload) => {
  assertIsArray(currentState); assertIsArray(stateToUpdate);
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

const filterArray = ({ stateToUpdate, currentState, cursor, stateActions, payload }: CopyNewStateArgsAndPayload) => {
  assertIsArray(currentState);
  const query = constructQuery({ stateActions, cursor });
  const type = stateActions[cursor.index].name;
  if ('$delete' === type) {
    return setCurrentActionReturningNewState({
      stateActions,
      payload,
      newState: currentState.filter((_, i) => !query(currentState[i])),
    });
  }
  if ('$set' === type) {
    const newState = copyNewState({ currentState, stateToUpdate, stateActions, cursor });
    assertIsArray(newState);
    return [
      ...currentState.filter(e => !query(e)),
      ...newState,
    ];
  }
  assertIsArray(stateToUpdate);
  return currentState.map((e, i) => query(e)
    ? copyNewState({ currentState: e, stateToUpdate: stateToUpdate[i], stateActions, cursor: { ...cursor } })
    : e);
}

const deleteObjectValue = ({ currentState, stateActions, payload, type: oldObjectKey }: CopyNewStateArgsAndPayload) => {
  assertIsRecord(currentState);
  const { [oldObjectKey]: other, ...newState } = currentState;
  return setCurrentActionReturningNewState({ stateActions, payload, newState })
}

const copyObjectProperty = ({ currentState, stateActions, cursor, type }: CopyNewStateArgsAndPayload) => {
  assertIsRecordOrUndefined(currentState);
  const currentStateRecord = currentState ?? newRecord();
  return {
    ...currentStateRecord,
    [type]: copyNewState({
      currentState: currentStateRecord[type],
      stateToUpdate: currentStateRecord[type] ?? newRecord(),
      stateActions,
      cursor,
    })
  };
}