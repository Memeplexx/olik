import { libState } from "./shared-state";

export function transact(...operations: (() => void)[]) {
  libState.transactionState = 'started';
  operations.forEach((operation, i) => {
    if (i === operations.length - 1) {
      libState.transactionState = 'last';
    }
    operation();
  });
}
