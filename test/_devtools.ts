import { EnhancerOptions, WindowAugmentedWithReduxDevtools } from "../src/shape";

export const windowAugmentedWithReduxDevtoolsImpl = {
  __REDUX_DEVTOOLS_EXTENSION__: new class {
    connect = (options: EnhancerOptions) => ({
      init: (state: any) => null,
      subscribe: (listener: (message: { type: string, payload: any, state?: any, source: any }) => any) => this._subscribers.push(listener),
      unsubscribe: () => null,
      send: () => null,
    });
    disconnect = () => null;
    send = (action: { type: string, payload?: any }, state: any, options: EnhancerOptions) => null;
    _subscribers = new Array<(message: { type: string, payload: any, state?: any, source: any }) => any>();
    _mockInvokeSubscription = (message:{ type: string, payload: any, state?: any, source: any }) => this._subscribers.forEach(s => s(message));
  }(),
} as WindowAugmentedWithReduxDevtools;
