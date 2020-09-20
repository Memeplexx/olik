import { NgModule, NgZone } from '@angular/core';
import { AvailableOps, Fetcher, listenToDevtoolsDispatch, Tag } from 'oulik';
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
  return new Observable<{ value: C | null, error: any, loading: boolean }>((observer) => {
    const state = { value: null, loading: false, error: null } as { value: C | null, error: any, loading: boolean };
    observer.next(Object.assign(state, { loading: true, value: fetcher.store(fetcher.selector).read() }));
    const subscription = fetcher.store(fetcher.selector)
      .onChange(value => observer.next(Object.assign(state, { value })));
    fetcher.fetch(tag)
      .then(value => observer.next(Object.assign(state, { loading: false, error: null, value })))
      .catch(error => observer.next(Object.assign(state, { loading: false, error })));
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
