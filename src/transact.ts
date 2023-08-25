import { libState, testState } from './constant';

export const transact = (operations: () => void) => {
  libState.isInsideTransaction = true;
  libState.currentActions = [];
  operations();
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
