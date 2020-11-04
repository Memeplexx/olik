import { NgModule, NgZone } from '@angular/core';
import { Fetch, listenToDevtoolsDispatch, Store, Unsubscribable } from 'oulik';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export * from 'oulik';

export function select<S, C>(
  store: Store<S, C, boolean>,
) {
  return new Observable<C>((observer) => {
    observer.next(store.read());
    const subscription = store.onChange(v => observer.next(v));
    return () => subscription.unsubscribe();
  }).pipe(
    shareReplay(1),
  );
}

export function fetch<S, C, P>(
  getFetch: () => Fetch<S, C, P>,
) {
  return new Observable<
    { isLoading: boolean, data: C | null, hasError: boolean, error?: any, storeData: C | null }
  >(observer => {
    const fetchState = getFetch();
    const emitCurrentState = () => observer.next(({
      isLoading: fetchState.status === 'resolving',
      hasError: fetchState.status === 'rejected',
      data: fetchState.data,
      error: fetchState.error,
      storeData: fetchState.store.read(),
    }));
    emitCurrentState();
    let storeChangeSubscription: Unsubscribable | undefined;
    const fetchChangeSubscription = fetchState.onChange(() => {
      emitCurrentState();
      storeChangeSubscription = fetchState.store.onChange(() => emitCurrentState());
    });
    return () => {
      fetchChangeSubscription.unsubscribe();
      if (storeChangeSubscription) {
        storeChangeSubscription.unsubscribe();
      }
    };
  }).pipe(
    shareReplay(1),
  );
}

export function resolve<S, C, P>(
  getFetch: () => Fetch<S, C, P>,
) {
  return new Observable<C>(observer => {
    const fetchState = getFetch();
    const changeSubscription = fetchState.onChange(() => {
      if (fetchState.status === 'resolved') {
        observer.next(fetchState.data);
        observer.complete();
      } else if (fetchState.status === 'rejected') {
        throw new Error(fetchState.error);
      }
    });
    return () => {
      changeSubscription.unsubscribe();
    };
  });
}

@NgModule()
export class OulikNgModule {
  constructor(ngZone: NgZone) {
    listenToDevtoolsDispatch(() => ngZone.run(() => null));
  }
}
