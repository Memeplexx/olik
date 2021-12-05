export var errorMessages = {
    FIND_RETURNS_NO_MATCHES: 'Could not find array element',
    ASYNC_PAYLOAD_INSIDE_TRANSACTION: 'Transactions do not currently support asynchronous payloads',
    DEVTOOL_DISPATCHED_INVALID_JSON: 'Please dispatch a valid object and ensure that all keys are enclosed in double-quotes',
    DEVTOOL_DISPATCHED_WITH_NO_ACTION: function (type) { return "Cannot dispatch " + type + " because there is no action to perform, eg. replace()"; },
};
export var libState = {
    appStates: {},
    appStores: {},
    changeListeners: {},
    currentAction: {},
    insideTransaction: false,
    logLevel: 'none',
    windowObject: null,
    devtoolsRegistry: {},
    devtoolsDispatchListener: null,
    dispatchToDevtools: true,
    onDispatchListener: function () { return null; },
    currentActionForDevtools: {},
    previousAction: {
        type: '',
        timestamp: 0,
        payloads: [],
        debounceTimeout: 0,
    },
};
export var augmentations = {
    selection: {},
    future: {},
    derivation: {},
    async: function (promise) { return promise(); },
};
export var comparisons = {
    eq: function (val, arg) { return val === arg; },
    in: function (val, arg) { return arg.includes(val); },
    ni: function (val, arg) { return !arg.includes(val); },
    gt: function (val, arg) { return val > arg; },
    lt: function (val, arg) { return val < arg; },
    gte: function (val, arg) { return val >= arg; },
    lte: function (val, arg) { return val <= arg; },
    match: function (val, arg) { return arg.test(val); },
};
export var devtoolsDebounce = 200;
