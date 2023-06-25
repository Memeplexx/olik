import { libState } from './constant';
import { readState } from './read';
import { StateAction } from './type';
import { copyNewState } from './write-copy';

export const setNewStateAndNotifyListeners = (
  { stateActions }: 
  { stateActions: StateAction[] }
) => {
  const store = libState.store;
  const oldState = store.$state;
  const internals = store.$internals;
  internals.state = copyNewState({ currentState: oldState, stateToUpdate: { ...oldState }, stateActions, cursor: { index: 0 } });
  internals.changeListeners.forEach(({ actions, listener }) => {
    const selectedNewState = readState({ state: store.$state, stateActions: actions, cursor: { index: 0 } });
    if (readState({ state: oldState, stateActions: actions, cursor: { index: 0 } }) !== selectedNewState) {
      listener(selectedNewState);
    }
  })
  if (!!libState.olikDevtools && !!internals.olikDevtools) {
    libState.olikDevtools.dispatch(s => readState({ state: s, stateActions, cursor: { index: 0 } }), stateActions[stateActions.length - 1].name);
  }
}