import { libState } from './constant';

export const transact = (...operations: (() => void)[]) => {
  if (!operations.length) { return; }
  if (operations.length === 1) { return operations[0](); }
  libState.isInsideTransaction = true;
  operations.forEach(op => op());
  libState.isInsideTransaction = false;
}
