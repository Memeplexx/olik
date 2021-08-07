/* eslint-disable react-hooks/rules-of-hooks */
import * as core from 'olik';
import { FutureState } from 'olik';

export * from 'olik';

declare module 'olik' {
  interface StoreOrDerivation<C> {
    useState: (deps?: React.DependencyList) => C;
  }
  interface Derivation<R> {
    useState: (deps?: React.DependencyList) => R;
  }
  interface Future<C> {
    useAsync: (deps?: React.DependencyList) => FutureState<C>;
  }
}

export const init = () => {
}

