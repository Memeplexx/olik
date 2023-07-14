import { libState } from './constant';
import { readState } from './read';
import { RecursiveRecord, StateAction } from './type';
import { copyNewState } from './write-copy';

export const setNewStateAndNotifyListeners = (
  { stateActions }: 
  { stateActions: StateAction[] }
) => {
  const store = libState.store!;
  const oldState = store.$state;
  const internals = store.$internals;
  internals.state = copyNewState({ currentState: oldState, stateToUpdate: { ...oldState }, stateActions, cursor: { index: 0 } }) as RecursiveRecord;
  internals.changeListeners.forEach(({ actions, listener }) => {
    const selectedNewState = readState({ state: store.$state, stateActions: actions, cursor: { index: 0 } });
    if (readState({ state: oldState, stateActions: actions, cursor: { index: 0 } }) !== selectedNewState) {
      listener(selectedNewState);
    }
  })
  if (libState.olikDevtools /*&& !!internals.olikDevtools*/) {
    const stateActionsCopy = stateActions.slice();
    stateActionsCopy[stateActionsCopy.length - 1] = { ...stateActionsCopy[stateActionsCopy.length - 1], name: 'state' };
    libState.olikDevtools.dispatch(state => readState({ state, stateActions: stateActionsCopy, cursor: { index: 0 } }), stateActions[stateActions.length - 1].name);
  }
}