import { libState, testState } from './constant';
import { readState } from './read';
import { StateAction, ValidJsonObject } from './type';
import { fixCurrentAction } from './utility';
import { copyNewState } from './write-copy';


const cursor = { index: 0 };
export const setNewStateAndNotifyListeners = (
  stateActions: StateAction[]
) => {
  const { state: oldState, devtools, disableDevtoolsDispatch, changeListeners } = libState;
  if (devtools && !disableDevtoolsDispatch) {
    const type = stateActions.map(sa => fixCurrentAction(sa, true)).join('.');
    const typeOrig = stateActions.map(sa => fixCurrentAction(sa, false)).join('.');
    testState.currentActionType = type;
    testState.currentActionTypeOrig = type !== typeOrig ? typeOrig : undefined;
    testState.currentActionPayload = stateActions.at(-1)!.arg;
  }
  cursor.index = 0;
  libState.state = copyNewState(oldState!, stateActions, cursor) as ValidJsonObject;
  changeListeners.forEach(({ actions, listener }) => {
    const selectedOldState = readState(oldState, actions);
    const selectedNewState = readState(libState.state, actions);
    if (selectedOldState !== selectedNewState)
      listener(selectedNewState);
  })
  if (devtools && !disableDevtoolsDispatch) {
    devtools.dispatch({ stateActions, actionType: testState.currentActionType, payloadPaths: testState.currentActionPayloadPaths });
  }
}
