import { WindowAugmentedWithReduxDevtools } from './shape';

export const tests = {
  currentAction: { type: '', payload: null as any },
  currentMutableState: null,
  logLevel: 'NONE' as 'NONE' | 'DEBUG',
  errorLogged: '',
  windowObject: null as null | WindowAugmentedWithReduxDevtools,
}