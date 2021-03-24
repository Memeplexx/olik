import { NgModule, NgZone } from '@angular/core';
import {
  listenToDevtoolsDispatch,
  OptionsForMakingANestedStore,
  OptionsForMakingAStore,
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
    // observer.next({ resolved: null, hasError: false, isLoading: true, rejected: null, refetch });
    refetch(fetchFn);
  }).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}

type FnReturnType<X> = X extends (...args: any[]) => infer R ? R : never;
const observeInternal = <S>(
  select: SelectorFromAStore<S>,
) => <L extends Parameters<typeof select>[0], C extends FnReturnType<L>>(
  selector: L,
  ) => new Observable<C>(observer => {
    // observer.next(select(selector).read() as C);
    const subscription = select(selector).onChange(v => observer.next(v as C));
    return () => subscription.unsubscribe();
  }).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

export const set = <S>(initialState: S, options?: OptionsForMakingAStore) => {
  const select = libSet(initialState, options);
  return {
    select,
    /**
     * Converts the state you select into an observable.
     */
    observe: <L extends Parameters<typeof select>[0]>(selector: L) => observeInternal(select)(selector),
    /**
     * Takes a function returning an Observable, and returns a new Observable which reports the status of the first observable.
     */
    observeFetch: observeFetchInternal,
  };
}

export const setEnforceTags = <S>(initialState: S, options?: OptionsForMakingAStore) => {
  const select = libSetEnforceTags(initialState, options);
  return {
    select,
    /**
     * Converts the state you select into an observable
     */
    observe: <L extends Parameters<typeof select>[0]>(selector: L) => observeInternal(select as SelectorFromAStore<S>)(selector),
    /**
     * Takes a function returning an Observable, and returns a new Observable which reports the status of the first observable.
     */
    observeFetch: observeFetchInternal,
  };
}

export const setNested = <S>(initialState: S, options: OptionsForMakingANestedStore) => {
  const select = libSetNested(initialState, options);
  return {
    select,
    /**
     * Converts the state you select into an observable
     */
    observe: <L extends Parameters<typeof select>[0]>(selector: L) => observeInternal(select)(selector),
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
