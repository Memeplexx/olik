import { libState } from './constant';
import { readState } from './read';
import { StateAction } from './type';
import { copyNewState } from './write-copy';

export const setNewStateAndNotifyListeners = (
  { storeName, stateActions, batchActions }: 
  { storeName: string, stateActions: StateAction[], batchActions?: number }
) => {
  const store = libState.stores[storeName];
  const oldState = store.state;
  const internals = store.internals;
  internals.state = copyNewState({ storeName, currentState: oldState, stateToUpdate: { ...oldState }, stateActions, cursor: { index: 0 } });
  internals.changeListeners.forEach(({ actions, listener }) => {
    const selectedNewState = readState({ state: store.state, stateActions: actions, cursor: { index: 0 } });
    if (readState({ state: oldState, stateActions: actions, cursor: { index: 0 } }) !== selectedNewState) {
      listener(selectedNewState);
    }
  })

  // Dispatch to devtools
  if (internals.reduxDevtools?.dispatcher && !internals.reduxDevtools.disableDispatch) {
    const currentAction = internals.currentAction;
    const dispatchToDevtools = (batched?: any[]) => {
      const action = batched ? { ...currentAction, batched } : currentAction;
      internals.reduxDevtools!.dispatcher(action);
    }

    // if the user is not batching actions, simply dispatch immediately, and return
    if (!batchActions) { dispatchToDevtools(); return; }

    // If the action's type is different from the batched action's type, 
    // update the batched action type to match the current action type, 
    // and dispatch to devtools immediately
    if (internals.batchedAction.type !== currentAction.type) {
      internals.batchedAction.type = currentAction.type;
      dispatchToDevtools();

      // The presence of a batched action type means the actions are currently being batched.
    } else if (internals.batchedAction.type) {
      // Add the current payload into the batch
      internals.batchedAction.payloads.push(currentAction.payload);
      // Clear the existing timeout so that the batch is not prematurely expired
      window.clearTimeout(internals.batchedAction.timeoutHandle);
      // kick of a new timeout which, when reached, should reset the batched action to its pristine state
      internals.batchedAction.timeoutHandle = window.setTimeout(() => {
        // Remove the last payload from the batch because it is a duplication of the root action payload
        internals.batchedAction.payloads.pop();
        // Dispatch the batch to devtools and reset it
        dispatchToDevtools(internals.batchedAction.payloads);
        internals.batchedAction.type = '';
        internals.batchedAction.payloads = [];
      }, batchActions);
    }
  }
}