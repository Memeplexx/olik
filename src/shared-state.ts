import { DevtoolsInstance, NestedContainerStore, WindowAugmentedWithReduxDevtools } from './shapes-internal';

export const libState = {
  nestedContainerStore: null as null | NestedContainerStore,
  transactionState: 'none' as 'none' | 'started' | 'last',
  nestedStoresAutoGenKeys: {} as {[componentName: string]: number},
  storesRegisteredWithDevtools: {} as {[name: string]: DevtoolsInstance },
}

export const testState = {
  logLevel: 'NONE' as 'NONE' | 'DEBUG',
  currentAction: { type: '' },
  currentMutableState: null,
  windowObject: null as null | WindowAugmentedWithReduxDevtools,
  currentActionForDevtools: { type: '' },
}
