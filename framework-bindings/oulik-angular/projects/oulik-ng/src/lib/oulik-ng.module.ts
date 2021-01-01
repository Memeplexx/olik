import { NgModule, NgZone } from '@angular/core';
import { DeepReadonly, listenToDevtoolsDispatch, Store, Trackability } from 'oulik';
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
 * Allows you to display the current status of a fetch (success / error / failure)
 * ```
 * @Component({
 *   template: `
 *   <ng-container *ngIf="fetch$ | async; let fetch;">
 *     <div *ngIf="fetch.loading">Loading...</div>
 *     <div *ngIf="fetch.hasError">{{fetch.error}}</div>
 *   </ng-container>
 *   <div *ngFor="let todo of todos$ | async">{{todo}}</div>
 *   <button (click)="onClickRefreshTodos()">Click to get latest todos from API</button>
 * `,
 * })
 * export class MyComponent {
 *   fetch$ = observeFetch(() => this.apiService.fetchTodos()) 
 *   todos$ = observe(get(s => s.todos));
 *   onClickRefreshTodos() {
 *     this.fetch$.pipe(take(1)).subscribe(r => r.refetch());
 *   }
 * }
 * ```
 */
export function observeFetch<C>(fetchFn: () => Observable<C>) {
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

@NgModule()
export class OulikNgModule {
  constructor(ngZone: NgZone) {
    listenToDevtoolsDispatch(() => ngZone.run(() => null));
  }
}
