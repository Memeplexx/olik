import { constructQuery } from './query';
import { StateAction } from './type';
import { either, is, mustBe } from './type-check';

export const readState = (
  { state, stateActions, cursor }: { state: unknown, stateActions: StateAction[], cursor: { index: number } }
): unknown => {
  if (is.arrayOf.actual(state) && (stateActions[cursor.index].type === 'property')) {
    return state.map((e, i) => readState({ state: state[i], stateActions, cursor: { ...cursor } }));
  }
  const action = stateActions[cursor.index++];
  if (cursor.index < stateActions.length) {
    if (is.arrayOf.actual(state) && (action.type === 'search')) {
      const query = constructQuery({ stateActions, cursor });
      if ('find' === action.name) {
        return readState({ state: state.find(query)!, stateActions, cursor });
      } else if ('filter' === action.name) {
        return state.filter(query).map(e => readState({ state: e, stateActions, cursor: { ...cursor } }));
      } else {
        throw new Error();
      }
    } else {
      return readState({ state: is.arrayOf.actual(state) || is.primitive(state) ? undefined : mustBe.record(either(state).else({}))[action.name], stateActions, cursor });
    }
  } else if (action.name === 'state' || action.name === 'onChange') {
    return state;
  } else {
    throw new Error();
  }
}
