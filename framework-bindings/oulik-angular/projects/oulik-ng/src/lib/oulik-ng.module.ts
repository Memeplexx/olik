import { NgModule, NgZone } from '@angular/core';
import { DeepReadonly, FetchState, listenToDevtoolsDispatch, Store, Trackability, Unsubscribable } from 'oulik';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export * from 'oulik';

/**
 * Allows you to observe a specific part of your store
 * ```
 * @Component({
 *   template: `
 *   <div *ngFor="let todo of todos$ | async">{{todo}}</div>
 * `,
 * })
 * export class MyComponent {
 *   todos$ = observe(get(s => s.todos));
 * }
 * ```
 */
export function observe<C, B extends Trackability>(
  store: Store<C, B>,
) {
  return new Observable<DeepReadonly<C>>((observer) => {
    observer.next(store.read());
    const subscription = store.onChange(v => observer.next(v));
    return () => subscription.unsubscribe();
  }).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}

/**
 * Wraps a Fetch inside an Observable which can be consumed by your component template
 * ```
 * export class MyComponent {
 *   constructor(
 *     private http: HttpClient,
 *   ){}
 *   // This part should probably be in another class, eg. ApiService
 *   fetchTodos = createFetcher({
 *     onStore: get(s => s.todos),
 *     getData: () => this.http.get<Todo>('https://www.example.com/todos'),
 *     cacheFor: 1000 * 60
 *   });
 *   // Here is the important bit
 *   todos$ = observeFetch(() => this.fetchTodos());
 * }
 * ```
 */
export function observeFetch<C, P, B extends Trackability>(
  getFetch: () => FetchState<C, P, B>,
) {
  const observable = new Observable<
    { isLoading: boolean, data: C | null, hasError: boolean, error?: any, storeData: DeepReadonly<C> | null }
  >(observer => {
    const fetchState = getFetch();
    result.currentState = fetchState;
    const emitCurrentState = () => {
      observer.next(({
        /**
         * Whether or not the fetch is currently resolving
         */
        isLoading: fetchState.status === 'resolving',
        /**
         * Whether or not the latest fetch was rejected
         */
        hasError: fetchState.status === 'rejected',
        /**
         * The current resolved data, if any.
         */
        data: fetchState.data,
        /**
         * The current rejection, if any.
         */
        error: fetchState.error,
        /**
         * The current store data associated with this fetcher
         */
        storeData: fetchState.store.read(),
      }));
      /**
       * Invalidates the cache and re-fetches
       */
      result.currentState = fetchState;
    };
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
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  const result = {
    observable,
    currentState: null as unknown as FetchState<C, P, B>,
  };
  return result;
}

/**
 * To be used inside a Resolver to fetch data via a Fetcher
 * ```
 * export class MyResolver implements Resolver<any> {
 *   constructor(
 *     private http: HttpClient,
 *   ){}
 *   // This part should probably be in another class, eg. ApiService
 *   fetchTodos = createFetcher({
 *     onStore: get(s => s.todos),
 *     getData: () => this.http.get<Todo>('https://www.example.com/todos'),
 *     cacheFor: 1000 * 60
 *   });
 *   // Here is the important bit
 *   resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
 *     return resolve(() => this.fetchTodos());
 *   }
 * }
 * ```
 */
export function resolve<C, P, B extends Trackability>(
  getFetch: () => FetchState<C, P, B>,
) {
  return new Observable<C>(observer => {
    const fetchState = getFetch();
    fetchState.onChangeOnce().then(() => {
      if (fetchState.status === 'resolved') {
        observer.next(fetchState.data);
        observer.complete();
      } else if (fetchState.status === 'rejected') {
        throw new Error(fetchState.error);
      }
    });
  });
}

@NgModule()
export class OulikNgModule {
  constructor(ngZone: NgZone) {
    listenToDevtoolsDispatch(() => ngZone.run(() => null));
  }
}
