import { Augmentations, StateAction } from "./type"

export const errorMessages = {
  FIND_RETURNS_NO_MATCHES: 'Could not find array element',
  ASYNC_PAYLOAD_INSIDE_TRANSACTION: 'Transactions do not currently support asynchronous payloads',
}

export const libState = {
  appStates: {} as { [storeName: string]: any },
  changeListeners: {} as { [storeName: string]: Map<StateAction[], (arg: any) => any> },
  currentAction: {} as { [key: string]: any },
  insideTransaction: false,
  logLevel: 'none' as ('debug' | 'none'),
}

export const augmentations: Augmentations = {
  selection: {},
  future: {},
  derivation: {},
  async: promise => promise(),
};

export const comparisons = {
  eq: (val, arg) => val === arg,
  in: (val, arg) => arg.includes(val),
  ni: (val, arg) => !arg.includes(val),
  gt: (val, arg) => val > arg,
  lt: (val, arg) => val < arg,
  gte: (val, arg) => val >= arg,
  lte: (val, arg) => val <= arg,
  match: (val, arg) => arg.test(val),
} as { [comparator: string]: (val: any, arg: any) => boolean };
