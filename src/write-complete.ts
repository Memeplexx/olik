import { libState, testState } from './constant';
import { readState } from './read';
import { StateAction } from './type';
import { as } from './type-check';
import { fixCurrentAction } from './utility';
import { copyNewState } from './write-copy';

export const setNewStateAndNotifyListeners = (
  { stateActions }: { stateActions: StateAction[] }
) => {
  const oldState = libState.state!;
  if (libState.devtools && !libState.disableDevtoolsDispatch) {
    const type = stateActions.map(sa => fixCurrentAction(sa, true)).join('.');
    const typeOrig = stateActions.map(sa => fixCurrentAction(sa, false)).join('.');
    testState.currentActionType = type;
    testState.currentActionTypeOrig = type !== typeOrig ? typeOrig : undefined;
    testState.currentActionPayload = stateActions.at(-1)!.arg;
  }
  libState.state = as.record(copyNewState({ currentState: oldState, stateActions, cursor: { index: 0 } }));
  libState.changeListeners.forEach(({ actions, listener }) => {
    const selectedOldState = readState({ state: oldState, stateActions: actions });
    const selectedNewState = readState({ state: libState.state, stateActions: actions });
    if (selectedOldState !== selectedNewState)
      listener(selectedNewState);
  })
  if (libState.devtools && !libState.disableDevtoolsDispatch) {
    libState.devtools.dispatch({ stateActions, actionType: testState.currentActionType, payloadPaths: testState.currentActionPayloadPaths });
  }
}
