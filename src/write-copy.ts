import { errorMessages, libState, updatePropMap } from './constant';
import { constructQuery } from './query';
import { readState } from './read';
import { BasicArray, BasicRecord, SliceArg, StateAction } from './type';
import { Cursor } from './type-internal';
import { constructTypeStrings } from './utility';


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
          return deleteObjectValue(currentState as BasicRecord, stateActions, name, cursor);
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
    case '$nullify':
      return nullify();
    case '$set':
      return set(currentState, cursor, payload, stateActions);
    case '$patch':
      return patch(currentState as BasicRecord, cursor, payload as BasicRecord, stateActions);
    case '$add':
      return add(currentState, payload as number);
    case '$subtract':
      return subtract(currentState, payload as number);
    case '$toggle':
      return toggle(currentState);
    case '$setNew':
      return setNew(currentState as BasicRecord, cursor, payload as BasicRecord, stateActions);
    case '$patchDeep':
      return patchDeep(currentState as BasicRecord, payload as BasicRecord);
    case '$clear':
      return clear(currentState as BasicArray, cursor, stateActions);
    case '$slice':
      return slice(currentState as BasicArray, cursor, payload as SliceArg, stateActions);
    case '$push':
      return push(currentState as BasicArray, cursor, payload, stateActions);
    case '$pushMany':
      return pushMany(currentState as BasicArray, cursor, payload as BasicArray, stateActions);
    case '$merge':
      return merge(currentState as BasicArray, cursor, payload, stateActions);
    case '$reset':
      return reset(stateActions);
  }
  throw new Error(`Unknown property: ${name}`);
}

const reset = (stateActions: StateAction[]) => {
  // TODO: implement deleted elements?
  return readState(libState.initialState, stateActions);
}

const slice = (currentState: BasicArray, cursor: Cursor, payload: SliceArg, stateActions: StateAction[]) => {
  const path = constructTypeStrings(stateActions.slice(0, cursor.index), false);
  const deletedElements = new Array<unknown>();
  libState.deletedElements.set(path, deletedElements);
  if (payload.start)
    deletedElements.push(...currentState.slice(0, payload.start));
  if (payload.end)
    deletedElements.push(...currentState.slice(payload.end));
  return currentState.slice(payload.start, payload.end);
}

const push = (currentState: BasicArray, cursor: Cursor, payload: unknown, stateActions: StateAction[]) => {
  const path = constructTypeStrings(stateActions.slice(0, cursor.index), false);
  libState.insertedElements.set(path, [payload]);
  return [...currentState, payload];
}

const pushMany = (currentState: BasicArray, cursor: Cursor, payload: BasicArray, stateActions: StateAction[]) => {
  const path = constructTypeStrings(stateActions.slice(0, cursor.index), false);
  libState.insertedElements.set(path, payload);
  return [...currentState, ...payload];
}

const merge = (currentState: BasicArray, cursor: Cursor, payload: unknown, stateActions: StateAction[]) => {
  const newElements = (Array.isArray(payload) ? payload : [payload]).filter(e => !currentState.includes(e));
  const path = constructTypeStrings(stateActions.slice(0, cursor.index), false);
  libState.insertedElements.set(path, newElements);
  return [...currentState, ...newElements];
}

const toggle = (currentState: unknown) => {
  if (Array.isArray(currentState))
    return currentState.map(e => !e);
  return !currentState;
}

const setNew = (currentState: BasicRecord, cursor: Cursor, payload: BasicRecord, stateActions: StateAction[]) => {
  updateObjectInsertedAndDeletedElements(currentState, cursor, payload, stateActions, true);
  return { ...currentState, ...payload };
}

const nullify = () => {
  return null;
}

const set = (currentState: unknown, cursor: Cursor, payload: unknown, stateActions: StateAction[]) => {
  if (typeof (payload) === 'object' && payload !== null) {
    if (Array.isArray(currentState) && Array.isArray(payload)) {
      const path = constructTypeStrings(stateActions.slice(0, cursor.index), false);
      libState.deletedElements.set(path, currentState.slice());
      libState.insertedElements.set(path, payload.slice());
    } else {
      updateObjectInsertedAndDeletedElements(currentState as BasicRecord, cursor, payload as BasicRecord, stateActions);
    }
  } else {
    const basePath = constructTypeStrings(stateActions.slice(0, cursor.index - 1), false);
    libState.updatedProperties.set(basePath, { [stateActions.at(-2)!.name]: payload });
  }
  return payload;
}

const patch = (currentState: BasicRecord, cursor: Cursor, payload: BasicRecord, stateActions: StateAction[]) => {
  if (Array.isArray(currentState))
    return currentState.map(e => ({ ...e as BasicRecord, ...payload }));
  updateObjectInsertedAndDeletedElements(currentState, cursor, payload, stateActions);
  return { ...currentState as BasicRecord, ...payload };
}

const updateObjectInsertedAndDeletedElements = (currentState: BasicRecord, cursor: Cursor, payload: BasicRecord, stateActions: StateAction[], newObjectProp = false) => {
  const basePath = constructTypeStrings(stateActions.slice(0, cursor.index), false);
  Object.keys(payload)
    .forEach(key => {
      const path = basePath === '' ? key : `${basePath}.${key}`;
      const currentStateItem = currentState?.[key] ?? [];
      const payloadValue = payload[key];
      if (!Array.isArray(currentStateItem) || !Array.isArray(payloadValue)) return;
      libState.insertedElements.set(path, payloadValue.slice());
      libState.deletedElements.set(path, currentStateItem.slice());
    });
  if (newObjectProp)
    libState.insertedProperties.set(basePath, payload);
  else 
    libState.updatedProperties.set(basePath, payload);
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

const clear = (currentState: unknown, cursor: Cursor, stateActions: StateAction[]) => {
  if (Array.isArray(currentState)) {
    const path = constructTypeStrings(stateActions.slice(0, cursor.index), false);
    libState.deletedElements.set(path, currentState.slice());
    return [];
  }
  return '';
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
  const path = constructTypeStrings(stateActions.slice(0, cursor.index), false);
  const updatedElements = new Array<unknown>();
  libState.updatedElements.set(path, updatedElements);
  const newElements = new Array<unknown>();
  libState.insertedElements.set(path, newElements);
  return currentState.map(element => {
    if (element !== undefined) {
      const updatedEls = copyNewState(
        element ?? {} as BasicRecord,
        stateActions,
        { ...cursor }
      ) as BasicRecord;
      updatedElements.push(updatedEls);
      return {
        ...element as BasicRecord,
        ...updatedEls
      };
    }
    const newEl = copyNewState(
      element,
      stateActions,
      { ...cursor }
    );
    newElements.push(newEl);
    return newEl;
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
  const path = constructTypeStrings(stateActions.slice(0, cursorIndex - 1), false);
  const updatedElements = new Array<unknown>();
  libState.updatedElements.set(path, updatedElements);
  const existingElementsUpdated = currentState.map(existingElement => {
    const existingElementProp = query(existingElement);
    const elementReplacement = mergeArgs.find(ma => query(ma).every((r, i) => r === existingElementProp[i]));
    if (elementReplacement) {
      mergeArgs.splice(mergeArgs.indexOf(elementReplacement), 1);
      updatedElements.push(elementReplacement);
      return elementReplacement;
    }
    return existingElement;
  });
  libState.insertedElements.set(path, mergeArgs);
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
    .filter(l => l.path.startsWith(stateActionsStr))
    .forEach(l => l.actions[l.actions.length - 2].name = arg);
  const path = constructTypeStrings(stateActions.slice(0, cursor.index - 1), false);
  libState.deletedProperties.set(path, { [name]: currentState[name] });
  libState.insertedProperties.set(path, {[arg]: currentState[name]});
  return Object.entries(currentState)
    .reduce((acc, [key, value]) => { acc[key === name ? arg : key] = value; return acc; }, {} as BasicRecord);
}

const atArray = (currentState: BasicArray, cursor: Cursor, stateActions: StateAction[], payload: number) => {
  const cursorIndex = cursor.index;
  const index = payload < 0 ? currentState.length + payload : payload;
  const path = constructTypeStrings(stateActions.slice(0, cursorIndex - 1), false);
  if ('undefined' === typeof (currentState[index]))
    throw new Error(errorMessages.AT_INDEX_OUT_OF_BOUNDS(payload));
  if ('$delete' === stateActions[cursorIndex].name) {
    const deletedElements = new Array<unknown>();
    libState.deletedElements.set(path, deletedElements);
    return currentState.filter((e, i) => {
      const matchFound = index === i;
      if (matchFound) {
        deletedElements.push(e);
      }
      return !matchFound;
    });
  }
  const updatedElements = new Array<unknown>();
  libState.updatedElements.set(path, updatedElements);
  return currentState.map((e, i) => {
    if (i === index) {
      const updated = copyNewState(e, stateActions, cursor);
      updatedElements.push(updated);
      return updated;
    }
    return e;
  });
}

const findArray = (currentState: BasicArray, cursor: Cursor, stateActions: StateAction[]) => {
  const cursorIndexBefore = cursor.index;
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
  const path = constructTypeStrings(stateActions.slice(0, cursorIndexBefore - 1), false);
  if ('$delete' === stateActions[cursorIndex].name) {
    const deletedList = new Array<unknown>();
    libState.deletedElements.set(path, deletedList);
    return currentState.filter((e, i) => {
      const matchFound = findIndex === i;
      if (matchFound)
        deletedList.push(e);
      return !matchFound;
    });
  }
  const updatedList = new Array<unknown>();
  libState.updatedElements.set(path, updatedList);
  return currentState.map((e, i) => {
    const matchFound = findIndex === i;
    if (matchFound) {
      const updated = copyNewState(e, stateActions, cursor);
      updatedList.push(updated);
      return updated;
    }
    return e;
  });
}

const filterArray = (currentState: BasicArray, cursor: Cursor, stateActions: StateAction[]) => {
  const cursorIndexBefore = cursor.index;
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
  const path = constructTypeStrings(stateActions.slice(0, cursorIndexBefore - 1), false);
  if ('$delete' === type) {
    const deletedElements = new Array<unknown>();
    libState.deletedElements.set(path, deletedElements);
    return currentState.filter((e, i) => {
      const matchFound = searchIndices!.includes(i);
      if (matchFound)
        deletedElements.push(e);
      return !matchFound;
    });
  }
  if ('$set' === type) {
    const updated = copyNewState(currentState, stateActions, cursor) as BasicArray;
    libState.updatedElements.set(path, updated);
    return [
      ...currentState.filter((_, i) => !searchIndices!.includes(i)),
      ...updated,
    ];
  }
  const updatedList = new Array<unknown>();
  libState.updatedElements.set(path, updatedList);
  return currentState.map((e, i) => {
    if (searchIndices!.includes(i)) {
      const updated = copyNewState(e, stateActions, { ...cursor });
      updatedList.push(updated);
      return updated;
    }
    return e;
  });
}

const deleteObjectValue = (currentState: BasicRecord, stateActions: StateAction[], name: string, cursor: Cursor) => {
  const stateActionsStr = stateActions.slice(0, stateActions.length - 1).map(sa => sa.name).join('.');
  libState.changeListeners
    .filter(l => l.path.startsWith(stateActionsStr))
    .forEach(l => l.unsubscribe());
  const { [name]: other, ...newState } = currentState;
  const basePath = constructTypeStrings(stateActions.slice(0, cursor.index - 1), false);
  libState.deletedProperties.set(basePath, { [name]: other });
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
