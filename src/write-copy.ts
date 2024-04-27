import { errorMessages, libState } from './constant';
import { constructQuery } from './query';
import { StateAction, ValidJson, ValidJsonArray, ValidJsonObject } from './type';
import { as, is } from './type-check';
import { Cursor } from './type-internal';
import { extractPayload, newRecord } from './utility';


export const copyNewState = (
  currentState: ValidJson,
  stateActions: StateAction[],
  cursor: Cursor,
): ValidJson => {
  const stateAction = stateActions[cursor.index];
  const payload = extractPayload(stateAction.arg);
  const type = stateAction.name;
  if (cursor.index < stateActions.length - 1) {
    cursor.index++;
    if ('$at' === type)
      return atArray(as.array(currentState), cursor, as.number(payload), stateActions);
    if ('$find' === type)
      return findArray(as.array(currentState), cursor, stateActions);
    if ('$filter' === type)
      return filterArray(as.array(currentState), cursor, stateActions);
    if ('$mergeMatching' === type)
      return mergeMatching(as.array(currentState), cursor, stateActions);
    const typeNext = stateActions[cursor.index].name;
    if ('$delete' === typeNext || '$invalidateCache' === typeNext)
      return deleteObjectValue(as.record(currentState), stateAction.name, stateActions);
    if ('$setKey' === typeNext)
      return setObjectKey(as.record(currentState), cursor, stateActions, stateAction.name);
    if (is.array(currentState) && !is.anyLibProp(type))
      return updateArrayObjectProperties(currentState, cursor, stateActions);
    if (is.record(currentState) || is.undefined(currentState))
      return copyObjectProperty(currentState, type, stateActions, cursor);
  }
  if ('$set' === type)
    return set(as.json(payload));
  if ('$setUnique' === type)
    return setUnique(as.array(payload));
  if ('$patch' === type)
    return patch(currentState, as.record(payload));
  if ('$add' === type)
    return add(currentState, as.number(payload));
  if ('$subtract' === type)
    return subtract(currentState, as.number(payload));
  if ('$setNew' === type)
    return setNew(as.record(currentState), as.record(payload));
  if ('$patchDeep' === type)
    return patchDeep(as.record(currentState), as.record(payload));
  if ('$clear' === type)
    return clear();
  if ('$push' === type)
    return push(as.array(currentState), as.json(payload));
  if ('$pushMany' === type)
    return pushMany(as.array(currentState), as.array(payload));
  if ('$deDuplicate' === type)
    return deDuplicate(as.array(currentState));
  if ('$toggle' === type)
    return toggle(currentState);
  if ('$merge' === type)
    return merge(as.array(currentState), as.json(payload));
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
  return [...currentState, ...(is.array(payload) ? payload : [payload]).filter(e => !currentState.includes(e))];
}

const toggle = (currentState: ValidJson) => {
  if (is.array(currentState))
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
  if (is.array(currentState))
    return currentState.map(e => ({ ...as.record(e), ...payload }));
  return { ...as.record(currentState), ...payload };
}

const add = (currentState: ValidJson, payload: number) => {
  if (is.array(currentState))
    return currentState.map(e => as.number(e) + payload);
  return as.number(currentState) + payload;
}

const subtract = (currentState: ValidJson, payload: number) => {
  if (is.array(currentState))
    return currentState.map(e => as.number(e) + payload);
  return as.number(currentState) - payload;
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
    if (!is.undefined(element)) return {
      ...as.record(element),
      ...as.record(copyNewState(
        element ?? newRecord(),
        stateActions,
        { ...cursor }
      ))
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
  const mergeArgState = as.json(is.storeInternal(merge.arg) ? merge.arg.$state : merge.arg);
  const mergeArgs = [...(is.array(mergeArgState) ? mergeArgState : [mergeArgState])];
  const query = (e: ValidJsonObject) => queryPaths.reduce((prev, curr) => prev[curr.name] as ValidJsonObject, e);
  return [
    ...currentState.map(existingElement => {
      const existingElementProp = query(as.record(existingElement));
      const elementReplacement = mergeArgs.find(ma => query(as.record(ma)) === existingElementProp);
      if (elementReplacement) mergeArgs.splice(mergeArgs.indexOf(elementReplacement), 1);
      return elementReplacement ?? existingElement;
    }),
    ...mergeArgs
  ];
}

const setObjectKey = (currentState: ValidJsonObject, cursor: Cursor, stateActions: StateAction[], type: string) => {
  const stateActionsStr = stateActions.slice(0, stateActions.length - 1).map(sa => sa.name).join('.');
  const arg = as.string(stateActions[cursor.index].arg);
  libState.changeListeners
    .filter(l => l.actions.map(a => a.name).join('.').startsWith(stateActionsStr))
    .forEach(l => l.actions[l.actions.length - 2].name = arg);
  const payload = extractPayload(as.string(stateActions[cursor.index].arg));
  return Object.entries(currentState)
    .reduce((acc, [key, value]) => { acc[key === type ? payload : key] = value; return acc; }, newRecord());
}

const atArray = (currentState: ValidJsonArray, cursor: Cursor, payload: number, stateActions: StateAction[]) => {
  if (is.undefined(currentState[payload]))
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
  if ('$delete' === type) return currentState
    .filter((_, i) => !stateAction.searchIndices!.includes(i));
  if ('$set' === type) return [
    ...currentState.filter((_, i) => !stateAction.searchIndices!.includes(i)),
    ...as.array(copyNewState(currentState, stateActions, cursor)),
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
  const currentStateRecord = as.record(currentState ?? newRecord());
  return {
    ...currentStateRecord,
    [type]: copyNewState(
      currentStateRecord[type],
      stateActions,
      cursor,
    )
  };
}