import { errorMessages, libState } from './constant';
import { constructQuery } from './query';
import { StateAction, ValidJson, ValidJsonArray, ValidJsonObject } from './type';
import { updatePropMap } from './type-check';
import { Cursor } from './type-internal';
import { extractPayload } from './utility';


export const copyNewState = (
  currentState: ValidJson,
  stateActions: StateAction[],
  cursor: Cursor,
): ValidJson => {
  const cursorIndex = cursor.index;
  const { name, arg } = stateActions[cursorIndex];
  if (cursorIndex < stateActions.length - 1) {
    cursor.index++;
    if (!Array.isArray(currentState)) {
      switch (stateActions[cursor.index].name) {
        case '$delete':
        case '$invalidateCache':
          return deleteObjectValue(currentState as ValidJsonObject, name, stateActions);
        case '$setKey':
          return setObjectKey(currentState as ValidJsonObject, cursor, stateActions, name);
        default:
          return copyObjectProperty(currentState, cursor, stateActions, name);
      }
    }
    switch (name) {
      case '$at':
        return atArray(currentState, cursor, stateActions, arg as number);
      case '$find':
        return findArray(currentState, cursor, stateActions);
      case '$filter':
        return filterArray(currentState, cursor, stateActions);
      case '$mergeMatching':
        return mergeMatching(currentState, cursor, stateActions);
      default:
        return updateArrayObjectProperties(currentState, cursor, stateActions);
    }
  }
  switch (name) {
    case '$set':
      return set(extractPayload(arg));
    case '$setUnique':
      return setUnique(extractPayload(arg));
    case '$patch':
      return patch(currentState, extractPayload(arg));
    case '$add':
      return add(currentState, extractPayload(arg));
    case '$subtract':
      return subtract(currentState, extractPayload(arg));
    case '$toggle':
      return toggle(currentState);
    case '$setNew':
      return setNew(currentState as ValidJsonObject, extractPayload(arg));
    case '$patchDeep':
      return patchDeep(currentState as ValidJsonObject, extractPayload(arg));
    case '$clear':
      return clear();
    case '$push':
      return push(currentState as ValidJsonArray, extractPayload(arg));
    case '$pushMany':
      return pushMany(currentState as ValidJsonArray, extractPayload(arg));
    case '$deDuplicate':
      return deDuplicate(currentState as ValidJsonArray);
    case '$merge':
      return merge(currentState as ValidJsonArray, extractPayload(arg));
  }
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

const set = (payload: ValidJson) => {
  return payload;
}

const setUnique = (payload: ValidJsonArray) => {
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
    return currentState.map(e => e as number - payload);
  return currentState as number - payload;
}

const clear = () => {
  return [];
}

const patchDeep = (currentState: ValidJsonObject, payload: ValidJsonObject) => {
  const isRecord = (arg: unknown): arg is ValidJsonObject => typeof arg === 'object' && arg !== null && !Array.isArray(arg) && !(arg instanceof Date);
  const recurse = (state: ValidJson, patch: ValidJson): ValidJson => {
    if (!isRecord(state))
      return patch;
    if (!isRecord(patch))
      throw new Error(errorMessages.INVALID_PATCH_DEEP_STRUCTURE);
    return Object.entries(patch)
      .reduce((acc, [key, value]) => {
        if (!isRecord(value))
          return { ...acc, [key]: value };
        if (!(key in (state)))
          return { ...acc, [key]: value };
        return { ...acc, [key]: recurse((state as ValidJsonObject)[key] as ValidJsonObject, value as ValidJsonObject) };
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
        element ?? {} as ValidJsonObject,
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
  const nextUpdateIndex = stateActions.findIndex((sa, i) => i > cursorIndex && sa.name in updatePropMap) - cursorIndex;
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
  let stateActionsStr = '';
  const length = stateActions.length;
  for (let i = 0; i < length - 1; i++) {
    stateActionsStr += stateActions[i].name;
    if (i !== length - 2) stateActionsStr += '.';
  }
  const arg = stateActions[cursor.index].arg as string;
  libState.changeListeners
    .filter(l => l.actions.map(a => a.name).join('.').startsWith(stateActionsStr))
    .forEach(l => l.actions[l.actions.length - 2].name = arg);
  const payload = extractPayload<string>(arg);
  return Object.entries(currentState)
    .reduce((acc, [key, value]) => { acc[key === type ? payload : key] = value; return acc; }, {} as ValidJsonObject);
}

const atArray = (currentState: ValidJsonArray, cursor: Cursor, stateActions: StateAction[], payload: number) => {
  if ('undefined' === typeof (currentState[payload]))
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
    if ('$find' !== stateActions[i].name) continue;
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
    if ('$filter' !== stateActions[i].name) continue;
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
  const currentStateRecord = (currentState ?? {} as ValidJsonObject) as ValidJsonObject;
  return {
    ...currentStateRecord,
    [type]: copyNewState(
      currentStateRecord[type as keyof typeof currentStateRecord] as ValidJson,
      stateActions,
      cursor,
    )
  };
}
