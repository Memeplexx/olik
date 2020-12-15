export const errorMessages = {
  DEVTOOL_DISPATCHED_INVALID_JSON: 'Please dispatch a valid object and ensure that all keys are enclosed in double-quotes',
  DEVTOOL_DISPATCHED_WITH_NO_ACTION: (type: string) => `Cannot dispatch ${type} because there is no action to perform, eg. replaceWith()`,
  DEVTOOL_CANNOT_FIND_EXTENSION: 'Cannot find Redux Devtools Extension',
  INVALID_CONTAINER_FOR_NESTED_STORES: `If a store is marked with 'containerForNestedStores: true', then it's initial state cannot be a primitive or an array`,
  INVALID_STATE_INPUT: 'State can only be primitive or a POJO. It may not contain any functions, sets, maps etc',
  UPSERT_MORE_THAN_ONE_MATCH: 'Cannot upsert more than 1 element',
  ILLEGAL_FUNCTION_INVOKED_WITHIN_SELECTOR: (prop: string) => `'${prop}()' is not allowed within the selector function. If you're trying to filter elements, rather use a library function eg. 'select(s => s.todos).removeWhere(e => e.status === 'done')'`,
};

export const devtoolsDebounce = 200;