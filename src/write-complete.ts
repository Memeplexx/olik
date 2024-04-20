import { libState } from './constant';
import { readState } from './read';
import { StateAction } from './type';
import { assertIsRecord } from './type-check';
import { fixCurrentAction } from './utility';
import { copyNewState } from './write-copy';

export const setNewStateAndNotifyListeners = (
  { stateActions }: { stateActions: StateAction[] }
) => {
  const oldState = libState.state!;
  const stateToUpdate = { ...oldState };
  assertIsRecord(stateToUpdate);
  if (libState.devtools && !libState.disableDevtoolsDispatch) {
    const type = stateActions.map(sa => fixCurrentAction(sa, true)).join('.');
    const typeOrig = stateActions.map(sa => fixCurrentAction(sa, false)).join('.');
    libState.currentAction = {
      type,
      payload: stateActions.at(-1)!.arg,
      typeOrig: type !== typeOrig ? typeOrig : undefined,
    };
  }
  const copy = copyNewState({ currentState: oldState, stateToUpdate, stateActions, cursor: { index: 0 } });
  assertIsRecord(copy);
  libState.state = copy;
  libState.changeListeners.forEach(({ actions, listener }) => {
    const selectedOldState = readState({ state: oldState, stateActions: actions, cursor: { index: 0 } });
    const selectedNewState = readState({ state: libState.state, stateActions: actions, cursor: { index: 0 } });
    if (selectedOldState !== selectedNewState)
      listener(selectedNewState);
  })
  if (libState.devtools && !libState.disableDevtoolsDispatch) {
    if (libState.payloadPaths)
      libState.currentAction!.payloadPaths = libState.payloadPaths;
    libState.devtools.dispatch({ stateActions });
  }
}
