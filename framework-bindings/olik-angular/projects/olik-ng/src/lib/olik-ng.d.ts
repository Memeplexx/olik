import * as core from "olik";
import { Observable } from "rxjs";

declare module 'olik' {
  interface StoreOrDerivation<C> {
    observe: () => Observable<C>;
  }
  interface ArrayOfElementsCommonAction<X extends core.DeepReadonlyArray<any>, F extends core.FindOrFilter, T extends core.Trackability> {
    observe: () => Observable<F extends 'find' ? X[0] : X>;
  }
  interface Future<C> {
    observeStatus: () => Observable<core.FutureState<C>>;
    asObservable: () => Observable<C>;
  }
  interface Async<C> extends Observable<C> {
  }
  interface Derivation<R> {
    observe: () => Observable<R>;
  }
}