import { constructQuery } from './query';
import { StateAction } from './type';
import { as, assertIsArray, is } from './type-check';

export const readState = (
  { state, stateActions, cursor = { index: 0 } }: { state: unknown, stateActions: StateAction[], cursor?: { index: number } }
): unknown => {
  const { name: type, arg } = stateActions[cursor.index];
  if (is.array(state) && !is.libArg(type))
    return state.map((_, i) => readState({ state: state[i], stateActions, cursor: { ...cursor } }));
  cursor.index++;
  if (cursor.index === stateActions.length)
    return state;
  if (is.record(state))
    return readState({ state: state[type], stateActions, cursor });
  assertIsArray(state);
  if (type === '$at')
    return readState({ state: state[as.number(arg)], stateActions, cursor });
  if (type === '$distinct')
    return [...new Set(state)];
  const query = constructQuery({ stateActions, cursor });
  if (type === '$find')
    return readState({ state: state.find(query), stateActions, cursor: { ...cursor } });
  if (type === '$filter')
    return readState({ state: state.filter(query), stateActions, cursor: { ...cursor } });
}
