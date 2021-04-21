import { errorMessages } from './shared-consts';
import { Store, OptionsForReduxDevtools } from './shapes-external';
import { WindowAugmentedWithReduxDevtools } from './shapes-internal';
import { libState } from './shared-state';

export function integrateStoreWithReduxDevtools<S, C = S>(
  store: (selector?: (state: S) => C) => Store<C, any>,
  options: OptionsForReduxDevtools,
  setDevtoolsDispatchListener: (listener: (action: { type: string, payload?: any }) => any) => any
) {
  let windowObj = window as any as WindowAugmentedWithReduxDevtools;
  if (libState.windowObject) {
    windowObj = libState.windowObject as WindowAugmentedWithReduxDevtools;
  }
  if (!windowObj.__REDUX_DEVTOOLS_EXTENSION__) {
    console.warn(errorMessages.DEVTOOL_CANNOT_FIND_EXTENSION);
    return;
  }
  const devTools = windowObj.__REDUX_DEVTOOLS_EXTENSION__.connect(options);
  devTools.init(store().read());
  setDevtoolsDispatchListener(action => {
    devTools.send(action, store().read());
  });
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
      libState.bypassSelectorFunctionCheck = true;
      const selection = store(s => {
        let result = s as any as C;
        segs.forEach(seg => result = result[seg as keyof typeof result] as any as C)
        return result as any as C;
      });
      (selection[action.substring(0, action.length - 2) as any as keyof typeof selection] as Function)(messagePayload.payload, message.source);
      libState.bypassSelectorFunctionCheck = false;
    }
    if (message.type === 'DISPATCH' && message.payload) {
      const selection = store() as any as (
        { replace: (state: S, options: { tag: string }) => any } &
        { replaceAll: (state: S, options: { tag: string }) => any }
      ) & { read: () => any, readInitial: () => any };
      const setState = (state: any) => {
        libState.bypassSelectorFunctionCheck = true;
        if (Array.isArray(selection.read())) {
          selection.replaceAll(state, { tag: 'dontTrackWithDevtools' });
        } else {
          selection.replace(state, { tag: 'dontTrackWithDevtools' });
        }
        libState.bypassSelectorFunctionCheck = false;
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
  libState.devTools = devTools;
  return devTools;
}

let onDispatchListener = () => null;
export function listenToDevtoolsDispatch(onDispatch: () => any) {
  onDispatchListener = onDispatch;
}

// ref: https://medium.com/@zalmoxis/redux-devtools-without-redux-or-how-to-have-a-predictable-state-with-any-architecture-61c5f5a7716f
// ref: https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Methods.md#listen
