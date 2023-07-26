import { comparators, libState, updateFunctions } from './constant';
import { StateAction } from './type';

export const setCurrentActionReturningNewState = (
  { newState, payload, stateActions }:
    { stateActions: ReadonlyArray<StateAction>, payload: unknown, newState: unknown }
): unknown => {
  const type = stateActions.map(sa => fixCurrentAction(sa)).join('.');
  const action = { type, ...(payload !== undefined ? { payload } : {}) };
  if (libState.isInsideTransaction) {
    libState.currentActions.push(action);
  } else {
    libState.currentAction = action;
  }
  return newState;
}

const regexp = new RegExp([...comparators, ...updateFunctions].map(c => `^\\${c}$`).join('|'), 'g');
const fixCurrentAction = (action: { name: string, arg?: unknown }) => {
  return action.name.replace(regexp, match => {
    if (updateFunctions.includes(match)) {
      return `${match}()`;
    }
    return `${match}(${action.arg === null || action.arg === undefined ? '' : JSON.stringify(action.arg)})`;
  });
}