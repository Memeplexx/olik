import { errorMessages } from './consts';
import { Store, EnhancerOptions, WindowAugmentedWithReduxDevtools } from './shape';
import { tests } from './tests';

// ref: https://medium.com/@zalmoxis/redux-devtools-without-redux-or-how-to-have-a-predictable-state-with-any-architecture-61c5f5a7716f
// ref: https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Methods.md#listen

export function integrateStoreWithReduxDevtools<S, C = S>(
  store: (selector?: (state: S) => C) => Store<S, C, any>,
  options: EnhancerOptions,
  setDevtoolsDispatchListener: (listener: (action: { type: string, payload?: any }) => any) => any
) {
  let windowObj = window as any as WindowAugmentedWithReduxDevtools;
  if (tests.windowObject) {
    windowObj = tests.windowObject as WindowAugmentedWithReduxDevtools;
  }
  if (!windowObj.__REDUX_DEVTOOLS_EXTENSION__) {
    const error = 'Cannot find Redux Devtools Extension';
    console.warn(error);
    tests.errorLogged = error;
    return;
  }
  const devTools = windowObj.__REDUX_DEVTOOLS_EXTENSION__.connect(options);
  devTools.init(store().read());
  setDevtoolsDispatchListener(action => {
    devTools.send(action, store().read());
  });
  devTools.subscribe(message => {
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
      const selection = store(s => {
        let result = s as any as C;
        segs.forEach(seg => result = result[seg as keyof typeof result] as any as C)
        return result as any as C;
      });
      (selection[action.substring(0, action.length - 2) as any as keyof typeof selection] as Function)(messagePayload.payload, message.source);
    }
    if (message.type === 'DISPATCH' && message.payload) {
      const selection = store() as any as (
        { replaceWith: (state: S, tag: string) => any } &
        { replaceAll: (state: S, tag: string) => any }
      ) & { read: () => any, readInitial: () => any };
      const setState = (state: any) => {
        if (!!selection.replaceAll) {
          selection.replaceAll(state, 'dontTrackWithDevtools');
        }
        else {
          selection.replaceWith(state, 'dontTrackWithDevtools');
        }
      }
      switch (message.payload.type) {
        case 'JUMP_TO_STATE':
        case 'JUMP_TO_ACTION':
          setState(JSON.parse(message.state));
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
  return devTools;
}

let onDispatchListener = () => null;
export function listenToDevtoolsDispatch(onDispatch: () => any) {
  onDispatchListener = onDispatch;
}
