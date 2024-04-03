import { libState } from './constant';
import { OlikAction, StateAction } from './type';
import { fixCurrentAction } from './utility';

export const setCurrentActionReturningNewState = (
  { newState, payload, payloadOriginal, stateActions, found }:
    { stateActions: ReadonlyArray<StateAction>, payload: unknown, payloadOriginal?: unknown, newState: unknown, found?: boolean }
): unknown => {
  const type = stateActions.map(sa => fixCurrentAction(sa, true)).join('.');
  const typeOrig = stateActions.map(sa => fixCurrentAction(sa, false)).join('.');
  const action: OlikAction = { type, ...(payload !== undefined ? { payload } : {}), ...(found ? { payloadOrig: payloadOriginal }! : {}) };
  if (type !== typeOrig) {
    action.typeOrig = typeOrig;
  }
  libState.currentAction = action;
  return newState;
}
