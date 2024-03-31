import { libState } from './constant';
import { readState } from './read';
import { StateAction } from './type';
import { assertIsRecord } from './type-check';
import { copyNewState } from './write-copy';

export const setNewStateAndNotifyListeners = (
  { stateActions }: { stateActions: StateAction[] }
) => {
  const oldState = libState.state!;
  const stateToUpdate = { ...oldState };
  assertIsRecord(stateToUpdate);
  const copy = copyNewState({ currentState: oldState, stateToUpdate, stateActions, cursor: { index: 0 } });
  assertIsRecord(copy);
  libState.state = copy;
  libState.changeListeners.forEach(({ actions, listener }) => {
    const selectedOldState = readState({ state: oldState, stateActions: actions, cursor: { index: 0 } });
    const selectedNewState = readState({ state: libState.state, stateActions: actions, cursor: { index: 0 } });
    if (selectedOldState !== selectedNewState) {
      listener(selectedNewState);
    }
  })
  if (libState.olikDevtools && !libState.disableDevtoolsDispatch) {
    libState.olikDevtools.dispatch({ stateActions });
  }
}
