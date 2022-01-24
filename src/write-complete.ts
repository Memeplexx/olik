import { libState } from './constant';
import { readState } from './read';
import { StateAction } from './type';
import { copyNewState } from './write-copy';

export const setNewStateAndNotifyListeners = (
  { storeName, stateActions }: 
  { storeName: string, stateActions: StateAction[] }
) => {
  const store = libState.stores[storeName];
  const oldState = store.$state;
  const internals = store.internals;
  internals.state = copyNewState({ storeName, currentState: oldState, stateToUpdate: { ...oldState }, stateActions, cursor: { index: 0 } });
  internals.changeListeners.forEach(({ actions, listener }) => {
    const selectedNewState = readState({ state: store.$state, stateActions: actions, cursor: { index: 0 } });
    if (readState({ state: oldState, stateActions: actions, cursor: { index: 0 } }) !== selectedNewState) {
      listener(selectedNewState);
    }
  })
  if (!!libState.reduxDevtools && !!internals.reduxDevtools) {
    libState.reduxDevtools.dispatch(storeName);
  }
}