import { libPropMap } from './constant';
import { constructQuery } from './query';
import { BasicArray, BasicRecord, StateAction } from './type';

export const readState = (
  state: unknown, stateActions: StateAction[], cursor = { index: 0 }
): unknown => {
  const stateAction = stateActions[cursor.index];
  const { name } = stateAction;
  if (Array.isArray(state) && !(name in libPropMap)) {
    return state.map((_, i) => readState(state[i], stateActions, { ...cursor }));
  }
  cursor.index++;
  if (cursor.index === stateActions.length) {
    return state;
  }
  if (typeof (state) === 'object' && state !== null && !Array.isArray(state)) {
    const result = readState((state as BasicRecord)[name], stateActions, cursor);
    return typeof (result) === 'undefined' ? state : result;
  }
  if (name === '$at') {
    const result = readState((state as BasicRecord)[stateAction.arg as number], stateActions, cursor);
    return typeof (result) === 'undefined' ? state : result;
  }
  if (name === '$distinct') {
    return [...new Set(state as BasicArray)];
  }
  if (name === '$find') {
    const query = constructQuery(stateActions, cursor);
    const result = readState((state as BasicArray).find(query), stateActions, cursor);
    return typeof (result) === 'undefined' ? state : result;
  }
  if (name === '$filter') {
    const query = constructQuery(stateActions, cursor);
    return readState((state as BasicArray).filter(query), stateActions, cursor);
  }
}
