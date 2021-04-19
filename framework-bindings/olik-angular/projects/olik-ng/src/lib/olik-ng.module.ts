import { NgModule, NgZone } from '@angular/core';
import {
  listenToDevtoolsDispatch,
  OptionsForMakingANestedStore,
  OptionsForMakingAStore,
  SelectorFromAStore,
  store as libSet,
  storeEnforcingTags as libSetEnforceTags,
  nestedStore as libSetNested,
} from 'olik';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export * from 'olik';

type FetchPayload<C> = {
  isLoading: boolean,
  wasRejected: boolean,
  wasResolved: boolean,
  error: any,
  fetch: () => void,
  storeValue: C,
};

function observeFetchInternal<C>(
  fetchFn: () => Observable<C>,
) {
  return new Observable<FetchPayload<C>>(observer => {
    const fetch = () => {
      observer.next({
        wasRejected: latestValue.wasRejected,
        isLoading: true,
        error: latestValue.error,
        wasResolved: latestValue.wasResolved,
        fetch,
        storeValue: latestValue.storeValue,
      });
      fetchFn().toPromise()
        .then(storeValue => {
          observer.next({
            wasRejected: false,
            isLoading: false,
            error: null,
            wasResolved: true,
            fetch,
            storeValue,
          });
        })
        .catch(error => observer.next({
          wasRejected: true,
          isLoading: false,
          error,
          wasResolved: false,
          fetch,
          storeValue: latestValue.storeValue,
        }));
    };
    let latestValue = {
      wasRejected: false,
      isLoading: true,
      error: null,
      wasResolved: false,
      fetch,
      storeValue: null as any as C,
    } as FetchPayload<C>;
    fetch();
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
    observe: <L extends Parameters<typeof select>[0]>(selector: L) => observeInternal(select as any)(selector as any),
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
    observe: <L extends Parameters<typeof select>[0]>(selector: L) => observeInternal(select as any)(selector as any),
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
