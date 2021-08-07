export * from 'olik';

declare module 'olik' {
  interface StoreOrDerivation<C> {
    useState: () => C;
  }
}
