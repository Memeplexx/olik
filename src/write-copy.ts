import { errorMessages } from './constant';
import { constructQuery } from './query';
import { Actual } from './type';
import { assertIsArray, assertIsBoolean, assertIsNumber, assertIsRecord, assertIsRecordOrUndefined, assertIsString, is, newRecord } from './type-check';
import { CopyNewStateArgs, CopyNewStateArgsAndPayload } from './type-internal';
import { extractPayload } from './utility';


export const copyNewState = (
  arg: CopyNewStateArgs
): unknown => {
  const { currentState, stateActions, cursor } = arg;
  const { arg: payload, name: type } = stateActions[cursor.index];
  const args = { ...arg, type, payload: extractPayload(payload) };
  if (cursor.index < stateActions.length - 1) {
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
    if (!is.libArg(type) && is.array(currentState)) {
      cursor.index--;
      return updateArrayObjectProperties(arg);
    }
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
    return add(args);
  if ('$subtract' === type)
    return subtract(args);
  if ('$setNew' === type)
    return setNew(args);
  if ('$patchDeep' === type)
    return patchDeep(args);
  if ('$clear' === type)
    return clear();
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
  return [...new Set(args.currentState)];
}

const push = (args: CopyNewStateArgsAndPayload) => {
  assertIsArray(args.currentState);
  return [...args.currentState, args.payload];
}

const pushMany = (args: CopyNewStateArgsAndPayload) => {
  assertIsArray(args.currentState); assertIsArray(args.payload);
  return [...args.currentState, ...args.payload];
}

const merge = (args: CopyNewStateArgsAndPayload) => {
  const currentState = args.currentState;
  assertIsArray<unknown>(currentState);
  return [...currentState, ...(is.array(args.payload) ? args.payload : [args.payload]).filter(e => !currentState.includes(e))];
}

const toggle = (args: CopyNewStateArgsAndPayload) => {
  if (is.array(args.currentState))
    return args.currentState.map(e => !e);
  assertIsBoolean(args.currentState);
  return !args.currentState;
}

const setNew = (arg: CopyNewStateArgsAndPayload) => {
  assertIsRecord(arg.currentState);
  assertIsRecord(arg.payload);
  return is.undefined(arg.currentState) ? arg.payload : { ...arg.currentState, ...arg.payload };
}

const set = (args: CopyNewStateArgsAndPayload) => {
  return args.payload;
}

const setUnique = (args: CopyNewStateArgsAndPayload) => {
  assertIsArray(args.payload);
  return [...new Set(args.payload)];
}

const patch = (args: CopyNewStateArgsAndPayload) => {
  const payload = args.payload;
  assertIsRecord(payload);
  if (is.array<Record<string, unknown>>(args.currentState))
    return args.currentState.map(e => ({ ...e, ...payload }));
  assertIsRecord(args.currentState);
  return { ...args.currentState, ...payload };
}

const add = (args: CopyNewStateArgsAndPayload) => {
  const payload = args.payload;
  assertIsNumber(payload);
  if (is.array<number>(args.currentState))
    return args.currentState.map(e => e + payload);
  assertIsNumber(args.currentState);
  return args.currentState + payload;
}

const subtract = (args: CopyNewStateArgsAndPayload) => {
  const payload = args.payload;
  assertIsNumber(payload);
  if (is.array<number>(args.currentState))
    return args.currentState.map(e => e + payload);
  assertIsNumber(args.currentState);
  return args.currentState - payload;
}

const clear = () => {
  return [];
}

const patchDeep = (args: CopyNewStateArgsAndPayload) => {
  assertIsRecord(args.payload); assertIsRecord(args.currentState);
  const recurse = (target: Record<string, unknown>, source: Record<string, unknown>) => {
    const output = { ...target };
    if (!is.record<Record<string, unknown>>(target) || !is.record(source)) 
      return output;
    Object.entries(source).forEach(([key, val]) => {
      if (!is.record(val))
        return Object.assign(output, { [key]: val });
      if (!(key in target))
        return Object.assign(output, { [key]: val });
      output[key] = recurse(target[key], val);
    });
    return output;
  }
  return recurse(args.currentState, args.payload);
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
    if (!is.undefined(found)) 
      indicesOld.push(i);
    return found ?? existingElement;
  });
  const indicesNew = new Array<number>();
  const newArrayElements = mergeArgs.filter(mergeArg => {
    const elementValue = query(mergeArg);
    const notFound = !currentArrayModified.some(ua => query(ua) === elementValue);
    if (notFound) 
      indicesNew.push(currentState.length + indicesNew.length);
    return notFound;
  });
  return [...currentArrayModified, ...newArrayElements];
}

const setObjectKey = (args: CopyNewStateArgsAndPayload) => {
  const { currentState, stateActions, cursor, type: oldKey } = args;
  const newKey = stateActions[cursor.index].arg;
  assertIsRecord(currentState); assertIsString(newKey);
  const payload = extractPayload(newKey);
  const newState = newRecord();
  Object.entries(currentState).forEach(([key, value]) => {
    const newKey = key === oldKey ? payload as string : key;
    newState[newKey] = value;
  })
  return newState;
}

const atArray = (args: CopyNewStateArgsAndPayload) => {
  const { stateToUpdate, currentState, cursor, stateActions, payload } = args;
  assertIsNumber(payload); assertIsArray(currentState); assertIsArray(stateToUpdate);
  if (is.undefined(currentState[payload])) 
    throw new Error(errorMessages.AT_INDEX_OUT_OF_BOUNDS(payload));
  if ('$delete' === stateActions[cursor.index].name)
    return currentState.filter((_, i) => payload !== i);
  return currentState.map((e, i) => i === payload
    ? copyNewState({ currentState: e, stateToUpdate: stateToUpdate[i], stateActions, cursor })
    : e);
}

const findArray = (args: CopyNewStateArgsAndPayload) => {
  const { stateToUpdate, currentState, cursor, stateActions } = args;
  assertIsArray(currentState); assertIsArray(stateToUpdate);
  const query = constructQuery({ stateActions, cursor });
  const findIndex = currentState.findIndex(query);
  if (findIndex === -1) 
    throw new Error(errorMessages.FIND_RETURNS_NO_MATCHES);
  const stateAction = stateActions.slice(0, cursor.index).reverse().find(sa => sa.name === '$find')!;
  stateAction.searchIndices = [findIndex];
  if ('$delete' === stateActions[cursor.index].name)
    return currentState.filter((_, i) => findIndex !== i);
  return currentState.map((e, i) => i === findIndex
    ? copyNewState({ currentState: e, stateToUpdate: stateToUpdate[i], stateActions, cursor })
    : e);
}

const filterArray = (args: CopyNewStateArgsAndPayload) => {
  const { stateToUpdate, currentState, cursor, stateActions } = args;
  assertIsArray(currentState);
  const query = constructQuery({ stateActions, cursor });
  const type = stateActions[cursor.index].name;
  const stateAction = stateActions.slice(0, cursor.index).reverse().find(sa => sa.name === '$filter')!;
  stateAction.searchIndices =  [];
  if ('$delete' === type)
    return currentState.filter((_, i) => {
      const result = query(currentState[i]);
      if (result) stateAction.searchIndices!.push(i);
      return !result;
    });
  if ('$set' === type) {
    const newState = copyNewState({ currentState, stateToUpdate, stateActions, cursor });
    assertIsArray(newState);
    return [
      ...currentState.filter((e, i) => {
        const result = query(e);
        if (result) stateAction.searchIndices!.push(i);
        return !result;
      }),
      ...newState,
    ];
  }
  assertIsArray(stateToUpdate);
  return currentState.map((e, i) => {
    const result = query(e);
    if (result) stateAction.searchIndices!.push(i);
    return result
      ? copyNewState({ currentState: e, stateToUpdate: stateToUpdate[i], stateActions, cursor: { ...cursor } })
      : e
  });
}

const deleteObjectValue = (args: CopyNewStateArgsAndPayload) => {
  const { currentState, type: oldObjectKey } = args;
  assertIsRecord(currentState);
  const { [oldObjectKey]: other, ...newState } = currentState;
  return newState;
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