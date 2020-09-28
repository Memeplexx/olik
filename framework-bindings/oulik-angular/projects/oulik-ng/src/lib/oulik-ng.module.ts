import { NgModule, NgZone } from '@angular/core';
import { AvailableOps, Fetcher, listenToDevtoolsDispatch, status, Tag } from 'oulik';
import { from, Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

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
  return new Observable<{ value: C | null, status: status }>((observer) => {
    const emitCurrentState = () => observer.next(({
      status: fetcher.status,
      value: fetcher.status === 'error' ? fetcher.error : fetcher.read()
    }));
    emitCurrentState();
    const subscription = fetcher.onStatusChange(() => emitCurrentState());
    fetcher.fetch(tag);
    return () => subscription.unsubscribe();
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
