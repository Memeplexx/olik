import { libPropMap } from './constant';
import { constructQuery } from './query';
import { BasicArray, BasicRecord, StateAction } from './type';

export const readState = (
  state: unknown, stateActions: StateAction[], cursor = { index: 0 }
): unknown => {
  const stateAction = stateActions[cursor.index];
  const name = stateAction.name;
  if (Array.isArray(state) && !(name in libPropMap))
    return state.map((_, i) => readState(state[i], stateActions, { ...cursor }));
  cursor.index++;
  if (cursor.index === stateActions.length)
    return state;
  if (typeof(state) === 'object' && state !== null && !Array.isArray(state))
    return readState((state as BasicRecord)[name], stateActions, cursor);
  if (name === '$at')
    return readState((state as BasicRecord)[stateAction.arg as number], stateActions, cursor);
  if (name === '$distinct')
    return [...new Set(state as BasicArray)];
  const query = constructQuery(stateActions, cursor);
  if (name === '$find')
    return readState((state as BasicArray).find(query), stateActions, cursor);
  if (name === '$filter')
    return readState((state as BasicArray).filter(query), stateActions, cursor);
}
