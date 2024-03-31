import { anyLibProp } from './constant';
import { constructQuery } from './query';
import { StateAction } from './type';
import { is, mustBe } from './type-check';

export const readState = (
  { state, stateActions, cursor }: { state: unknown, stateActions: StateAction[], cursor: { index: number } }
): unknown => {
  if (is.array(state) && !anyLibProp.includes(stateActions[cursor.index].name)) {
    return state.map((_, i) => readState({ state: state[i], stateActions, cursor: { ...cursor } }));
  }
  const action = stateActions[cursor.index++];
  const type = action.name;
  if (cursor.index < stateActions.length) {
    if (type === '$at' && mustBe.array(state) && mustBe.number(action.arg)) {
      return readState({ state: state[action.arg], stateActions, cursor });
    }
    if (type === '$find' && mustBe.array(state)) {
      const query = constructQuery({ stateActions, cursor });
      return readState({ state: state.find(query)!, stateActions, cursor });
    }
    if (type === '$filter' && mustBe.array(state)) {
      const query = constructQuery({ stateActions, cursor });
      return readState({ state: state.filter(query)!, stateActions, cursor: { ...cursor } });
    }
    if (type === '$distinct' && is.array(state)) {
      return [...new Set(state)];
    }
    return readState({ state: is.record(state) ? state[type] : undefined, stateActions, cursor });
  }
  if (type === '$state' || type === '$onChange') {
    return state;
  }
  throw new Error();
}
