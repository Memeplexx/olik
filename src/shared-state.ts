import { NestedContainerStore, WindowAugmentedWithReduxDevtools } from './shapes-internal';

export const libState = {
  currentAction: { type: '' },
  currentActionForDevtools: { type: '' },
  currentMutableState: null,
  logLevel: 'NONE' as 'NONE' | 'DEBUG',
  windowObject: null as null | WindowAugmentedWithReduxDevtools,
  devTools: null as null | ReturnType<WindowAugmentedWithReduxDevtools['__REDUX_DEVTOOLS_EXTENSION__']['connect']>,
  bypassSelectorFunctionCheck: false,
  nestedContainerStore: null as null | NestedContainerStore,
  transactionState: 'none' as 'none' | 'started' | 'last',
  transactionStartState: null as any,
  transactionActions: new Array<{ type: string }>(),
  activePromises: {} as { [key: string]: Promise<any> },
}
