import { libState } from './constant';


export const deepFreeze = <T extends Object>(o: T): T => {
  Object.freeze(o);
  if (o == null || o === undefined) { return o; }
  (Object.getOwnPropertyNames(o) as Array<keyof T>).forEach(prop => {
    if (o.hasOwnProperty(prop)
      && o[prop] !== null
      && (typeof (o[prop]) === 'object' || typeof (o[prop]) === 'function')
      && !Object.isFrozen(o[prop])) {
      deepFreeze(o[prop]);
    }
  });
  return o;
}

export const getStoreByName = (name: string) => libState.stores[name];

export const listenToDevtoolsDispatch = (onDispatch: () => any) => libState.onInternalDispatch = onDispatch;
