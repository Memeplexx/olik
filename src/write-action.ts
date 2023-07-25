import { comparators, libState, updateFunctions } from './constant';
import { StateAction } from './type';
import { mustBe } from './type-check';

export const setCurrentActionReturningNewState = (
  { newState, payload, stateActions }:
    { stateActions: ReadonlyArray<StateAction>, payload: unknown, newState: unknown }
): unknown => {
  const internals = libState.store!.$internals;
  const currentAction = internals.currentAction;
  const type = stateActions.map(sa => fixCurrentAction(sa)).join('.');
  const action = { type, ...(payload !== null ? { payload } : {}) };
  if (libState.isInsideTransaction) {
    const actions = currentAction.payload === undefined ? undefined : mustBe.arrayOf.record(currentAction.payload);
    internals.currentAction = !actions
      ? { type, payload: [action] }
      : { type: `${currentAction.type}, ${type}`, payload: [...actions, action] };
  } else {
    internals.currentAction = action;
  }
  return newState;
}

const regexp = new RegExp([...comparators, ...updateFunctions].map(c => `^\\${c}$`).join('|'), 'g');
const fixCurrentAction = (action: { name: string, arg?: unknown }) => {
  return action.name.replace(regexp, match => {
    if (updateFunctions.includes(match)) {
      return `${match}()`;
    }
    return `${match}(${action.arg === null || action.arg === undefined ? '' : action.arg})`;
  });
}