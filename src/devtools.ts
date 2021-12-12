import { errorMessages, libState } from './constant';
import { Read, Readable } from './type';
import { StoreInternal, WindowAugmentedWithReduxDevtools } from './type-internal';
import { Replace, ReplaceAll } from './type';

export function integrateWithReduxDevtools<S>(
  arg: {
    store: Readable<S>,
    devtoolsOptions?: any,
  }
) {
  const store = arg.store as StoreInternal<S>;
  let windowObj = window as any as WindowAugmentedWithReduxDevtools;
  if (libState.windowObject) {
    windowObj = libState.windowObject as WindowAugmentedWithReduxDevtools;
  }

  // If user does not have devtools installed or enabled, warn & return.
  if (!windowObj.__REDUX_DEVTOOLS_EXTENSION__) {
    console.warn('Please install the Redux Devtools extension in your browser');
    return;
  }

  // If a devtools instance has already been registered, do not re-create that instance.
  // This problem really only presents its self when hot-reloading is being used
  const storeName = arg.devtoolsOptions?.name || store.getStoreName() || document.title;
  let devTools = libState.devtoolsRegistry[storeName];
  if (devTools) { return; }

  // Register devtools extension
  devTools = windowObj.__REDUX_DEVTOOLS_EXTENSION__.connect(arg.devtoolsOptions);
  devTools.init(store.read());
  libState.devtoolsRegistry[storeName] = devTools;

  // Ensure that the store responds to events emitted from the devtools extension
  libState.devtoolsDispatchListener = action => devTools.send(action, store.read());
  devTools.subscribe((message: any) => {
    if (message.type === 'ACTION' && message.source === '@devtools-extension') {
      let messagePayload: { type: string, payload: any };
      try {
        messagePayload = JSON.parse(message.payload);
      } catch (e) {
        throw Error(errorMessages.DEVTOOL_DISPATCHED_INVALID_JSON);
      }
      if (!messagePayload.type.endsWith('()')) {
        throw new Error(errorMessages.DEVTOOL_DISPATCHED_WITH_NO_ACTION(messagePayload.type));
      }
      let pathSegments = messagePayload.type.split('.');
      const action = pathSegments.pop() as string;
      let selection: any = store;
      pathSegments.forEach(seg => selection = selection[seg] as any);
      selection[action.substring(0, action.length - 2)](messagePayload.payload);
    }
    if (message.type === 'DISPATCH' && message.payload) {
      const selection = store as any as Replace<any> & ReplaceAll<any> & Read<any>;
      const setState = (state: any) => {
        libState.dispatchToDevtools = false;
        selection[Array.isArray(selection.read()) ? 'replaceAll' : 'replace'](state);
        libState.dispatchToDevtools = true;
      }
      switch (message.payload.type) {
        case 'JUMP_TO_STATE':
        case 'JUMP_TO_ACTION':
          setState(JSON.parse(message.state));
          libState.onDispatchListener();
          return;
        case 'COMMIT':
          devTools.init(selection.read());
          return;
        case 'ROLLBACK':
          const parsedState = JSON.parse(message.state);
          setState(parsedState);
          devTools.init(parsedState);
          return;
      }
    }
  });
}

export const listenToDevtoolsDispatch = (onDispatch: () => any) => libState.onDispatchListener = onDispatch;

// ref: https://medium.com/@zalmoxis/redux-devtools-without-redux-or-how-to-have-a-predictable-state-with-any-architecture-61c5f5a7716f
// ref: https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Methods.md#listen