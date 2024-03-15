import { anyLibProp } from './constant';
import { constructQuery } from './query';
import { StateAction } from './type';
import { either, is } from './type-check';

export const readState = (
  { state, stateActions, cursor }: { state: unknown, stateActions: StateAction[], cursor: { index: number } }
): unknown => {
  if (Array.isArray(state) && !anyLibProp.includes(stateActions[cursor.index].name)) {
    return state.map((_, i) => readState({ state: state[i], stateActions, cursor: { ...cursor } }));
  }
  const action = stateActions[cursor.index++];
  if (cursor.index < stateActions.length) {
    if (Array.isArray(state) && ['$find', '$filter', '$at'].includes(action.name)) {
      const query = constructQuery({ stateActions, cursor });
      if ('$at' === action.name) {
        return readState({ state: state[action.arg as number], stateActions, cursor });
      } else if ('$find' === action.name) {
        return readState({ state: state.find(query)!, stateActions, cursor });
      } else if ('$filter' === action.name) {
        return readState({ state: state.filter(query)!, stateActions, cursor: { ...cursor } });
      } else {
        throw new Error();
      }
    } else if (Array.isArray(state) && '$distinct' === action.name) {
      return Array.from(new Set(state));
    } else {
      return readState({ state: Array.isArray(state) || is.primitive(state) ? undefined : (either(state).else({}) as Record<string, unknown>)[action.name], stateActions, cursor });
    }
  } else if (action.name === '$state' || action.name === '$onChange') {
    return state;
  } else {
    throw new Error();
  }
}
