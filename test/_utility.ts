import { StoreInternal } from "../src/type-internal";
import { WindowAugmentedWithReduxDevtools } from "../src/type-internal";

export const windowAugmentedWithReduxDevtoolsImpl = {
  __REDUX_DEVTOOLS_EXTENSION__: new class {
    connect = (options: { name: string }) => ({
      init: (state: any) => null,
      subscribe: (listener: (message: { type: string, payload: any, state?: any, source: any }) => any) => this._subscribers.push(listener),
      send: () => null,
    });
    disconnect = () => null;
    send = (action: { type: string, payload?: any }, state: any, options: { name: string }) => null;
    _subscribers = new Array<(message: { type: string, payload: any, state?: any, source: any }) => any>();
    _mockInvokeSubscription = (message: { type: string, payload: any, state?: any, source: any }) => this._subscribers.forEach(s => s(message));
  }(),
} as unknown as WindowAugmentedWithReduxDevtools;

export const currentAction = <S>(store: any) => (store as StoreInternal<S>).$internals.currentAction;