import { constructQuery } from './query';
import { Primitive, RecursiveRecord, StateAction } from './type';

export const readState = (
  { state, stateActions, cursor }:
  { state: RecursiveRecord | Primitive | Array<RecursiveRecord | Primitive>, stateActions: StateAction[], cursor: { index: number } }
): RecursiveRecord | Primitive | Array<RecursiveRecord | Primitive> => {
  if (Array.isArray(state) && (stateActions[cursor.index].type === 'property')) {
    return state.map((e, i) => readState({ state: state[i], stateActions, cursor: { ...cursor } }) as RecursiveRecord | Primitive);
  }
  const action = stateActions[cursor.index++];
  if (cursor.index < stateActions.length) {
    if (Array.isArray(state) && (action.type === 'search')) {
      const query = constructQuery({ stateActions, cursor });
      if ('find' === action.name) {
        return readState({ state: state.find(query)!, stateActions, cursor });
      } else if ('filter' === action.name) {
        return state.filter(query).map(e => readState({ state: e, stateActions, cursor: { ...cursor } })) as Array<RecursiveRecord | Primitive>;
      } else {
        throw new Error();
      }
    } else {
      return readState({ state: ((state || {}) as RecursiveRecord)[action.name], stateActions, cursor });
    }
  } else if (action.name === 'state' || action.name === 'onChange') {
    return state;
  } else {
    throw new Error();
  }
}
