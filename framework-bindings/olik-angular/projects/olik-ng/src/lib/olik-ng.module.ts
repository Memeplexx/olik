import { NgModule, NgZone } from '@angular/core';
import {
  listenToDevtoolsDispatch,
  OptionsForMakingANestedStore,
  SelectorFromAStore,
  set as libSet,
  setEnforceTags as libSetEnforceTags,
  setNested as libSetNested,
} from 'olik';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export * from 'olik';

function observeFetchInternal<C>(
  fetchFn: () => Observable<C>,
) {
  return new Observable<
    { isLoading: boolean, resolved: C | null, hasError: boolean, rejected: any | null, refetch: (fetcher: () => Observable<C>) => void }
  >(observer => {
    const refetch = (fetcher: () => Observable<C>) => {
      observer.next({ resolved: null, hasError: false, isLoading: true, rejected: null, refetch: () => null as any });
      fetcher().toPromise()
        .then(resolved => observer.next({ resolved, hasError: false, isLoading: false, rejected: null, refetch }))
        .catch(rejected => observer.next({ resolved: null, hasError: true, isLoading: false, rejected, refetch }));
    };
    observer.next({ resolved: null, hasError: false, isLoading: true, rejected: null, refetch });
    refetch(fetchFn);
  }).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}

type MyType<X> = X extends (...args: any[]) => infer R ? R : never;
const observeInternal = <S>(
  get: SelectorFromAStore<S>,
) => <L extends Parameters<typeof get>[0], C extends MyType<L>>(
  selector: L,
  ) => new Observable<C>(observer => {
    observer.next(get(selector).read() as C);
    const subscription = get(selector).onChange(v => observer.next(v as C));
    return () => subscription.unsubscribe();
  }).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

export const set = <S>(initialState: S) => {
  const get = libSet(initialState);
  return {
    get,
    /**
     * Converts the state you select into an observable.
     */
    observe: <L extends Parameters<typeof get>[0]>(selector: L) => observeInternal(get)(selector),
    /**
     * Takes a function returning an Observable, and returns a new Observable which reports the status of the first observable.
     */
    observeFetch: observeFetchInternal,
  };
}

export const setEnforceTags = <S>(initialState: S) => {
  const get = libSetEnforceTags(initialState);
  return {
    get,
    /**
     * Converts the state you select into an observable
     */
    observe: <L extends Parameters<typeof get>[0]>(selector: L) => observeInternal(get as SelectorFromAStore<S>)(selector),
    /**
     * Takes a function returning an Observable, and returns a new Observable which reports the status of the first observable.
     */
    observeFetch: observeFetchInternal,
  };
}

export const setNested = <S>(initialState: S, options: OptionsForMakingANestedStore) => {
  const get = libSetNested(initialState, options);
  return {
    get,
    /**
     * Converts the state you select into an observable
     */
    observe: <L extends Parameters<typeof get>[0]>(selector: L) => observeInternal(get)(selector),
    /**
     * Takes a function returning an Observable, and returns a new Observable which reports the status of the first observable.
     */
    observeFetch: observeFetchInternal,
  };
}

@NgModule()
export class OlikNgModule {
  constructor(ngZone: NgZone) {
    listenToDevtoolsDispatch(() => ngZone.run(() => null));
  }
}
