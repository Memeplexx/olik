import { libState } from './constant';
import { OlikAction, StateAction } from './type';
import { fixCurrentAction } from './utility';

export const setActionAndReturnState = (
  { newState, payload, payloadPaths, stateActions }:
    { stateActions: ReadonlyArray<StateAction>, payload?: unknown, payloadPaths?: Record<string, string>, newState: unknown }
): unknown => {
  const type = stateActions.map(sa => fixCurrentAction(sa, true)).join('.');
  const typeOrig = stateActions.map(sa => fixCurrentAction(sa, false)).join('.');
  const action: OlikAction = { type, payload };
  if (type !== typeOrig) {
    action.typeOrig = typeOrig;
  }
  if (payloadPaths) {
    action.payloadPaths = payloadPaths;
  }
  libState.currentAction = action;
  return newState;
}
