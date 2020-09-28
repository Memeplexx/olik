import { NgModule, NgZone } from '@angular/core';
import { AvailableOps, Fetcher, listenToDevtoolsDispatch, status, Tag, Unsubscribable } from 'oulik';
import { from, Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export * from 'oulik';

export function select<S, C>(
  store: AvailableOps<S, C, boolean>,
) {
  return new Observable<C>((observer) => {
    observer.next(store.read());
    const subscription = store.onChange(v => observer.next(v));
    return () => subscription.unsubscribe();
  }).pipe(
    shareReplay(1),
  );
}

export function fetch<S, C, B extends boolean>(
  fetcher: Fetcher<S, C, B>,
  tag: Tag<B>,
) {
  return new Observable<
    { isLoading: boolean, data: C | null, hasError: boolean, error?: any, wasUpdatedAfterError: boolean }
  >((observer) => {
    const emitCurrentState = () => observer.next(({
      isLoading: fetcher.status === 'resolving',
      hasError: fetcher.status === 'error',
      wasUpdatedAfterError: fetcher.status === 'updatedAfterError',
      data: fetcher.store.read(),
      error: fetcher.error,
    }));
    emitCurrentState();
    let onChangeSubscription: Unsubscribable;
    const statusChangeSubscription = fetcher.onStatusChange(() => {
      emitCurrentState();
      onChangeSubscription = fetcher.store.onChange(() => emitCurrentState());
    });
    fetcher.fetch(tag);
    return () => {
      statusChangeSubscription.unsubscribe();
      if (onChangeSubscription) {
        onChangeSubscription.unsubscribe();
      }
    };
  }).pipe(
    shareReplay(1),
  );
}

export function resolve<S, C, B extends boolean>(
  fetcher: Fetcher<S, C, B>,
  tag: Tag<B>,
) {
  return from(fetcher.fetch(tag));
}

@NgModule()
export class OulikNgModule {
  constructor(ngZone: NgZone) {
    listenToDevtoolsDispatch(() => ngZone.run(() => null));
  }
}
