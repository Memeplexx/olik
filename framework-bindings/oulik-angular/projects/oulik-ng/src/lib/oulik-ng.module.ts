import { NgModule, NgZone } from '@angular/core';
import { FetchState, listenToDevtoolsDispatch, Store, Unsubscribable } from 'oulik';
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
export function observe<C, B extends boolean>(
  store: Store<C, B>,
) {
  return new Observable<C>((observer) => {
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
 *     cacheFor: 10
 *   });
 *   // Here is the important bit
 *   todos$ = observeFetch(() => this.fetchTodos());
 * }
 * ```
 */
export function observeFetch<S, C, P, B extends boolean>(
  getFetch: () => FetchState<S, C, P, B>,
) {
  return new Observable<
    { isLoading: boolean, data: C | null, hasError: boolean, error?: any, storeData: C | null, refetch: ReturnType<typeof getFetch>['refetch'] }
  >(observer => {
    const fetchState = getFetch();
    const emitCurrentState = () => observer.next(({
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
      /**
       * Invalidates the cache and re-fetches
       */
      refetch: fetchState.refetch,
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
    shareReplay({ bufferSize: 1, refCount: true }),
  );
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
 *     cacheFor: 10
 *   });
 *   // Here is the important bit
 *   resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
 *     return resolve(() => this.fetchTodos());
 *   }
 * }
 * ```
 */
export function resolve<S, C, P, B extends boolean>(
  getFetch: () => FetchState<S, C, P, B>,
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
