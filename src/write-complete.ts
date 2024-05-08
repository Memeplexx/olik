import { libState, testState } from './constant';
import { readState } from './read';
import { StateAction, ValidJsonObject } from './type';
import { fixCurrentAction } from './utility';
import { copyNewState } from './write-copy';


const cursor = { index: 0 };
export const setNewStateAndNotifyListeners = (
  stateActions: StateAction[]
) => {
  const { state: oldState, devtools, disableDevtoolsDispatch } = libState;
  if (devtools && !disableDevtoolsDispatch) {
    const type = stateActions.map(sa => fixCurrentAction(sa, true)).join('.');
    const typeOrig = stateActions.map(sa => fixCurrentAction(sa, false)).join('.');
    testState.currentActionType = type;
    testState.currentActionTypeOrig = type !== typeOrig ? typeOrig : undefined;
    testState.currentActionPayload = stateActions.at(-1)!.arg;
  }
  cursor.index = 0;
  libState.state = copyNewState(oldState!, stateActions, cursor) as ValidJsonObject;
  notifyChangeListeners(oldState!);
  if (devtools && !disableDevtoolsDispatch) {
    devtools.dispatch({ stateActions, actionType: testState.currentActionType, payloadPaths: testState.currentActionPayloadPaths });
  }
}

const notifyChangeListeners = (
  oldState: ValidJsonObject,
) => {
  libState.changeListeners.forEach(el => {
    const { actions, listener, cachedState } = el;
    const selectedOldState = cachedState !== undefined ? cachedState : readState(oldState, actions);
    const selectedNewState = readState(libState.state, actions);
    const notify = () => {
      el.cachedState = selectedNewState;
      listener(selectedNewState);
    }
    if (Array.isArray(selectedOldState) && Array.isArray(selectedNewState)) {
      if (selectedNewState.length === selectedOldState.length) {
        for (let i = 0; i < selectedOldState.length; i++) {
          if (selectedOldState[i] !== selectedNewState[i]) {
            notify();
            break;
          }
        }
      } else {
        notify();
      }
    } else if (selectedOldState !== selectedNewState) {
      notify();
    }
  })
}