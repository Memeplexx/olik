import { AvailableOps } from "./shape";

export interface EnhancerOptions {
  name?: string;
  maxAge?: number;
  actionsBlacklist?: string[],
}

// ref: https://medium.com/@zalmoxis/redux-devtools-without-redux-or-how-to-have-a-predictable-state-with-any-architecture-61c5f5a7716f
// ref: https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Methods.md#listen
interface WindowAugmented {
  connect: (options: EnhancerOptions) => any;
  disconnect: () => any;
  send: (action: { type: string, payload?: any }, state: any, options: EnhancerOptions) => any;
}

let windowObj = window as any as { __REDUX_DEVTOOLS_EXTENSION__: WindowAugmented };

export function integrateStoreWithReduxDevtools<S>(
  store: () => AvailableOps<S, S>,
  options: { name: string, maxAge?: number },
  setDevtoolsDispatchListener: (listener: (action: { type: string, payload?: any }) => any) => any
) {
  if (process.env.NODE_ENV === 'test') {
    // return;
    windowObj = { __REDUX_DEVTOOLS_EXTENSION__: { connect: () => ({ init: () => null, subscribe: () => null, send: () => null }), disconnect: () => null, send: () => null } as WindowAugmented }
  }
  if (!windowObj.__REDUX_DEVTOOLS_EXTENSION__) {
    console.error('Cannot find Redux Devtools Extension');
    return;
  }
  const devTools = windowObj.__REDUX_DEVTOOLS_EXTENSION__.connect(options);
  devTools.init(store().read());
  setDevtoolsDispatchListener(action => {
    devTools.send(action, store().read(), {});
  });
  devTools.subscribe((message: { type: string, state: any }) => {
    if (message.type === 'DISPATCH' && message.state) {
      const selection = store() as any as (
        { replace: (state: S, options: { dontTrackWithDevtools: boolean }) => any } &
        { replaceAll: (state: S, options: { dontTrackWithDevtools: boolean }) => any }
      );
      if (!!selection.replaceAll) {
        selection.replaceAll(JSON.parse(message.state), { dontTrackWithDevtools: true });
      } else {
        selection.replace(JSON.parse(message.state), { dontTrackWithDevtools: true });
      }

      onDispatchListener();
    }
  });
}

let onDispatchListener = () => null;
export function listenToDevtoolsDispatch(onDispatch: () => any) {
  onDispatchListener = onDispatch;
}
