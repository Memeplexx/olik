import { errorMessages, libState, testState, updatePropMap } from './constant';
import { constructQuery } from './query';
import { BasicArray, BasicRecord, SliceArg, StateAction } from './type';
import { Cursor } from './type-internal';


export const copyNewState = (
  currentState: unknown,
  stateActions: StateAction[],
  cursor: Cursor,
): unknown => {
  const cursorIndex = cursor.index;
  const stateAction = stateActions[cursorIndex];
  const { name } = stateAction;
  if (cursorIndex < stateActions.length - 1) {
    cursor.index++;
    if (!Array.isArray(currentState))
      switch (stateActions[cursor.index].name) {
        case '$delete':
          return deleteObjectValue(currentState as BasicRecord, stateActions, name);
        case '$setKey':
          return setObjectKey(currentState as BasicRecord, cursor, stateActions, name);
        default:
          return copyObjectProperty(currentState as BasicRecord, cursor, stateActions, name);
      }
    switch (name) {
      case '$at':
        return atArray(currentState, cursor, stateActions, stateAction.arg as number);
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
  const payload = stateAction.arg;
  switch (name) {
    case '$set':
      return set(currentState, payload);
    case '$patch':
      return patch(currentState as BasicRecord, payload as BasicRecord);
    case '$add':
      return add(currentState, payload as number);
    case '$subtract':
      return subtract(currentState, payload as number);
    case '$toggle':
      return toggle(currentState);
    case '$setNew':
      return setNew(currentState as BasicRecord, payload as BasicRecord);
    case '$patchDeep':
      return patchDeep(currentState as BasicRecord, payload as BasicRecord);
    case '$clear':
      return clear(currentState as BasicArray);
    case '$slice':
      return slice(currentState as BasicArray, payload as SliceArg);
    case '$push':
      return push(currentState as BasicArray, payload);
    case '$pushMany':
      return pushMany(currentState as BasicArray, payload as BasicArray);
    case '$merge':
      return merge(currentState as BasicArray, payload);
  }
  throw new Error(`Unknown property: ${name}`);
}

const slice = (currentState: BasicArray, payload: SliceArg) => {
  return currentState.slice(payload.start, payload.end);
}

const push = (currentState: BasicArray, payload: unknown) => {
  libState.insertedElements = [payload];
  return [...currentState, payload];
}

const pushMany = (currentState: BasicArray, payload: BasicArray) => {
  libState.insertedElements = payload;
  return [...currentState, ...payload];
}

const merge = (currentState: BasicArray, payload: unknown) => {
  const newElements = (Array.isArray(payload) ? payload : [payload]).filter(e => !currentState.includes(e));
  libState.insertedElements = newElements;
  return [...currentState, ...newElements];
}

const toggle = (currentState: unknown) => {
  if (Array.isArray(currentState))
    return currentState.map(e => !e);
  return !currentState;
}

const setNew = (currentState: BasicRecord, payload: BasicRecord) => {
  return { ...currentState, ...payload };
}

const set = (currentState: unknown, payload: unknown) => {
  if (typeof (payload) === 'object' && payload !== null) {
    if (Array.isArray(currentState)) {
      libState.deletedElements = currentState.slice();
      libState.insertedElements = (payload as BasicArray).slice();
    } else {
      updateObjectInsertedAndDeletedElements(currentState as BasicRecord, payload as BasicRecord);
    }
  }
  return payload;
}

const patch = (currentState: BasicRecord, payload: BasicRecord) => {
  if (Array.isArray(currentState))
    return currentState.map(e => ({ ...e as BasicRecord, ...payload }));
  updateObjectInsertedAndDeletedElements(currentState, payload);
  return { ...currentState as BasicRecord, ...payload };
}

const updateObjectInsertedAndDeletedElements = (currentState: BasicRecord, payload: BasicRecord) => {
  Object.keys(payload)
    .forEach(key => {
      const payloadValue = payload[key];
      if (!Array.isArray(payloadValue)) return;
      libState.insertedElements = payloadValue.slice();
      const currentStateItem = currentState[key];
      if (!currentStateItem || !Array.isArray(currentStateItem)) return;
      libState.deletedElements = currentStateItem.slice();
    });
}

const add = (currentState: unknown, payload: number) => {
  if (Array.isArray(currentState))
    return currentState.map(e => e as number + payload);
  return currentState as number + payload;
}

const subtract = (currentState: unknown, payload: number) => {
  if (Array.isArray(currentState))
    return currentState.map(e => e as number - payload);
  return currentState as number - payload;
}

const clear = (currentState: BasicArray) => {
  libState.deletedElements = currentState.slice();
  return [];
}

const patchDeep = (currentState: BasicRecord, payload: BasicRecord) => {
  const isRecord = (arg: unknown): arg is BasicRecord => typeof arg === 'object' && arg !== null && !Array.isArray(arg) && !(arg instanceof Date);
  const recurse = (state: unknown, patch: unknown): unknown => {
    if (!isRecord(state))
      return patch;
    if (!isRecord(patch))
      throw new Error(errorMessages.INVALID_PATCH_DEEP_STRUCTURE(patch));
    return Object.entries(patch)
      .reduce((acc, [key, value]) => {
        if (!isRecord(value))
          return { ...acc, [key]: value };
        if (!(key in (state)))
          return { ...acc, [key]: value };
        return { ...acc, [key]: recurse((state as BasicRecord)[key] as BasicRecord, value as BasicRecord) };
      }, state);
  }
  return recurse(currentState, payload);
}

const updateArrayObjectProperties = (currentState: BasicArray, cursor: Cursor, stateActions: StateAction[]) => {
  cursor.index--;
  if (testState.logLevel === 'debug') {
    console.log('!')
  }
  return currentState.map(element => {
    if (element !== undefined) {

      const updatedElements = copyNewState(
        element ?? {} as BasicRecord,
        stateActions,
        { ...cursor }
      ) as BasicRecord;
      libState.updatedElements.push(updatedElements);
      return {
        ...element as BasicRecord,
        ...updatedElements
      };
    }
    return copyNewState(
      element,
      stateActions,
      { ...cursor }
    );
  });
}

const mergeMatching = (currentState: BasicArray, cursor: Cursor, stateActions: StateAction[]) => {
  const cursorIndex = cursor.index;
  const nextUpdateIndex = stateActions.findIndex((sa, i) => i > cursorIndex && sa.name in updatePropMap) - cursorIndex;
  const queryPaths = stateActions.map(sa => sa.name).slice(cursorIndex, cursorIndex + nextUpdateIndex);
  cursor.index += queryPaths.length;
  const mergeArg = stateActions[cursor.index++].arg;
  const mergeArgs = [...(Array.isArray(mergeArg) ? mergeArg : [mergeArg])];
  const queryPathsRev = queryPaths.join('.').split('.$and.').map(qp => qp.split('.'));
  const query = (e: unknown) => queryPathsRev.map(queryPaths => queryPaths.reduce((prev, curr) => prev[curr] as BasicRecord, e as BasicRecord));
  const existingElementsUpdated = currentState.map(existingElement => {
    const existingElementProp = query(existingElement);
    const elementReplacement = mergeArgs.find(ma => query(ma).every((r, i) => r === existingElementProp[i]));
    if (elementReplacement) {
      mergeArgs.splice(mergeArgs.indexOf(elementReplacement), 1);
      libState.updatedElements.push(elementReplacement);
      return elementReplacement;
    }
    return existingElement;
  });
  libState.insertedElements.push(...mergeArgs);
  return [
    ...existingElementsUpdated,
    ...mergeArgs
  ];
}

const setObjectKey = (currentState: BasicRecord, cursor: Cursor, stateActions: StateAction[], name: string) => {
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
  return Object.entries(currentState)
    .reduce((acc, [key, value]) => { acc[key === name ? arg : key] = value; return acc; }, {} as BasicRecord);
}

const atArray = (currentState: BasicArray, cursor: Cursor, stateActions: StateAction[], payload: number) => {
  const index = payload < 0 ? currentState.length + payload : payload;
  if ('undefined' === typeof (currentState[index]))
    throw new Error(errorMessages.AT_INDEX_OUT_OF_BOUNDS(payload));
  if ('$delete' === stateActions[cursor.index].name)
    return currentState.filter((e, i) => {
      const matchFound = index === i;
      if (matchFound)
        libState.deletedElements.push(e);
      return !matchFound;
    });
  return currentState.map((e, i) => {
    if (i === index) {
      const updated = copyNewState(e, stateActions, cursor);
      libState.updatedElements.push(updated);
      return updated;
    }
    return e;
  });
}

const findArray = (currentState: BasicArray, cursor: Cursor, stateActions: StateAction[]) => {
  const query = constructQuery(stateActions, cursor);
  const findIndex = currentState.findIndex(query);
  if (findIndex === -1)
    throw new Error(errorMessages.FIND_RETURNS_NO_MATCHES);
  const cursorIndex = cursor.index;
  let stateAction: StateAction;
  for (let i = cursorIndex - 1; i >= 0; i--) {
    const act = stateActions[i];
    if ('$find' !== act.name)
      continue;
    stateAction = act;
    break;
  }
  stateAction!.searchIndices = [findIndex];
  if ('$delete' === stateActions[cursorIndex].name)
    return currentState.filter((e, i) => {
      const matchFound = findIndex === i;
      if (matchFound)
        libState.deletedElements.push(e);
      return !matchFound;
    });
  return currentState.map((e, i) => {
    const matchFound = findIndex === i;
    if (matchFound) {
      const updated = copyNewState(e, stateActions, cursor);
      libState.updatedElements.push(updated);
      return updated;
    }
    return e;
  });
}

const filterArray = (currentState: BasicArray, cursor: Cursor, stateActions: StateAction[]) => {
  const query = constructQuery(stateActions, cursor);
  const cursorIndex = cursor.index;
  const type = stateActions[cursorIndex].name;
  let stateAction: StateAction;
  for (let i = cursorIndex - 1; i >= 0; i--) {
    const act = stateActions[i];
    if ('$filter' !== act.name)
      continue;
    stateAction = act;
    break;
  }
  const searchIndices = stateAction!.searchIndices = currentState.map((e, i) => query(e) ? i : -1).filter(i => i !== -1);
  if ('$delete' === type)
    return currentState.filter((e, i) => {
      const matchFound = searchIndices!.includes(i);
      if (matchFound)
        libState.deletedElements.push(e);
      return !matchFound;
    });
  if ('$set' === type) {
    const updated = copyNewState(currentState, stateActions, cursor) as BasicArray;
    libState.updatedElements = updated;
    return [
      ...currentState.filter((_, i) => !searchIndices!.includes(i)),
      ...updated,
    ];
  }
  return currentState.map((e, i) => {
    if (searchIndices!.includes(i)) {
      const updated = copyNewState(e, stateActions, { ...cursor });
      libState.updatedElements.push(updated);
      return updated;
    }
    return e;
  });
}

const deleteObjectValue = (currentState: BasicRecord, stateActions: StateAction[], name: string) => {
  const stateActionsStr = stateActions.slice(0, stateActions.length - 1).map(sa => sa.name).join('.');
  libState.changeListeners
    .filter(l => l.actions.map(a => a.name).join('.').startsWith(stateActionsStr))
    .forEach(l => l.unsubscribe());
  const { [name]: other, ...newState } = currentState;
  return newState;
}

const copyObjectProperty = (currentState: BasicRecord, cursor: Cursor, stateActions: StateAction[], name: string) => {
  const currentStateRecord = (currentState ?? {} as BasicRecord) as BasicRecord;
  return {
    ...currentStateRecord,
    [name]: copyNewState(
      currentStateRecord[name as keyof typeof currentStateRecord],
      stateActions,
      cursor,
    )
  };
}
