import { constructQuery } from './query';
import { StateAction, ValidJsonArray, ValidJsonObject } from './type';
import { libPropMap } from './type-check';
import { Cursor } from './type-internal';

const isArray = Array.isArray;
export const readState = (
  state: unknown, stateActions: StateAction[], cursor?: Cursor
): unknown => {
  if (!cursor) cursor = { index: 0 };
  const stateAction = stateActions[cursor.index];
  const type = stateAction?.name;
  const arg = stateAction?.arg;
  if (isArray(state) && !libPropMap[type])
    return state.map((_, i) => readState(state[i], stateActions, { ...cursor }));
  cursor.index++;
  if (cursor.index === stateActions.length)
    return state;
  if (typeof(state) === 'object' && state !== null && !isArray(state))
    return readState((state as ValidJsonObject)[type], stateActions, cursor);
  if (type === '$at')
    return readState((state as ValidJsonObject)[arg as number], stateActions, cursor);
  if (type === '$distinct')
    return [...new Set(state as ValidJsonArray)];
  const query = constructQuery(stateActions, cursor);
  if (type === '$find')
    return readState((state as ValidJsonArray).find(query), stateActions, cursor);
  if (type === '$filter')
    return readState((state as ValidJsonArray).filter(query), stateActions, cursor);
}
