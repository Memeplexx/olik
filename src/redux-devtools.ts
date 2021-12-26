import { errorMessages, libState, testState } from './constant';
import { Read, ReduxDevtoolsOptions, Replace, ReplaceAll } from './type';
import { StoreInternal, WindowAugmentedWithReduxDevtools } from './type-internal';

export function trackWithReduxDevtools<S>(
  { store, traceActions, limitSearchArgLength }: ReduxDevtoolsOptions,
) {
  // const store = args.store as StoreInternal<S>;
  const internals = (store as StoreInternal<S>).internals;

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
  let devTools = internals.reduxDevtools?.instance;
  if (devTools) { return; }

  // Register devtools extension
  const devtoolsOpts = { name: name || document.title };
  if (traceActions) {
    Object.assign(devtoolsOpts, { trace: true, type: 'redux', traceLimit: 100 });
  }
  devTools = windowObj.__REDUX_DEVTOOLS_EXTENSION__.connect(devtoolsOpts);
  devTools.init(store.state);
  internals.reduxDevtools = {
    instance: devTools,
    dispatcher: (action: any) => {
      const newAction = {
        ...action,
        type: (action.type as string)
          .replace(/\((.+?)\)/g, (substring, args) => `(${args.toString().substring(0, limitSearchArgLength || 6)})`),
      };
      testState.currentActionForReduxDevtools = newAction;
      devTools!.send(newAction, store.state);
    },
    disableDispatch: false,
  };

  const setState = (state: any) => {
    internals.reduxDevtools!.disableDispatch = true;
    const selection = store as any as Replace<any> & ReplaceAll<any> & Read<any>;
    selection[Array.isArray(selection.state) ? 'replaceAll' : 'replace'](state);
    internals.reduxDevtools!.disableDispatch = false;
  }

  // Ensure that the store responds to events emitted from the devtools extension
  devTools.subscribe(message => {
    if ('ACTION' === message.type) {
      let messagePayload: { type: string, payload: any };
      try {
        messagePayload = JSON.parse(message.payload.replace(/"\s+|\s+"/g, '"'));
      } catch (e) {
        throw Error(errorMessages.DEVTOOL_DISPATCHED_INVALID_JSON);
      }
      let pathSegments = messagePayload.type.split('.');
      const action = pathSegments.pop() as string;
      let selection: any = store;
      pathSegments.forEach(seg => selection = selection[seg] as any);
      selection[action.substring(0, action.length - 2)](messagePayload.payload);
      libState.onInternalDispatch();
    } else if ('EXPORT' === message.type) {
      const url = window.URL.createObjectURL(new Blob([JSON.stringify(store.state)], { type: 'application/json' }));
      document.body.appendChild(Object.assign(document.createElement('a'), {
        style: { display: 'none' },
        href: url,
        download: `${internals.storeName}.json`
      })).click();
      window.URL.revokeObjectURL(url);
    } else if ('DISPATCH' === message.type && message.payload) {
      if (['JUMP_TO_STATE', 'JUMP_TO_ACTION'].includes(message.payload.type)) {
        setState(JSON.parse(message.state));
        libState.onInternalDispatch();
      } else if ('COMMIT' === message.payload.type) {
        devTools!.init(store.state);
      } else if ('ROLLBACK' === message.payload.type) {
        const parsedState = JSON.parse(message.state);
        setState(parsedState);
        devTools!.init(parsedState);
      } else if ('IMPORT_STATE' === message.payload.type) {
        setState(message.payload.nextLiftedState);
        libState.onInternalDispatch();
      }
    }
  });
}

// ref: https://medium.com/@zalmoxis/redux-devtools-without-redux-or-how-to-have-a-predictable-state-with-any-architecture-61c5f5a7716f
// ref: https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Methods.md#listen