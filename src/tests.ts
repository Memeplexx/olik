import { WindowAugmentedWithReduxDevtools } from './shape';

export const tests = {
  currentAction: { type: '', payload: null as any },
  currentActionForDevtools: { type: '', payload: null as any },
  currentMutableState: null,
  logLevel: 'NONE' as 'NONE' | 'DEBUG',
  windowObject: null as null | WindowAugmentedWithReduxDevtools,
  devTools: null as null | ReturnType<WindowAugmentedWithReduxDevtools['__REDUX_DEVTOOLS_EXTENSION__']['connect']>,
  bypassArrayFunctionCheck: false,
}