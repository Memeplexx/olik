import { DevtoolsInstance, ComponentContainerStore, WindowAugmentedWithReduxDevtools } from './shapes-internal';

export const libState = {
  componentContainerStore: null as null | ComponentContainerStore,
  transactionState: 'none' as 'none' | 'started' | 'last',
  storesRegisteredWithDevtools: {} as {[name: string]: DevtoolsInstance },
}

export const testState = {
  logLevel: 'NONE' as 'NONE' | 'DEBUG',
  currentAction: { type: '' },
  currentMutableState: null,
  windowObject: null as null | WindowAugmentedWithReduxDevtools,
  currentActionForDevtools: { type: '' },
}
