export const errorMessages = {
  DEVTOOL_DISPATCHED_INVALID_JSON: 'Please dispatch a valid object and ensure that all keys are enclosed in double-quotes',
  DEVTOOL_DISPATCHED_WITH_NO_ACTION: (type: string) => `Cannot dispatch ${type} because there is no action to perform, eg. replace()`,
  DEVTOOL_CANNOT_FIND_EXTENSION: 'Cannot find Redux Devtools Extension. Please install it in your browser.',
  INVALID_CONTAINER_FOR_NESTED_STORES: `If a store is marked with 'containerForNestedStores: true', then it's initial state cannot be a primitive or an array`,
  INVALID_STATE_INPUT: 'State can only be primitive or a POJO. It may not contain any functions, Sets, Maps etc',
  ILLEGAL_CHARACTERS_WITHIN_SELECTOR: (functionName: 'selector' | 'getProp') => `Illegal characters detected in your ${functionName}() function. This function may only select a property, for example: 's => s.some.property', and no additional function invocations are allowed within the function.`,
  NO_ARRAY_ELEMENT_FOUND: `Could not find array element`,
  REPLACE_ELSE_INSERT_WITHOUT_MATCH: 'replaceElseInsert() must be followed by match(), for example: ...replaceElseInsert().match(s => s.id);',
};

export const devtoolsDebounce = 200;
export const expressionsNotAllowedInSelectorFunction = [/\=[^>]/, /</, /[^\=]>/, /&/, /\|/, /\.[A-z0-9]+\(.*\)/];