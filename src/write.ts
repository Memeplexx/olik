import { errorMessages, libState } from './constant';
import { RecursiveRecord, StateAction } from './type';
import { is } from './type-check';
import { deepFreeze } from './utility';
import { setNewStateAndNotifyListeners } from './write-complete';

export const processPotentiallyAsyncUpdate = (
  { stateActions, prop }:
  { stateActions: StateAction[], prop: string }
) => {
  return (arg: RecursiveRecord, { cache, eager }: { cache?: number, eager?: unknown } = {}) => {
    deepFreeze(arg);
    if (is.function(arg)) {
      if (!libState.asyncUpdate) { throw new Error(errorMessages.ASYNC_UPDATES_NOT_ENABLED) }
      return libState.asyncUpdate({ arg, cache, eager, prop, stateActions })
    } else {
      setNewStateAndNotifyListeners({ stateActions: [...stateActions, { type: 'action', name: prop, arg, actionType: `${prop}()` }] });
    }
  }
}


