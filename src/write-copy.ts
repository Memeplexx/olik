import { errorMessages } from './constant';
import { constructQuery } from './query';
import { Actual, StateAction } from './type';
import { as, assertIsArray, assertIsNumber, assertIsRecord, is } from './type-check';
import { extractPayload, newRecord } from './utility';


export const copyNewState = (
  currentState: unknown,
  stateActions: ReadonlyArray<StateAction>,
  cursor: { index: number }
): unknown => {
  const stateAction = stateActions[cursor.index];
  const payload = extractPayload(stateAction.arg);
  const type = stateAction.name;
  if (cursor.index < stateActions.length - 1) {
    cursor.index++;
    if ('$at' === type)
      return atArray(currentState, cursor, payload, stateActions);
    if ('$find' === type)
      return findArray(currentState, cursor, stateActions);
    if ('$filter' === type)
      return filterArray(currentState, cursor, stateActions);
    if ('$mergeMatching' === type)
      return mergeMatching(currentState, cursor, stateActions);
    const typeNext = stateActions[cursor.index].name;
    if ('$delete' === typeNext || '$invalidateCache' === typeNext)
      return deleteObjectValue(currentState, stateAction.name);
    if ('$setKey' === typeNext)
      return setObjectKey(currentState, cursor, stateActions, stateAction.name);
    if (is.array(currentState) && !is.libArg(type))
      return updateArrayObjectProperties(currentState, cursor, stateActions);
    if (is.record(currentState) || is.undefined(currentState))
      return copyObjectProperty(currentState, type, stateActions, cursor);
  }
  if ('$set' === type)
    return set(payload);
  if ('$setUnique' === type)
    return setUnique(payload);
  if ('$patch' === type)
    return patch(currentState, payload);
  if ('$add' === type)
    return add(currentState, cursor, payload);
  if ('$subtract' === type)
    return subtract(currentState, payload);
  if ('$setNew' === type)
    return setNew(currentState, payload);
  if ('$patchDeep' === type)
    return patchDeep(currentState, payload);
  if ('$clear' === type)
    return clear();
  if ('$push' === type)
    return push(currentState, cursor, payload);
  if ('$pushMany' === type)
    return pushMany(currentState, cursor, payload);
  if ('$deDuplicate' === type)
    return deDuplicate(currentState);
  if ('$toggle' === type)
    return toggle(currentState);
  if ('$merge' === type)
    return merge(currentState, cursor, payload);
  throw new Error();
}

const deDuplicate = (currentState: unknown) => {
  return [...new Set(as.array(currentState))];
}

const push = (currentState: unknown, cursor: { index: number }, payload: unknown) => {
  return [...as.array(currentState), payload];
}

const pushMany = (currentState: unknown, cursor: { index: number }, payload: unknown) => {
  return [...as.array(currentState), ...as.array(payload)];
}

const merge = (currentState: unknown, cursor: { index: number }, payload: unknown) => {
  assertIsArray<unknown>(currentState);
  return [...currentState, ...(is.array(payload) ? payload : [payload]).filter(e => !currentState.includes(e))];
}

const toggle = (currentState: unknown) => {
  if (is.array(currentState))
    return currentState.map(e => !e);
  return !currentState;
}

const setNew = (currentState: unknown, payload: unknown) => {
  return is.undefined(currentState) ? payload : { ...as.record(currentState), ...as.record(payload) };
}

const set = (payload: unknown) => {
  return payload;
}

const setUnique = (payload: unknown) => {
  return [...new Set(as.array(payload))];
}

const patch = (currentState: unknown, payload: unknown) => {
  assertIsRecord(payload);
  if (is.array<Record<string, unknown>>(currentState))
    return currentState.map(e => ({ ...e, ...payload }));
  return { ...as.record(currentState), ...payload };
}

const add = (currentState: unknown, cursor: { index: number }, payload: unknown) => {
  assertIsNumber(payload);
  if (is.array<number>(currentState))
    return currentState.map(e => e + payload);
  return as.number(currentState) + payload;
}

const subtract = (currentState: unknown, payload: unknown) => {
  assertIsNumber(payload);
  if (is.array<number>(currentState))
    return currentState.map(e => e + payload);
  return as.number(currentState) - payload;
}

const clear = () => {
  return [];
}

const patchDeep = (currentState: unknown, payload: unknown) => {
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

const updateArrayObjectProperties = (currentState: unknown, cursor: { index: number }, stateActions: readonly StateAction[]) => {
  cursor.index--;
  return as.array<Record<string, unknown>>(currentState).map(element => {
    if (!is.undefined(element)) return {
      ...element,
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

const mergeMatching = (currentState: unknown, cursor: { index: number }, stateActions: readonly StateAction[]) => {
  const nextUpdateIndex = stateActions.slice(cursor.index).findIndex(sa => is.anyUpdateFunction(sa.name));
  const queryPaths = stateActions.slice(cursor.index, cursor.index + nextUpdateIndex);
  cursor.index += queryPaths.length;
  const merge = stateActions[cursor.index++];
  const mergeArgState = is.storeInternal(merge.arg) ? merge.arg.$state : merge.arg;
  const mergeArgs = as.array([...(is.array(mergeArgState) ? mergeArgState : [mergeArgState])]);
  const query = (e: Actual) => queryPaths.reduce((prev, curr) => (prev as Record<string, Actual>)[curr.name], e);
  return [
    ...as.array(currentState).map(existingElement => {
      const existingElementProp = query(existingElement);
      const elementReplacement = mergeArgs.find(ma => query(ma) === existingElementProp);
      if (elementReplacement) mergeArgs.splice(mergeArgs.indexOf(elementReplacement), 1);
      return elementReplacement ?? existingElement;
    }),
    ...mergeArgs
  ];
}

const setObjectKey = (currentState: unknown, cursor: { index: number }, stateActions: readonly StateAction[], type: string) => {
  const payload = extractPayload(as.string(stateActions[cursor.index].arg));
  return Object.entries(as.record(currentState))
    .reduce((acc, [key, value]) => Object.assign(acc, { [key === type ? payload : key]: value }), newRecord());
}

const atArray = (currentState: unknown, cursor: { index: number }, payload: unknown, stateActions: readonly StateAction[]) => {
  assertIsNumber(payload); assertIsArray(currentState);
  if (is.undefined(currentState[payload]))
    throw new Error(errorMessages.AT_INDEX_OUT_OF_BOUNDS(payload));
  if ('$delete' === stateActions[cursor.index].name)
    return currentState.filter((_, i) => payload !== i);
  return currentState.map((e, i) => i === payload
    ? copyNewState(e, stateActions, cursor)
    : e);
}

const findArray = (currentState: unknown, cursor: { index: number }, stateActions: readonly StateAction[]) => {
  assertIsArray(currentState);
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

const filterArray = (currentState: unknown, cursor: { index: number }, stateActions: readonly StateAction[]) => {
  assertIsArray(currentState);
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

const deleteObjectValue = (currentState: unknown, type: string) => {
  const { [type]: other, ...newState } = as.record(currentState);
  return newState;
}

const copyObjectProperty = (currentState: unknown, type: string, stateActions: readonly StateAction[], cursor: { index: number }) => {
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