import { errorMessages, libState } from './constant';
import { constructQuery } from './query';
import { StateAction, ValidJson, ValidJsonArray, ValidJsonObject } from './type';
import { is, libPropMap } from './type-check';
import { Cursor } from './type-internal';
import { extractPayload, newRecord } from './utility';




const isArray = Array.isArray;
export const copyNewState = (
  currentState: ValidJson,
  stateActions: StateAction[],
  cursor: Cursor,
): ValidJson => {
  const stateAction = stateActions[cursor.index];
  const type = stateAction.name;
  if (cursor.index < stateActions.length - 1) {
    cursor.index++;
    if ('$at' === type)
      return atArray(currentState as ValidJsonArray, cursor, stateAction.arg as number, stateActions);
    if ('$find' === type)
      return findArray(currentState as ValidJsonArray, cursor, stateActions);
    if ('$filter' === type)
      return filterArray(currentState as ValidJsonArray, cursor, stateActions);
    if ('$mergeMatching' === type)
      return mergeMatching(currentState as ValidJsonArray, cursor, stateActions);
    const typeNext = stateActions[cursor.index].name;
    if ('$delete' === typeNext || '$invalidateCache' === typeNext)
      return deleteObjectValue(currentState as ValidJsonObject, type, stateActions);
    if ('$setKey' === typeNext)
      return setObjectKey(currentState as ValidJsonObject, cursor, stateActions, type);
    if (isArray(currentState) && !libPropMap[type])
      return updateArrayObjectProperties(currentState, cursor, stateActions);
    if (typeof (currentState) === 'object' || typeof (currentState) === 'undefined')
      return copyObjectProperty(currentState, type, stateActions, cursor);
  }
  const payload = extractPayload(stateAction.arg);
  if ('$set' === type)
    return set(payload as ValidJson);
  if ('$setUnique' === type)
    return setUnique(payload as ValidJsonArray);
  if ('$patch' === type)
    return patch(currentState, payload as ValidJsonObject);
  if ('$add' === type)
    return add(currentState, payload as number);
  if ('$subtract' === type)
    return subtract(currentState, payload as number);
  if ('$setNew' === type)
    return setNew(currentState as ValidJsonObject, payload as ValidJsonObject);
  if ('$patchDeep' === type)
    return patchDeep(currentState as ValidJsonObject, payload as ValidJsonObject);
  if ('$clear' === type)
    return clear();
  if ('$push' === type)
    return push(currentState as ValidJsonArray, payload as ValidJson);
  if ('$pushMany' === type)
    return pushMany(currentState as ValidJsonArray, payload as ValidJsonArray);
  if ('$deDuplicate' === type)
    return deDuplicate(currentState as ValidJsonArray);
  if ('$toggle' === type)
    return toggle(currentState);
  if ('$merge' === type)
    return merge(currentState as ValidJsonArray, payload as ValidJson);
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
  return [...currentState, ...(isArray(payload) ? payload : [payload]).filter(e => !currentState.includes(e))];
}

const toggle = (currentState: ValidJson) => {
  if (isArray(currentState))
    return currentState.map(e => !e);
  return !currentState;
}

const setNew = (currentState: ValidJsonObject, payload: ValidJsonObject) => {
  return { ...currentState, ...payload };
}

const set = (payload: ValidJson) => {
  return payload;
}

const setUnique = (payload: ValidJsonArray) => {
  return [...new Set(payload)];
}

const patch = (currentState: ValidJson, payload: ValidJsonObject) => {
  if (isArray(currentState))
    return currentState.map(e => ({ ...e as ValidJsonObject, ...payload }));
  return { ...currentState as ValidJsonObject, ...payload };
}

const add = (currentState: ValidJson, payload: number) => {
  if (isArray(currentState))
    return currentState.map(e => e as number + payload);
  return currentState as number + payload;
}

const subtract = (currentState: ValidJson, payload: number) => {
  if (isArray(currentState))
    return currentState.map(e => e as number + payload);
  return currentState as number - payload;
}

const clear = () => {
  return [];
}

const patchDeep = (currentState: ValidJsonObject, payload: ValidJsonObject) => {
  const recurse = (state: ValidJson, patch: ValidJson): ValidJson => {
    if (!is.record(state)) return patch;
    if (!is.record(patch)) throw new Error(errorMessages.INVALID_PATCH_DEEP_STRUCTURE);
    return Object.entries(patch).reduce((acc, [key, value]) => {
      if (!is.record(value)) return { ...acc, [key]: value };
      if (!(key in state)) return { ...acc, [key]: value };
      return { ...acc, [key]: recurse(state[key], value) };
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
        element ?? newRecord(),
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
  const nextUpdateIndex = stateActions.slice(cursor.index).findIndex(sa => is.anyUpdateFunction(sa.name));
  const queryPaths = stateActions.slice(cursor.index, cursor.index + nextUpdateIndex);
  cursor.index += queryPaths.length;
  const merge = stateActions[cursor.index++];
  const mergeArgState = is.storeInternal(merge.arg) ? merge.arg.$state : merge.arg;
  const mergeArgs = [...(isArray(mergeArgState) ? mergeArgState : [mergeArgState])];
  const query = (e: ValidJsonObject) => queryPaths.reduce((prev, curr) => prev[curr.name] as ValidJsonObject, e);
  return [
    ...currentState.map(existingElement => {
      const existingElementProp = query(existingElement as ValidJsonObject);
      const elementReplacement = mergeArgs.find(ma => query(ma as ValidJsonObject) === existingElementProp);
      if (elementReplacement) mergeArgs.splice(mergeArgs.indexOf(elementReplacement), 1);
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
  const payload = extractPayload(stateActions[cursor.index].arg as string);
  return Object.entries(currentState)
    .reduce((acc, [key, value]) => { acc[key === type ? payload : key] = value; return acc; }, newRecord());
}

const atArray = (currentState: ValidJsonArray, cursor: Cursor, payload: number, stateActions: StateAction[]) => {
  if (typeof(currentState[payload]) === 'undefined')
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
  const stateAction = stateActions.slice(0, cursor.index).reverse().find(sa => sa.name === '$find')!;
  stateAction.searchIndices = [findIndex];
  if ('$delete' === stateActions[cursor.index].name)
    return currentState.filter((_, i) => findIndex !== i);
  return currentState.map((e, i) => i === findIndex
    ? copyNewState(e, stateActions, cursor)
    : e);
}

const filterArray = (currentState: ValidJsonArray, cursor: Cursor, stateActions: StateAction[]) => {
  const query = constructQuery(stateActions, cursor);
  const type = stateActions[cursor.index].name;
  const stateAction = stateActions.slice(0, cursor.index).reverse().find(sa => sa.name === '$filter')!;
  stateAction.searchIndices = currentState.map((e, i) => query(e) ? i : -1).filter(i => i !== -1);
  if ('$delete' === type) 
    return currentState.filter((_, i) => !stateAction.searchIndices!.includes(i));
  if ('$set' === type) return [
    ...currentState.filter((_, i) => !stateAction.searchIndices!.includes(i)),
    ...copyNewState(currentState, stateActions, cursor) as ValidJsonArray,
  ];
  return currentState.map((e, i) => stateAction.searchIndices!.includes(i)
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

const copyObjectProperty = (currentState: ValidJson, type: string, stateActions: StateAction[], cursor: Cursor) => {
  const currentStateRecord = (currentState ?? newRecord()) as ValidJsonObject;
  return {
    ...currentStateRecord,
    [type]: copyNewState(
      currentStateRecord[type as keyof typeof currentStateRecord] as ValidJson,
      stateActions,
      cursor,
    )
  };
}
