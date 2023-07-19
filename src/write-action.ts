import { libState } from './constant';
import { StateAction } from './type';
import { mustBe } from './type-check';

export const setCurrentActionReturningNewState = (
  { newState, payload, stateActions }:
    { stateActions: ReadonlyArray<StateAction>, payload: unknown, newState: unknown }
): unknown => {
  const internals = libState.store!.$internals;
  const currentAction = internals.currentAction;
  const type = stateActions.map(sa => sa.actionType).join('.');
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