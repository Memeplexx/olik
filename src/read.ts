import { constructQuery } from './query';
import { StateAction, ValidJsonArray, ValidJsonObject } from './type';
import { libPropMap } from './type-check';

const isArray = Array.isArray;
export const readState = (
  state: unknown, stateActions: StateAction[], cursor = { index: 0 }
): unknown => {
  const { name, arg } = stateActions[cursor.index];
  if (isArray(state) && !libPropMap[name])
    return state.map((_, i) => readState(state[i], stateActions, { ...cursor }));
  cursor.index++;
  if (cursor.index === stateActions.length)
    return state;
  if (typeof(state) === 'object' && state !== null && !isArray(state))
    return readState((state as ValidJsonObject)[name], stateActions, cursor);
  if (name === '$at')
    return readState((state as ValidJsonObject)[arg as number], stateActions, cursor);
  if (name === '$distinct')
    return [...new Set(state as ValidJsonArray)];
  const query = constructQuery(stateActions, cursor);
  if (name === '$find')
    return readState((state as ValidJsonArray).find(query), stateActions, cursor);
  if (name === '$filter')
    return readState((state as ValidJsonArray).filter(query), stateActions, cursor);
}
