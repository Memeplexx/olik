import { libState, testState } from './constant';

export const transact = (...operations: (() => void)[]) => {
  if (!operations.length) { return; }
  if (operations.length === 1) { return operations[0](); }
  libState.isInsideTransaction = true;
  libState.currentActions = [];
  operations.forEach(op => op());
  if (libState.olikDevtools && !libState.disableDevtoolsDispatch) {
    libState.olikDevtools.dispatch({ insideTransaction: true });
  }
  const reset = () => {
    libState.isInsideTransaction = false;
    libState.currentActions = [];
  }
  if (testState.isTest) {
    setTimeout(() => reset());
  } else {
    reset();
  }
}
