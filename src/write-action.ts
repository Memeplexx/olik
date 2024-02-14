import { libState } from './constant';
import { OlikAction, StateAction } from './type';
import { fixCurrentAction } from './utility';

export const setCurrentActionReturningNewState = (
  { newState, payload, payloadOrig, stateActions }:
    { stateActions: ReadonlyArray<StateAction>, payload: unknown, payloadOrig?: unknown, newState: unknown }
): unknown => {
  const type = stateActions.map(sa => fixCurrentAction(sa, true)).join('.');
  const typeOrig = stateActions.map(sa => fixCurrentAction(sa, false)).join('.');
  const action: OlikAction = { type, ...(payload !== undefined ? { payload } : {}), ...(payloadOrig !== undefined ? { payloadOrig } : {}) };
  if (type !== typeOrig) {
    action.typeOrig = typeOrig;
  }
  libState.currentAction = action;
  return newState;
}
