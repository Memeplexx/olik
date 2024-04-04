import { errorMessages } from './constant';
import { constructQuery } from './query';
import { Actual } from './type';
import { assertIsArray, assertIsBoolean, assertIsNumber, assertIsRecord, assertIsRecordOrUndefined, assertIsString, is, newRecord } from './type-check';
import { CopyNewStateArgs, CopyNewStateArgsAndPayload } from './type-internal';
import { extractPayload } from './utility';
import { setCurrentActionReturningNewState } from './write-action';


export const copyNewState = (
  arg: CopyNewStateArgs
): unknown => {
  const { currentState, stateActions, cursor } = arg;
  const { arg: payload, name: type } = stateActions[cursor.index];
  const args = { ...arg, type, ...extractPayload(payload) };
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

const deDuplicate = (args: CopyNewStateArgsAndPayload) => {
  assertIsArray(args.currentState);
  return setCurrentActionReturningNewState({ ...args, newState: [...new Set(args.currentState)] });
}

const push = (args: CopyNewStateArgsAndPayload) => {
  assertIsArray(args.currentState);
  return setCurrentActionReturningNewState({ ...args, newState: [...args.currentState, args.payloadSanitized] });
}

const pushMany = (args: CopyNewStateArgsAndPayload) => {
  assertIsArray(args.currentState); assertIsArray(args.payloadSanitized);
  return setCurrentActionReturningNewState({ ...args, newState: [...args.currentState, ...args.payloadSanitized] });
}

const merge = (args: CopyNewStateArgsAndPayload) => {
  const currentState = args.currentState;
  assertIsArray<unknown>(currentState);
  return setCurrentActionReturningNewState({ ...args, newState: [...currentState, ...(is.array(args.payloadSanitized) ? args.payloadSanitized : [args.payloadSanitized]).filter(e => !currentState.includes(e))] });
}

const toggle = (args: CopyNewStateArgsAndPayload) => {
  if (is.array(args.currentState)) {
    return setCurrentActionReturningNewState({ ...args, newState: args.currentState.map(e => !e) });
  }
  assertIsBoolean(args.currentState);
  return setCurrentActionReturningNewState({ ...args, newState: !args.currentState });
}

const setNew = (arg: CopyNewStateArgsAndPayload) => {
  assertIsRecord(arg.payloadSanitized);
  return setCurrentActionReturningNewState({ ...arg, newState: arg.currentState === undefined ? arg.payloadSanitized : { ...arg.currentState, ...arg.payloadSanitized } });
}

const set = (args: CopyNewStateArgsAndPayload) => {
  return setCurrentActionReturningNewState({ ...args, newState: args.payloadSanitized });
}

const setUnique = (args: CopyNewStateArgsAndPayload) => {
  assertIsArray(args.payloadSanitized);
  return setCurrentActionReturningNewState({ newState: [...new Set(args.payloadSanitized)], ...args });
}

const patch = (args: CopyNewStateArgsAndPayload) => {
  const payload = args.payloadSanitized;
  assertIsRecord(payload);
  if (is.array<Record<string, unknown>>(args.currentState)) {
    return setCurrentActionReturningNewState({ newState: args.currentState.map(e => ({ ...e, ...payload })), ...args });
  }
  assertIsRecord(args.currentState);
  return setCurrentActionReturningNewState({ newState: { ...args.currentState, ...payload }, ...args });
}

const addNumber = (args: CopyNewStateArgsAndPayload) => {
  const payloadSanitized = args.payloadSanitized;
  assertIsNumber(payloadSanitized);
  if (is.array<number>(args.currentState)) {
    return setCurrentActionReturningNewState({ ...args, newState: args.currentState.map(e => e + payloadSanitized) });
  }
  assertIsNumber(args.currentState);
  return setCurrentActionReturningNewState({ ...args, newState: args.currentState + payloadSanitized });
}

const subtractNumber = (args: CopyNewStateArgsAndPayload) => {
  const payloadSanitized = args.payloadSanitized;
  assertIsNumber(payloadSanitized);
  if (is.array<number>(args.currentState)) {
    return setCurrentActionReturningNewState({ ...args, newState: args.currentState.map(e => e + payloadSanitized) });
  }
  assertIsNumber(args.currentState);
  return setCurrentActionReturningNewState({ ...args, newState: args.currentState - payloadSanitized });
}

const clear = (args: CopyNewStateArgsAndPayload) => {
  return setCurrentActionReturningNewState({ ...args, newState: [] });
}

const patchDeep = (args: CopyNewStateArgsAndPayload) => {
  assertIsRecord(args.payloadSanitized); assertIsRecord(args.currentState);
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
  const newState = recurse(args.currentState, args.payloadSanitized);
  return setCurrentActionReturningNewState({ ...args, newState });
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

const mergeMatching = (args: CopyNewStateArgsAndPayload) => {
  const { currentState, cursor, stateActions } = args;
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
  return setCurrentActionReturningNewState({ ...args, newState, ...extractPayload(merge.arg) });
}

const setObjectKey = (args: CopyNewStateArgsAndPayload) => {
  const { currentState, stateActions, cursor, type: oldKey } = args;
  const newKey = stateActions[cursor.index].arg;
  assertIsRecord(currentState); assertIsString(newKey);
  const payload = extractPayload(newKey);
  const newState = newRecord();
  Object.entries(currentState).forEach(([key, value]) => {
    const newKey = key === oldKey ? payload.payloadSanitized as string : key;
    newState[newKey] = value;
  })
  return setCurrentActionReturningNewState({ newState, ...args });
}

const atArray = (args: CopyNewStateArgsAndPayload) => {
  const { stateToUpdate, currentState, cursor, stateActions, payloadSanitized } = args;
  assertIsNumber(payloadSanitized); assertIsArray(currentState); assertIsArray(stateToUpdate);
  if (currentState[payloadSanitized] === undefined) { throw new Error(errorMessages.AT_INDEX_OUT_OF_BOUNDS(payloadSanitized)); }
  return currentState.map((e, i) => i === payloadSanitized
    ? copyNewState({ currentState: e, stateToUpdate: stateToUpdate[i], stateActions, cursor })
    : e);
}

const findArray = (args: CopyNewStateArgsAndPayload) => {
  const { stateToUpdate, currentState, cursor, stateActions } = args;
  assertIsArray(currentState); assertIsArray(stateToUpdate);
  const query = constructQuery({ stateActions, cursor });
  const findIndex = currentState.findIndex(query);
  if (findIndex === -1) { throw new Error(errorMessages.FIND_RETURNS_NO_MATCHES); }
  if ('$delete' === stateActions[cursor.index].name) {
    return setCurrentActionReturningNewState({ ...args, newState: currentState.filter((_, i) => findIndex !== i) });
  }
  return currentState.map((e, i) => i === findIndex
    ? copyNewState({ currentState: e, stateToUpdate: stateToUpdate[i], stateActions, cursor })
    : e);
}

const filterArray = (args: CopyNewStateArgsAndPayload) => {
  const { stateToUpdate, currentState, cursor, stateActions } = args;
  assertIsArray(currentState);
  const query = constructQuery({ stateActions, cursor });
  const type = stateActions[cursor.index].name;
  if ('$delete' === type) {
    return setCurrentActionReturningNewState({
      ...args,
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

const deleteObjectValue = (args: CopyNewStateArgsAndPayload) => {
  const { currentState, type: oldObjectKey } = args;
  assertIsRecord(currentState);
  const { [oldObjectKey]: other, ...newState } = currentState;
  return setCurrentActionReturningNewState({ ...args, newState })
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