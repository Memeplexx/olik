import { libState } from './constant';
import { StateAction } from './type';

export const setCurrentActionReturningNewState = (
  { newState, payload, stateActions, storeName, currentState }: 
  { storeName: string, stateActions: ReadonlyArray<StateAction>, payload: null | {}, newState: any, currentState: any }
) => {
  const internals = libState.stores[storeName].$internals;
  const currentAction = internals.currentAction;
  const type = stateActions.map(sa => sa.actionType).join('.');
  internals.oldStateSelected = currentState;
  internals.currentAction = !libState.isInsideTransaction ? { type, ...payload }
    : !currentAction.actions ? { type, actions: [{ type, ...payload }] }
      : { type: `${currentAction.type}, ${type}`, actions: [...currentAction.actions, { type, ...payload }] };
  return newState;
}