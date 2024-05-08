import { errorMessages, libState } from './constant';
import { constructQuery } from './query';
import { StateAction, ValidJson, ValidJsonArray, ValidJsonObject } from './type';
import { libPropMap, updatePropMap } from './type-check';
import { Cursor } from './type-internal';
import { extractPayload } from './utility';



const deleteMap = { $delete: true, $invalidateCache: true };
const typeMap = { object: true, undefined: true };

export const copyNewState = (
  currentState: ValidJson,
  stateActions: StateAction[],
  cursor: Cursor,
): ValidJson => {
  const cursorIndex = cursor.index;
  const { name, arg } = stateActions[cursorIndex];
  if (cursorIndex < stateActions.length - 1) {
    cursor.index++;
    const arrayFn = mapOne[name as keyof typeof mapOne] as (currentState: ValidJsonArray, cursor: Cursor, stateActions: StateAction[], arg: unknown) => ValidJsonArray;
    if (arrayFn)
      return arrayFn(currentState as ValidJsonArray, cursor, stateActions, arg);
    const typeNext = stateActions[cursor.index].name;
    if (deleteMap[typeNext as keyof typeof deleteMap])
      return deleteObjectValue(currentState as ValidJsonObject, name, stateActions);
    if ('$setKey' === typeNext)
      return setObjectKey(currentState as ValidJsonObject, cursor, stateActions, name);
    if (Array.isArray(currentState) && !libPropMap[name])
      return updateArrayObjectProperties(currentState, cursor, stateActions);
    if (typeMap[typeof (currentState) as keyof typeof typeMap])
      return copyObjectProperty(currentState, cursor, stateActions, name);
  }
  const updateFn = mapTwo[name as keyof typeof mapTwo] as (currentState: ValidJson, payload: unknown) => ValidJson;
  if (updateFn)
    return updateFn(currentState, extractPayload(arg));
  throw new Error();
}

const deDuplicate = (currentState: ValidJsonArray) => {
  return [...new Set(currentState)];
}

const push = (currentState: ValidJsonArray, payload: ValidJson) => {
  return [...currentState, payload];
}

const pushMany = (currentState: ValidJsonArray, payload: ValidJsonArray) => {
  return [...currentState, ...payload];
}

const merge = (currentState: ValidJsonArray, payload: ValidJson) => {
  return [...currentState, ...(Array.isArray(payload) ? payload : [payload]).filter(e => !currentState.includes(e))];
}

const toggle = (currentState: ValidJson) => {
  if (Array.isArray(currentState))
    return currentState.map(e => !e);
  return !currentState;
}

const setNew = (currentState: ValidJsonObject, payload: ValidJsonObject) => {
  return { ...currentState, ...payload };
}

const set = (currentState: unknown, payload: ValidJson) => {
  return payload;
}

const setUnique = (currentState: unknown, payload: ValidJsonArray) => {
  return [...new Set(payload)];
}

const patch = (currentState: ValidJson, payload: ValidJsonObject) => {
  if (Array.isArray(currentState))
    return currentState.map(e => ({ ...e as ValidJsonObject, ...payload }));
  return { ...currentState as ValidJsonObject, ...payload };
}

const add = (currentState: ValidJson, payload: number) => {
  if (Array.isArray(currentState))
    return currentState.map(e => e as number + payload);
  return currentState as number + payload;
}

const subtract = (currentState: ValidJson, payload: number) => {
  if (Array.isArray(currentState))
    return currentState.map(e => e as number + payload);
  return currentState as number - payload;
}

const clear = () => {
  return [];
}

const patchDeep = (currentState: ValidJsonObject, payload: ValidJsonObject) => {
  const isRecord = (arg: unknown) => typeof arg === 'object' && arg !== null && !Array.isArray(arg) && !(arg instanceof Date);
  const recurse = (state: ValidJson, patch: ValidJson): ValidJson => {
    if (!isRecord(state))
      return patch;
    if (!isRecord(patch))
      throw new Error(errorMessages.INVALID_PATCH_DEEP_STRUCTURE);
    return Object.entries(patch as ValidJsonObject)
      .reduce((acc, [key, value]) => {
        if (!isRecord(value))
          return { ...acc as ValidJsonObject, [key]: value };
        if (!(key in (state as ValidJsonObject)))
          return { ...acc as ValidJsonObject, [key]: value };
        return { ...acc as ValidJsonObject, [key]: recurse((state as ValidJsonObject)[key] as ValidJsonObject, value as ValidJsonObject) };
      }, state);
  }
  return recurse(currentState, payload);
}

const updateArrayObjectProperties = (currentState: ValidJsonArray, cursor: Cursor, stateActions: StateAction[]) => {
  cursor.index--;
  return currentState.map(element => {
    if (element !== undefined) return {
      ...element as ValidJsonObject,
      ...copyNewState(
        element ?? {} as Record<string, unknown>,
        stateActions,
        { ...cursor }
      ) as ValidJsonObject
    };
    return copyNewState(
      element,
      stateActions,
      { ...cursor }
    );
  });
}

const mergeMatching = (currentState: ValidJsonArray, cursor: Cursor, stateActions: StateAction[]) => {
  const cursorIndex = cursor.index;
  const nextUpdateIndex = stateActions.slice(cursorIndex).findIndex(sa => updatePropMap[sa.name]);
  const queryPaths = stateActions.slice(cursorIndex, cursorIndex + nextUpdateIndex);
  cursor.index += queryPaths.length;
  const mergeArg = stateActions[cursor.index++].arg;
  const mergeArgState = (mergeArg as { $state: unknown }).$state ?? mergeArg;
  const mergeArgs = [...(Array.isArray(mergeArgState) ? mergeArgState : [mergeArgState])];
  const query = (e: ValidJsonObject) => queryPaths.reduce((prev, curr) => prev[curr.name] as ValidJsonObject, e);
  return [
    ...currentState.map(existingElement => {
      const existingElementProp = query(existingElement as ValidJsonObject);
      const elementReplacement = mergeArgs.find(ma => query(ma as ValidJsonObject) === existingElementProp);
      if (elementReplacement)
        mergeArgs.splice(mergeArgs.indexOf(elementReplacement), 1);
      return elementReplacement ?? existingElement;
    }),
    ...mergeArgs
  ];
}

const setObjectKey = (currentState: ValidJsonObject, cursor: Cursor, stateActions: StateAction[], type: string) => {
  const stateActionsStr = stateActions.slice(0, stateActions.length - 1).map(sa => sa.name).join('.');
  const arg = stateActions[cursor.index].arg as string;
  libState.changeListeners
    .filter(l => l.actions.map(a => a.name).join('.').startsWith(stateActionsStr))
    .forEach(l => l.actions[l.actions.length - 2].name = arg);
  const payload = extractPayload(arg);
  return Object.entries(currentState)
    .reduce((acc, [key, value]) => { acc[key === type ? payload : key] = value; return acc; }, {} as Record<string, unknown>);
}

const atArray = (currentState: ValidJsonArray, cursor: Cursor, stateActions: StateAction[], payload: number) => {
  if (typeof (currentState[payload]) === 'undefined')
    throw new Error(errorMessages.AT_INDEX_OUT_OF_BOUNDS(payload));
  if ('$delete' === stateActions[cursor.index].name)
    return currentState.filter((_, i) => payload !== i);
  return currentState.map((e, i) => i === payload
    ? copyNewState(e, stateActions, cursor)
    : e);
}

const findArray = (currentState: ValidJsonArray, cursor: Cursor, stateActions: StateAction[]) => {
  const query = constructQuery(stateActions, cursor);
  const findIndex = currentState.findIndex(query);
  if (findIndex === -1)
    throw new Error(errorMessages.FIND_RETURNS_NO_MATCHES);
  const cursorIndex = cursor.index;
  let stateAction: StateAction;
  for (let i = cursorIndex - 1; i >= 0; i--) {
    if (stateActions[i].name !== '$find') continue;
    stateAction = stateActions[i]; break;
  }
  stateAction!.searchIndices = [findIndex];
  if ('$delete' === stateActions[cursorIndex].name)
    return currentState.filter((_, i) => findIndex !== i);
  return currentState.map((e, i) => i === findIndex
    ? copyNewState(e, stateActions, cursor)
    : e);
}

const filterArray = (currentState: ValidJsonArray, cursor: Cursor, stateActions: StateAction[]) => {
  const query = constructQuery(stateActions, cursor);
  const cursorIndex = cursor.index;
  const type = stateActions[cursorIndex].name;
  let stateAction: StateAction;
  for (let i = cursorIndex - 1; i >= 0; i--) {
    if (stateActions[i].name !== '$filter') continue;
    stateAction = stateActions[i]; break;
  }
  const searchIndices = stateAction!.searchIndices = currentState.map((e, i) => query(e) ? i : -1).filter(i => i !== -1);
  if ('$delete' === type)
    return currentState.filter((_, i) => !searchIndices!.includes(i));
  if ('$set' === type)
    return [
      ...currentState.filter((_, i) => !searchIndices!.includes(i)),
      ...copyNewState(currentState, stateActions, cursor) as ValidJsonArray,
    ];
  return currentState.map((e, i) => searchIndices!.includes(i)
    ? copyNewState(e, stateActions, { ...cursor })
    : e);
}

const deleteObjectValue = (currentState: ValidJsonObject, type: string, stateActions: StateAction[]) => {
  const stateActionsStr = stateActions.slice(0, stateActions.length - 1).map(sa => sa.name).join('.');
  libState.changeListeners
    .filter(l => l.actions.map(a => a.name).join('.').startsWith(stateActionsStr))
    .forEach(l => l.unsubscribe());
  const { [type]: other, ...newState } = currentState;
  return newState;
}

const copyObjectProperty = (currentState: ValidJson, cursor: Cursor, stateActions: StateAction[], type: string) => {
  const currentStateRecord = (currentState ?? {} as Record<string, unknown>) as ValidJsonObject;
  return {
    ...currentStateRecord,
    [type]: copyNewState(
      currentStateRecord[type as keyof typeof currentStateRecord] as ValidJson,
      stateActions,
      cursor,
    )
  };
}

const mapOne = {
  $at: atArray,
  $find: findArray,
  $filter: filterArray,
  $mergeMatching: mergeMatching,
}

const mapTwo = {
  $set: set,
  $setUnique: setUnique,
  $patch: patch,
  $add: add,
  $subtract: subtract,
  $setNew: setNew,
  $patchDeep: patchDeep,
  $clear: clear,
  $push: push,
  $pushMany: pushMany,
  $deDuplicate: deDuplicate,
  $toggle: toggle,
  $merge: merge,
};