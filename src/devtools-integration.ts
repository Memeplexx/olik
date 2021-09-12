import { Store } from './shapes-external';
import { StoreState, WindowAugmentedWithReduxDevtools } from './shapes-internal';
import { errorMessages } from './shared-consts';
import { libState, testState } from './shared-state';

export function integrateStoreWithReduxDevtools<S, C = S>(
  arg: {
    store: (selector?: (state: S) => C) => Store<C, any>,
    storeState: StoreState<S>,
    devtools?: any,
  },
) {
  let windowObj = window as any as WindowAugmentedWithReduxDevtools;
  if (testState.windowObject) {
    windowObj = testState.windowObject as WindowAugmentedWithReduxDevtools;
  }

  // If user does not have devtools installed or enabled, do nothing.
  if (!windowObj.__REDUX_DEVTOOLS_EXTENSION__) {
    return;
  }

  // If a devtools instance has already been registered, do not re-create that instance.
  // This problem really only presents its self when saving code in codesandbox (probably due to hot-reloading)
  const storeName = arg.devtools?.name || document.title;
  let devTools = libState.devtoolsRegistry[storeName];
  if (devTools) {
    return;
  }

  // Register devtools extension
  devTools = windowObj.__REDUX_DEVTOOLS_EXTENSION__.connect(arg.devtools);
  devTools.init(arg.store().read());
  libState.devtoolsRegistry[storeName] = devTools;

  // Ensure that the store responds to events emitted from the devtools extension
  arg.storeState.devtoolsDispatchListener = action => {
    devTools.send(action, arg.store().read());
  };
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
      let segs = messagePayload.type.split('.');
      const action = segs.pop() as string;
      arg.storeState.bypassSelectorFunctionCheck = true;
      const selection = arg.store(s => {
        let result = s as any as C;
        segs.forEach(seg => result = result[seg as keyof typeof result] as any as C)
        return result as any as C;
      });
      (selection[action.substring(0, action.length - 2) as any as keyof typeof selection] as Function)(messagePayload.payload, message.source);
      arg.storeState.bypassSelectorFunctionCheck = false;
    }
    if (message.type === 'DISPATCH' && message.payload) {
      const selection = arg.store() as any as (
        { replace: (state: S, options: { tag: string }) => any } &
        { replaceAll: (state: S, options: { tag: string }) => any }
      ) & { read: () => any, readInitial: () => any };
      const setState = (state: any) => {
        if (Array.isArray(selection.read())) {
          selection.replaceAll(state, { tag: 'dontTrackWithDevtools' });
        } else {
          selection.replace(state, { tag: 'dontTrackWithDevtools' });
        }
      }
      switch (message.payload.type) {
        case 'JUMP_TO_STATE':
        case 'JUMP_TO_ACTION':
          setState(JSON.parse(message.state));
          onDispatchListener();
          return;
        case 'COMMIT':
          devTools.init(selection.read());
          return;
        case 'RESET':
          const initialState = selection.readInitial();
          devTools.init(initialState);
          setState(initialState);
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

let onDispatchListener = () => null;
export function listenToDevtoolsDispatch(onDispatch: () => any) {
  onDispatchListener = onDispatch;
}

// ref: https://medium.com/@zalmoxis/redux-devtools-without-redux-or-how-to-have-a-predictable-state-with-any-architecture-61c5f5a7716f
// ref: https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Methods.md#listen
