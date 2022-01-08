import { errorMessages, libState } from './constant';
import { StateAction } from './type';
import { deepFreeze } from './utility';
import { setNewStateAndNotifyListeners } from './write-complete';

export const processPotentiallyAsyncUpdate = (
  { storeName, stateActions, prop }:
  { storeName: string, stateActions: StateAction[], prop: string }
) => {
  return (arg: any, { cacheFor, optimisticallyUpdateWith }: { cacheFor?: number, optimisticallyUpdateWith?: any } = {}) => {
    deepFreeze(arg);
    if (typeof (arg) !== 'function') {
      setNewStateAndNotifyListeners({ storeName, stateActions: [...stateActions, { type: 'action', name: prop, arg, actionType: `${prop}()` }] });
    } else {
      if (!libState.asyncUpdate) { throw new Error(errorMessages.ASYNC_UPDATES_NOT_ENABLED) }
      return libState.asyncUpdate({ arg, cacheFor, optimisticallyUpdateWith, prop, stateActions, storeName })
    }
  }
}


