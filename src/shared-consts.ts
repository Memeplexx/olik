export const errorMessages = {
  DEVTOOL_DISPATCHED_INVALID_JSON: 'Please dispatch a valid object and ensure that all keys are enclosed in double-quotes',
  DEVTOOL_DISPATCHED_WITH_NO_ACTION: (type: string) => `Cannot dispatch ${type} because there is no action to perform, eg. replace()`,
  DEVTOOL_CANNOT_FIND_EXTENSION: 'Cannot find Redux Devtools Extension. Please install it in your browser or else turn it off when creating your store as follows: `createApplicationStore(..., { devtools: false })`.',
  INVALID_CONTAINER_FOR_COMPONENT_STORES: `Could not to attach a component store to your application store because the root of your application store is either a primitive or an array`,
  INVALID_CONTAINER_FOR_CACHED_DATA: `If you want to support caching, then your stores initial state cannot be a primitive or an array`,
  PROMISES_NOT_ALLOWED_IN_TRANSACTIONS: `Transactions do not currently support asynchronous payloads (functions returning promises)`,
  INVALID_STATE_INPUT: 'State can only be primitive or a POJO. It may not contain any functions, Sets, Maps etc',
  ILLEGAL_CHARACTERS_WITHIN_SELECTOR: (functionName: 'get' | 'getProp') => `Illegal characters detected in your ${functionName}() function. If you are attempting to find or filter array elements, then you can do so as follows: 'select(s => s.some.array).find(s => s.id).eq(3)'`,
  NO_ARRAY_ELEMENT_FOUND: `Could not find array element`,
  CANNOT_CHANGE_INSTANCE_NAME: 'Cannot change instanceName if one has already been set',
};

export const devtoolsDebounce = 200;
export const expressionsNotAllowedInSelectorFunction = [/\=[^>]/, /</, /[^\=]>/, /&/, /\|/, /\.[A-z0-9]+\(.*\)/];