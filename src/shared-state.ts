import { ComponentContainerStore, WindowAugmentedWithReduxDevtools } from './shapes-internal';

export const libState = {
  applicationStore: null as null | ComponentContainerStore,
  transactionState: 'none' as 'none' | 'started' | 'last',
}

export const testState = {
  logLevel: 'NONE' as 'NONE' | 'DEBUG',
  currentAction: { type: '' },
  windowObject: null as null | WindowAugmentedWithReduxDevtools,
  currentActionForDevtools: { type: '' },
}
