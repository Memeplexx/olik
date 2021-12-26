import { constructQuery } from './query';
import { StateAction } from './type';

export const readState = (
  { state, stateActions, cursor }:
  { state: any, stateActions: StateAction[], cursor: { index: number } }
): any => {
  if (Array.isArray(state) && (stateActions[cursor.index].type === 'property')) {
    return (state as any[]).map((e, i) => readState({ state: state[i], stateActions, cursor: { ...cursor } }));
  }
  const action = stateActions[cursor.index++];
  if (cursor.index < stateActions.length) {
    if (Array.isArray(state) && (action.type === 'search')) {
      const query = constructQuery({ stateActions, cursor });
      if ('find' === action.name) {
        return readState({ state: (state as any[]).find(query), stateActions, cursor });
      } else if ('filter' === action.name) {
        return (state as any[]).filter(query).map(e => readState({ state: e, stateActions, cursor: { ...cursor } }));
      }
    } else {
      return readState({ state: (state || {})[action.name], stateActions, cursor });
    }
  } else if (action.name === 'state' || action.name === 'onChange') {
    return state;
  }
}
