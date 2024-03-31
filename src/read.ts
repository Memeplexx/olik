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
  if (cursor.index < stateActions.length) {
    if (is.array(state) && ['$find', '$filter', '$at'].includes(action.name)) {
      const query = constructQuery({ stateActions, cursor });
      if ('$at' === action.name && mustBe.number(action.arg)) {
        return readState({ state: state[action.arg], stateActions, cursor });
      } else if ('$find' === action.name) {
        return readState({ state: state.find(query)!, stateActions, cursor });
      } else if ('$filter' === action.name) {
        return readState({ state: state.filter(query)!, stateActions, cursor: { ...cursor } });
      } else {
        throw new Error();
      }
    } else if (is.array(state) && '$distinct' === action.name) {
      return [...new Set(state)];
    } else {
      return readState({ state: is.record(state) ? state[action.name] : undefined, stateActions, cursor });
    }
  } else if (action.name === '$state' || action.name === '$onChange') {
    return state;
  } else {
    throw new Error();
  }
}
