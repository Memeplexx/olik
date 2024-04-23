import { errorMessages } from './constant';
import { constructQuery } from './query';
import { Actual } from './type';
import { as, assertIsArray, assertIsNumber, assertIsRecord, is, newRecord } from './type-check';
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

const deDuplicate = ({ currentState }: CopyNewStateArgsAndPayload) => {
  return [...new Set(as.array(currentState))];
}

const push = ({ currentState, payload }: CopyNewStateArgsAndPayload) => {
  return [...as.array(currentState), payload];
}

const pushMany = ({ currentState, payload }: CopyNewStateArgsAndPayload) => {
  return [...as.array(currentState), ...as.array(payload)];
}

const merge = ({ currentState, payload }: CopyNewStateArgsAndPayload) => {
  assertIsArray<unknown>(currentState);
  return [...currentState, ...(is.array(payload) ? payload : [payload]).filter(e => !currentState.includes(e))];
}

const toggle = ({ currentState }: CopyNewStateArgsAndPayload) => {
  if (is.array(currentState))
    return currentState.map(e => !e);
  return !currentState;
}

const setNew = ({ currentState, payload }: CopyNewStateArgsAndPayload) => {
  return is.undefined(currentState) ? payload : { ...as.record(currentState), ...as.record(payload) };
}

const set = (args: CopyNewStateArgsAndPayload) => {
  return args.payload;
}

const setUnique = ({ payload }: CopyNewStateArgsAndPayload) => {
  return [...new Set(as.array(payload))];
}

const patch = ({ payload, currentState }: CopyNewStateArgsAndPayload) => {
  assertIsRecord(payload);
  if (is.array<Record<string, unknown>>(currentState))
    return currentState.map(e => ({ ...e, ...payload }));
  return { ...as.record(currentState), ...payload };
}

const add = ({ payload, currentState }: CopyNewStateArgsAndPayload) => {
  assertIsNumber(payload);
  if (is.array<number>(currentState))
    return currentState.map(e => e + payload);
  return as.number(currentState) + payload;
}

const subtract = ({ payload, currentState }: CopyNewStateArgsAndPayload) => {
  assertIsNumber(payload);
  if (is.array<number>(currentState))
    return currentState.map(e => e + payload);
  return as.number(currentState) - payload;
}

const clear = () => {
  return [];
}

const patchDeep = ({ payload, currentState }: CopyNewStateArgsAndPayload) => {
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
  return recurse(as.record(currentState), as.record(payload));
}

const updateArrayObjectProperties = ({ stateToUpdate, currentState, cursor, stateActions }: CopyNewStateArgs) => {
  return as.array<Record<string, unknown>>(currentState).map((e, i) => {
    if (!is.undefined(e)) return {
      ...e,
      ...as.record(copyNewState({
        currentState: e ?? newRecord(),
        stateToUpdate: as.array(stateToUpdate)[i] ?? newRecord(),
        stateActions,
        cursor: { ...cursor }
      }))
    };
    return copyNewState({
      currentState: e,
      stateToUpdate: as.array(stateToUpdate)[i],
      stateActions,
      cursor: { ...cursor }
    });
  });
}

const mergeMatching = ({ currentState, cursor, stateActions }: CopyNewStateArgsAndPayload) => {
  const nextUpdateIndex = stateActions.slice(cursor.index).findIndex(sa => is.anyUpdateFunction(sa.name));
  const queryPaths = stateActions.slice(cursor.index, cursor.index + nextUpdateIndex);
  cursor.index += queryPaths.length;
  const merge = stateActions[cursor.index++];
  const mergeArgState = is.storeInternal(merge.arg) ? merge.arg.$state : merge.arg;
  const mergeArgs = [...(is.array(mergeArgState) ? mergeArgState : [mergeArgState])];
  const query = (e: Actual) => queryPaths.reduce((prev, curr) => (prev as Record<string, Actual>)[curr.name], e);
  const indicesOld = new Array<number>();
  const currentArrayModified = as.array(currentState).map((existingElement, i) => {
    const elementValue = query(existingElement);
    const found = as.array(mergeArgs).find(ua => query(ua) === elementValue);
    if (!is.undefined(found))
      indicesOld.push(i);
    return found ?? existingElement;
  });
  const indicesNew = new Array<number>();
  const newArrayElements = as.array(mergeArgs).filter(mergeArg => {
    const elementValue = query(mergeArg);
    const notFound = !currentArrayModified.some(ua => query(ua) === elementValue);
    if (notFound)
      indicesNew.push(as.array(currentState).length + indicesNew.length);
    return notFound;
  });
  return [...currentArrayModified, ...newArrayElements];
}

const setObjectKey = ({ currentState, stateActions, cursor, type: oldKey }: CopyNewStateArgsAndPayload) => {
  const newKey = stateActions[cursor.index].arg;
  const payload = extractPayload(as.string(newKey));
  return Object.entries(as.record(currentState))
    .reduce((acc, [key, value]) => Object.assign(acc, { [key === oldKey ? payload : key]: value }), newRecord());
}

const atArray = ({ stateToUpdate, currentState, cursor, stateActions, payload }: CopyNewStateArgsAndPayload) => {
  assertIsNumber(payload); assertIsArray(currentState);
  if (is.undefined(currentState[payload]))
    throw new Error(errorMessages.AT_INDEX_OUT_OF_BOUNDS(payload));
  if ('$delete' === stateActions[cursor.index].name)
    return currentState.filter((_, i) => payload !== i);
  return currentState.map((e, i) => i === payload
    ? copyNewState({ currentState: e, stateToUpdate: as.array(stateToUpdate)[i], stateActions, cursor })
    : e);
}

const findArray = ({ stateToUpdate, currentState, cursor, stateActions }: CopyNewStateArgsAndPayload) => {
  assertIsArray(currentState);
  const query = constructQuery({ stateActions, cursor });
  const findIndex = currentState.findIndex(query);
  if (findIndex === -1)
    throw new Error(errorMessages.FIND_RETURNS_NO_MATCHES);
  const stateAction = stateActions.slice(0, cursor.index).reverse().find(sa => sa.name === '$find')!;
  stateAction.searchIndices = [findIndex];
  if ('$delete' === stateActions[cursor.index].name)
    return currentState.filter((_, i) => findIndex !== i);
  return currentState.map((e, i) => i === findIndex
    ? copyNewState({ currentState: e, stateToUpdate: as.array(stateToUpdate)[i], stateActions, cursor })
    : e);
}

const filterArray = ({ stateToUpdate, currentState, cursor, stateActions }: CopyNewStateArgsAndPayload) => {
  assertIsArray(currentState);
  const query = constructQuery({ stateActions, cursor });
  const type = stateActions[cursor.index].name;
  const stateAction = stateActions.slice(0, cursor.index).reverse().find(sa => sa.name === '$filter')!;
  stateAction.searchIndices = currentState.map((e, i) => query(e) ? i : -1).filter(i => i !== -1);
  if ('$delete' === type)
    return currentState.filter((_, i) => !stateAction.searchIndices!.includes(i));
  if ('$set' === type) {
    return [
      ...currentState.filter((_, i) => !stateAction.searchIndices!.includes(i)),
      ...as.array(copyNewState({ currentState, stateToUpdate, stateActions, cursor })),
    ];
  }
  return currentState.map((e, i) => stateAction.searchIndices!.includes(i)
    ? copyNewState({ currentState: e, stateToUpdate: as.array(stateToUpdate)[i], stateActions, cursor: { ...cursor } })
    : e);
}

const deleteObjectValue = ({ currentState, type: oldObjectKey }: CopyNewStateArgsAndPayload) => {
  const { [oldObjectKey]: other, ...newState } = as.record(currentState);
  return newState;
}

const copyObjectProperty = ({ currentState, stateActions, cursor, type }: CopyNewStateArgsAndPayload) => {
  const currentStateRecord = as.record(currentState ?? newRecord());
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