import { libState } from './constant';
import { readState } from './read';
import { StateAction } from './type';
import { copyNewState } from './write-copy';

export const setNewStateAndNotifyListeners = (
  { stateActions }: 
  { stateActions: StateAction[] }
) => {
  const oldState = libState.state;
  libState.state = copyNewState({ currentState: oldState, stateToUpdate: { ...oldState as Record<string, unknown> }, stateActions, cursor: { index: 0 } }) as Record<string, unknown>;
  libState.changeListeners.forEach(({ actions, listener }) => {
    const selectedOldState = readState({ state: oldState, stateActions: actions, cursor: { index: 0 } });
    const selectedNewState = readState({ state: libState.state, stateActions: actions, cursor: { index: 0 } });
    if (selectedOldState !== selectedNewState) {
      listener(selectedNewState);
    }
  })
  if (libState.olikDevtools && !libState.disableDevtoolsDispatch && !libState.isInsideTransaction) {
    libState.olikDevtools.dispatch({});
  }
}
