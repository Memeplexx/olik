import { errorMessages, libState, testState } from './constant';
import { Read, ReduxDevtoolsOptions, Replace, ReplaceAll } from './type';
import { StoreInternal, WindowAugmentedWithReduxDevtools } from './type-internal';

export function trackWithReduxDevtools<S>(
  args: ReduxDevtoolsOptions,
) {
  const storeArg = args.store as StoreInternal<S>;
  const internals = storeArg.internals;

  // do not continue if this is a nested store
  if (!!internals.nestedStoreInfo) { return; }

  // mock out the window object for testing purposes
  let windowObj = window as any as WindowAugmentedWithReduxDevtools;
  if (testState.fakeWindowObjectForReduxDevtools) {
    windowObj = testState.fakeWindowObjectForReduxDevtools as WindowAugmentedWithReduxDevtools;
  }

  // If user does not have devtools installed or enabled, warn & return.
  if (!windowObj.__REDUX_DEVTOOLS_EXTENSION__) {
    console.warn('Please install the Redux Devtools extension in your browser');
    return;
  }

  // If a devtools instance has already been registered, do not re-create that instance.
  // This problem really only presents its self when hot-reloading is being used
  const storeName = internals.storeName || document.title;
  let devTools = internals.reduxDevtools?.instance;
  if (devTools) { return; }

  // Register devtools extension
  const devtoolsOpts = { name: storeName };
  if (args?.traceActions) {
    Object.assign(devtoolsOpts, { trace: true, type: 'redux', traceLimit: 100 });
  }
  devTools = windowObj.__REDUX_DEVTOOLS_EXTENSION__.connect(devtoolsOpts);
  devTools.init(storeArg.state);
  internals.reduxDevtools = {
    instance: devTools,
    dispatcher: (action: any) => devTools!.send(action, storeArg.state),
    disableDispatch: false,
  };

  const setState = (state: any) => {
    internals.reduxDevtools!.disableDispatch = true;
    const selection = storeArg as any as Replace<any> & ReplaceAll<any> & Read<any>;
    selection[Array.isArray(selection.state) ? 'replaceAll' : 'replace'](state);
    internals.reduxDevtools!.disableDispatch = false;
  }

  // Ensure that the store responds to events emitted from the devtools extension
  devTools.subscribe((message: any) => {
    if (message.type === 'ACTION' && message.source === '@devtools-extension') {
      let messagePayload: { type: string, payload: any };
      try {
        messagePayload = messagePayload = JSON.parse(message.payload.replace(/"\s+|\s+"/g, '"'));
      } catch (e) {
        throw Error(errorMessages.DEVTOOL_DISPATCHED_INVALID_JSON);
      }
      if (!messagePayload.type.endsWith('()')) {
        throw new Error(errorMessages.DEVTOOL_DISPATCHED_WITH_NO_ACTION(messagePayload.type));
      }
      let pathSegments = messagePayload.type.split('.');
      const action = pathSegments.pop() as string;
      let selection: any = storeArg;
      pathSegments.forEach(seg => selection = selection[seg] as any);
      selection[action.substring(0, action.length - 2)](messagePayload.payload);
      libState.onInternalDispatch();
    }
    if (message.type === 'EXPORT') {
      const url = window.URL.createObjectURL(new Blob([JSON.stringify(storeArg.state)], { type: 'application/json' }));
      document.body.appendChild(Object.assign(document.createElement('a'), {
        style: { display: 'none' },
        href: url,
        download: `${storeArg.internals.storeName}.json`
      })).click();
      window.URL.revokeObjectURL(url);
    }
    if (message.type === 'DISPATCH' && message.payload) {
      switch (message.payload.type) {
        case 'JUMP_TO_STATE':
        case 'JUMP_TO_ACTION':
          setState(JSON.parse(message.state));
          libState.onInternalDispatch();
          return;
        case 'COMMIT':
          devTools!.init(storeArg.state);
          return;
        case 'ROLLBACK':
          const parsedState = JSON.parse(message.state);
          setState(parsedState);
          devTools!.init(parsedState);
          return;
        case 'IMPORT_STATE':
          setState(message.payload.nextLiftedState);
          libState.onInternalDispatch();
          return;
      }
    }
  });
}

// ref: https://medium.com/@zalmoxis/redux-devtools-without-redux-or-how-to-have-a-predictable-state-with-any-architecture-61c5f5a7716f
// ref: https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Methods.md#listen