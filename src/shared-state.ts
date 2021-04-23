import { NestedContainerStore, WindowAugmentedWithReduxDevtools } from './shapes-internal';

export const libState = {
  nestedContainerStore: null as null | NestedContainerStore,
  transactionState: 'none' as 'none' | 'started' | 'last',
}

export const testState = {
  logLevel: 'NONE' as 'NONE' | 'DEBUG',
  currentAction: { type: '' },
  currentMutableState: null,
  windowObject: null as null | WindowAugmentedWithReduxDevtools,
  currentActionForDevtools: { type: '' },
}
