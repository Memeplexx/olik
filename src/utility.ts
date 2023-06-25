import { libState, testState } from './constant';


export const deepFreeze = <T extends object>(o: T): T => {
  Object.freeze(o);
  if (o == null || o === undefined) { return o; }
  (Object.getOwnPropertyNames(o) as Array<keyof T>).forEach(prop => {
    if (o.hasOwnProperty(prop)
      && o[prop] !== null
      && (typeof (o[prop]) === 'object' || typeof (o[prop]) === 'function')
      && !Object.isFrozen(o[prop])) {
      deepFreeze(o[prop] as unknown as object);
    }
  });
  return o;
}

export const getStore = () => libState.store;

export const resetLibraryState = () => {
  testState.logLevel = 'none';
  libState.store = undefined as any;
  libState.isInsideTransaction = false;
};
