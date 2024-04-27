import { constructQuery } from './query';
import { StateAction } from './type';
import { as, assertIsArray, is } from './type-check';
import { Cursor } from './type-internal';

export const readState = (
  state: unknown, stateActions: StateAction[], cursor?: Cursor
): unknown => {
  if (!cursor) cursor = { index: 0 };
  const stateAction = stateActions[cursor.index];
  const type = stateAction.name;
  const arg = stateAction.arg;
  if (is.array(state) && !is.anyLibProp(type))
    return state.map((_, i) => readState(state[i], stateActions, { ...cursor! }));
  cursor.index++;
  if (cursor.index === stateActions.length)
    return state;
  if (is.record(state))
    return readState(state[type], stateActions, cursor);
  assertIsArray(state);
  if (type === '$at')
    return readState(state[as.number(arg)], stateActions, cursor);
  if (type === '$distinct')
    return [...new Set(state)];
  const query = constructQuery(stateActions, cursor);
  if (type === '$find')
    return readState(state.find(query), stateActions, { ...cursor });
  if (type === '$filter')
    return readState(state.filter(query), stateActions, { ...cursor });
}
