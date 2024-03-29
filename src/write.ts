import { errorMessages, libState } from './constant';
import { StateAction } from './type';
import { deepFreeze } from './utility';
import { setNewStateAndNotifyListeners } from './write-complete';

export const processPotentiallyAsyncUpdate = (
  { stateActions, prop, arg, cache, eager }:
    { stateActions: StateAction[], prop: string, arg: unknown, cache?: number, eager?: unknown }
) => {
  deepFreeze(arg);
  if (typeof (arg) === 'function') {
    if (!libState.asyncUpdate) { throw new Error(errorMessages.ASYNC_UPDATES_NOT_ENABLED) }
    return libState.asyncUpdate({ arg, cache, eager, prop, stateActions })
  } else {
    setNewStateAndNotifyListeners({ stateActions: [...stateActions, { name: prop, arg }] });
  }
}

