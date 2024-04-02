import { constructQuery } from './query';
import { StateAction } from './type';
import { assertIsNumber, is } from './type-check';

export const readState = (
  { state, stateActions, cursor }: { state: unknown, stateActions: StateAction[], cursor: { index: number } }
): unknown => {
  const { name: type, arg } = stateActions[cursor.index];
  if (is.array(state) && !is.libArg(type)) {
    return state.map((_, i) => readState({ state: state[i], stateActions, cursor: { ...cursor } }));
  }
  cursor.index++;
  if (cursor.index === stateActions.length) {
    return state;
  }
  if (!is.array(state)) {
    return readState({ state: is.record(state) ? state[type] : undefined, stateActions, cursor });
  }
  if (type === '$at') {
    assertIsNumber(arg);
    return readState({ state: state[arg], stateActions, cursor });
  }
  if (type === '$find') {
    const query = constructQuery({ stateActions, cursor });
    return readState({ state: state.find(query), stateActions, cursor: { ...cursor } });
  }
  if (type === '$filter') {
    const query = constructQuery({ stateActions, cursor });
    return readState({ state: state.filter(query), stateActions, cursor: { ...cursor } });
  }
  if (type === '$distinct') {
    return [...new Set(state)];
  }
}
