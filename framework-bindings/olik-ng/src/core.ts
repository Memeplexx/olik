import { Observable } from 'rxjs';

export * from 'olik';

declare module 'olik' {
  interface StoreOrDerivation<C> {
    observe: () => Observable<C>;
  }
}
