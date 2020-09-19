import { ApplicationRef, NgModule } from '@angular/core';
import { from, Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

import { AvailableOps, Fetcher, listenToDevtoolsDispatch } from 'oulik';

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

export function fetch<S, C>(
  fetcher: Fetcher<S, C>,
) {
  return new Observable<{ value: C | null, error: any, loading: boolean }>((observer) => {
    const state = { value: null, loading: false, error: null } as { value: C | null, error: any, loading: boolean };
    observer.next(Object.assign(state, { loading: true, value: fetcher.store(fetcher.selector).read() }));
    const subscription = fetcher.store(fetcher.selector)
      .onChange(value => observer.next(Object.assign(state, { value })));
    fetcher.fetch()
      .then(value => observer.next(Object.assign(state, { loading: false, error: null, value })))
      .catch(error => observer.next(Object.assign(state, { loading: false, error })));
    return () => subscription.unsubscribe();
  }).pipe(
    shareReplay(1),
  );
}

export function resolve<C>(
  fetcher: {
    fetch: () => Promise<C>,
  },
) {
  return from(fetcher.fetch());
}

@NgModule({})
export class OulikNgModule {
  constructor(changeDetector: ApplicationRef) {
    listenToDevtoolsDispatch(() => changeDetector.tick());
  }
}
