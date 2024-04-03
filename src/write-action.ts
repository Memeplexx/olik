import { libState } from './constant';
import { OlikAction, StateAction } from './type';
import { fixCurrentAction } from './utility';

export const setCurrentActionReturningNewState = (
  { newState, payloadIncoming, payloadSanitized, payloadStringified, stateActions }:
    { stateActions: ReadonlyArray<StateAction>, payloadIncoming: unknown, payloadSanitized: unknown, payloadStringified: unknown, newState: unknown }
): unknown => {
  const type = stateActions.map(sa => fixCurrentAction(sa, true)).join('.');
  const typeOrig = stateActions.map(sa => fixCurrentAction(sa, false)).join('.');
  const action: OlikAction = {
    type,
    ...( type !== typeOrig ? { typeOrig } : {} ),
    payload: payloadSanitized,
    ...( payloadIncoming !== payloadSanitized ? { payloadOrig: payloadStringified } :  {} ),
  };
  libState.currentAction = action;
  return newState;
}
