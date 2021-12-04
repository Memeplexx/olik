import { errorMessages } from './constant';
import { constructQuery } from './query';
import { StateAction } from './type';

export const readState = (state: any, stateActions: StateAction[], cursor: { index: number }, throwIfNoArrayElementFound: boolean): any => {
  if (Array.isArray(state) && (stateActions[cursor.index].type === 'property')) {
    return (state as any[]).map((e, i) => readState(state[i], stateActions, { ...cursor }, throwIfNoArrayElementFound));
  }
  const action = stateActions[cursor.index++];
  if (cursor.index < stateActions.length) {
    if (Array.isArray(state) && (action.type === 'search')) {
      const query = constructQuery(stateActions, cursor);
      if ('find' === action.name) {
        const findResult = readState((state as any[]).find(query), stateActions, cursor, throwIfNoArrayElementFound);
        if (findResult === undefined && throwIfNoArrayElementFound) { throw new Error(errorMessages.FIND_RETURNS_NO_MATCHES); }
        return findResult;
      } else if ('filter' === action.name) {
        return (state as any[]).filter(query).map(e => readState(e, stateActions, { ...cursor }, throwIfNoArrayElementFound));
      }
    } else {
      return readState((state || {})[action.name], stateActions, cursor, throwIfNoArrayElementFound);
    }
  } else if (action.name === 'read' || action.name === 'onChange') {
    return state;
  }
}
