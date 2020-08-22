import { AvailableOps } from "./shape";

export interface EnhancerOptions {
  name?: string;
  maxAge?: number;
}

// ref: https://medium.com/@zalmoxis/redux-devtools-without-redux-or-how-to-have-a-predictable-state-with-any-architecture-61c5f5a7716f
// ref: https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Methods.md#listen
interface WindowAugmented {
  connect: (options: EnhancerOptions) => any;
  disconnect: () => any;
  send: (action: { type: string, payload?: any }, state: any, options: EnhancerOptions) => any;
}

const windowObj = window as any as { __REDUX_DEVTOOLS_EXTENSION__: WindowAugmented };

export function integrateStoreWithReduxDevtools<S>(store: {
  read: () => S,
  select: () => AvailableOps<S, S>,
}, options: { name: string, maxAge?: number }) {
  if (!windowObj.__REDUX_DEVTOOLS_EXTENSION__) {
    console.error('Cannot find Redux Devtools Extension');
    return;
  }
  const devTools = windowObj.__REDUX_DEVTOOLS_EXTENSION__.connect(options);
  devTools.init(store.read());
  const storeTyped = store as (typeof store & { xtras: { setDevtoolsDispatchListener: (listener: (action: { type: string, payload?: any }) => any) => any } });
  storeTyped.xtras.setDevtoolsDispatchListener(action => {
    windowObj.__REDUX_DEVTOOLS_EXTENSION__.send(action, store.read(), {  });
  });
  devTools.subscribe((message: { type: string, state: any }) => {
    if (message.type === 'DISPATCH' && message.state) {
      const selection = store.select() as any as (
        { replace: (state: S, options: { dontTrackWithDevtools: boolean }) => any } & 
        { replaceAll: (state: S, options: { dontTrackWithDevtools: boolean }) => any }
      );
      if (!!selection.replaceAll) {
        selection.replaceAll(JSON.parse(message.state), { dontTrackWithDevtools: true });
      } else {
        selection.replace(JSON.parse(message.state), { dontTrackWithDevtools: true });
      }
    }
  });
}

let onDispatchListener: () => any;
export function listenToDevtoolsDispatch(onDispatch: () => any) {
  onDispatchListener = onDispatch;
}
