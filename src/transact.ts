import { libState } from './shared-state';

export function transact(...operations: (() => void)[]) {
  if (operations.length === 1) {
    operations[0]();
    return;
  }
  libState.transactionState = 'started';
  operations.forEach((operation, i) => {
    if (i === operations.length - 1) {
      libState.transactionState = 'last';
    }
    operation();
  });
}
