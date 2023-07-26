import { libState, testState } from './constant';

export const transact = (...operations: (() => void)[]) => {
  if (!operations.length) { return; }
  if (operations.length === 1) { return operations[0](); }
  libState.isInsideTransaction = true;
  const internals = libState.store!.$internals;
  internals.currentActions = [];
  operations.forEach(op => op());
  if (libState.olikDevtools && !internals.disableDevtoolsDispatch) {
    libState.olikDevtools.dispatch({insideTransaction: true});
  }
  const reset = () => {
    libState.isInsideTransaction = false;
    internals.currentActions = [];
  }
  if (testState.isTest) { 
    setTimeout(() => reset());
  } else {
    reset();
  }
}
