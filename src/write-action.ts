import { libState } from './constant';
import { Primitive, RecursiveRecord, StateAction } from './type';

export const setCurrentActionReturningNewState = (
  { newState, payload, stateActions }:
    { stateActions: ReadonlyArray<StateAction>, payload: undefined | null | RecursiveRecord | Primitive | Array<RecursiveRecord | Primitive>, newState: RecursiveRecord | Primitive | Array<RecursiveRecord | Primitive> }
): RecursiveRecord | Primitive | Array<RecursiveRecord | Primitive> => {
  const internals = libState.store!.$internals;
  const currentAction = internals.currentAction;
  const type = stateActions.map(sa => sa.actionType).join('.');
  const action = { type, ...(payload !== null ? { payload } : {}) };
  if (libState.isInsideTransaction) {
    const actions = (currentAction as { payload: { type: string, payload?: unknown }[] }).payload;
    internals.currentAction = !actions
      ? { type, payload: [action] }
      : { type: `${currentAction.type}, ${type}`, payload: [...actions, action] };
  } else {
    internals.currentAction = action;
  }
  return newState;
}