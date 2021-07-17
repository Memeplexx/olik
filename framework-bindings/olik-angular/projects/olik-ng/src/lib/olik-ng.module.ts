import { NgModule, NgZone } from '@angular/core';
import * as core from 'olik';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type FetchPayload<C> = {
  isLoading: boolean,
  wasRejected: boolean,
  wasResolved: boolean,
  error: any,
  storeValue: C,
};

const observeFetchInternal = <S, C>(
  select: core.SelectorFromAStore<S>
) => (
  operation: () => Promise<C>
) => new Observable<FetchPayload<C>>(observer => {
  const initialValue = {
    wasRejected: false,
    isLoading: true,
    error: null,
    wasResolved: false,
    storeValue: core.getSelectedStateFromOperationWithoutUpdatingStore(select, operation),
  };
  observer.next(initialValue);
  operation()
    .then(storeValue => observer.next({
      wasRejected: false,
      isLoading: false,
      error: null,
      wasResolved: true,
      storeValue,
    }))
    .catch(error => observer.next({
      wasRejected: true,
      isLoading: false,
      error,
      wasResolved: false,
      storeValue: initialValue.storeValue,
    }))
})

type FnReturnType<X> = X extends (...args: any[]) => infer R ? R : never;
const observeInternal = <S>(
  select: core.SelectorFromAStore<S>
) => <L extends (arg: core.DeepReadonly<S>) => any, C extends FnReturnType<L>>(
  selector: L
) => new Observable<C>(observer => {
  observer.next(select(selector).read() as C);
  const subscription = select(selector).onChange(v => observer.next(v as C));
  return () => subscription.unsubscribe();
});

const combinedObserversInternal = <S>(select: core.SelectorFromAStore<S>) => <T extends { [key: string]: (state: core.DeepReadonly<S>) => any }>(arg: T) => {
  const obj = {} as { [key in keyof T]: Observable<ReturnType<T[key]>>; };
  (Object.keys(arg) as (keyof T)[]).forEach(key => obj[key] = observeInternal(select)(arg[key]))
  return combineObserversAcrossStores(obj);
}

// export const createGlobalStore = <S>(initialState: S, options?: core.OptionsForMakingAGlobalStore) => {
//   const store = core.createGlobalStore(initialState, options);
//   return Object.assign(new class {
//     /**
//      * Converts the state you select into an observable.
//      * @example
//      * todos$ = observe(s => s.todos);
//      * 
//      * <div *ngFor="let todo of todos.storeValue">{{todo.title}}</div>
//      */
//     observe(): Observable<S>;
//     observe<T extends (state: core.DeepReadonly<S>) => any>(selector: T): Observable<ReturnType<typeof selector>>
//     observe(selector?: (state: core.DeepReadonly<S>) => any) { return observeInternal(store.get)(selector!); }
//     /**
//      * Takes an async state-update, and returns an Observable which reports on the status of that update.
//      * @example
//      * todos$ = observeFetch(() =>
//      *   select(s => s.todos)
//      *     .replaceAll(() => this.httpClient.get('http://example.com/todos').toPromise())
//      * );
//      * 
//      * <ng-container *ngIf="todos$ | async; let todos;">
//      *   <div *ngIf="todos.isLoading">loading...</div>
//      *   <div *ngIf="todos.wasRejected">loading...</div>
//      *   <ng-container *ngIf="todos.wasResolved">
//      *     <div *ngFor="let todo of todos.storeValue">{{todo.title}}</div>
//      *   <ng-container>
//      * </ng-container>
//      */
//     observeFetch = <C>(operation: () => Promise<C>) => observeFetchInternal<S, C>(store.get)(operation);
//     /**
//      * The purpose of this function is to minimise the number of async pipes that need to be declared in the component template.
//      * This function accepts an object whose keys are user-defined strings and values are functions selecting particular nodes of the state tree.
//      * What will be returned is a single observable which means that only one async pipe is required at the root of your component template.
//      * @example
//      * state$ = observeCombined({
//      *   userName: s.user.name,
//      *   todos: s => s.todos,
//      * })
//      * <ng-container *ngIf="state$ | async; let state;">
//      *   <div>{{state.userName}}</div>
//      *   <div *ngFor="let todo of state.todos">{{todo.title}}</div>
//      * </ng-container>
//      */
//     observeCombined = <T extends { [key: string]: (state: core.DeepReadonly<S>) => any }>(selectorObject: T) => combinedObserversInternal(store.get)(selectorObject);
//   }(), store);
// }

export const createGlobalStore = <S>(initialState: S, options?: core.OptionsForMakingAGlobalStore) => {
  return core.createGlobalStore(initialState, options);
}



export const createGlobalStoreEnforcingTags = <S>(initialState: S, options?: core.OptionsForMakingAGlobalStore) => {
  const store = core.createGlobalStoreEnforcingTags(initialState, options);
  return Object.assign(new class {
    /**
     * Converts the state you select into an observable.
     * @example
     * todos$ = observe(s => s.todos);
     * 
     * <div *ngFor="let todo of todos.storeValue">{{todo.title}}</div>
     */
    observe(): Observable<S>;
    observe<T extends (state: core.DeepReadonly<S>) => any>(selector: T): Observable<ReturnType<typeof selector>>
    observe(selector?: (state: core.DeepReadonly<S>) => any) { return observeInternal(store.get as any as core.SelectorFromAStore<S>)(selector!); }
    /**
     * Takes an async state-update, and returns an Observable which reports on the status of that update.
     * @example
     * todos$ = observeFetch(() =>
     *   select(s => s.todos)
     *     .replaceAll(() => this.httpClient.get('http://example.com/todos').toPromise())
     * );
     * 
     * <ng-container *ngIf="todos$ | async; let todos;">
     *   <div *ngIf="todos.isLoading">loading...</div>
     *   <div *ngIf="todos.wasRejected">loading...</div>
     *   <ng-container *ngIf="todos.wasResolved">
     *     <div *ngFor="let todo of todos.storeValue">{{todo.title}}</div>
     *   <ng-container>
     * </ng-container>
     */
    observeFetch = <C>(operation: () => Promise<C>) => observeFetchInternal<S, C>(store.get as any as core.SelectorFromAStore<S>)(operation);
    /**
     * The purpose of this function is to minimise the number of async pipes that need to be declared in the component template.
     * This function accepts an object whose keys are user-defined strings and values are functions selecting particular nodes of the state tree.
     * What will be returned is a single observable which means that only one async pipe is required at the root of your component template.
     * @example
     * state$ = combineObservers({
     *   userName: s.user.name,
     *   todos: s => s.todos,
     * })
     * <ng-container *ngIf="state$ | async; let state;">
     *   <div>{{state.userName}}</div>
     *   <div *ngFor="let todo of state.todos">{{todo.title}}</div>
     * </ng-container>
     */
    combineObservers = <T extends { [key: string]: (state: core.DeepReadonly<S>) => any }>(selectorObject: T) => combinedObserversInternal(store.get as any as core.SelectorFromAStore<S>)(selectorObject);
  }(), store);
}

export const createNestedStore = <S>(initialState: S, options: core.OptionsForMakingANestedStore) => {
  const store = core.createNestedStore(initialState, options);
  return Object.assign(new class {
    /**
     * Converts the state you select into an observable.
     * @example
     * todos$ = observe(s => s.todos);
     * 
     * <div *ngFor="let todo of todos.storeValue">{{todo.title}}</div>
     */
    observe(): Observable<S>;
    observe<T extends (state: core.DeepReadonly<S>) => any>(selector: T): Observable<ReturnType<typeof selector>>
    observe<L extends Parameters<typeof store.get>[0]>(selector?: L) { return observeInternal<S>(store.get)(selector!); }
    /**
     * Takes an async state-update, and returns an Observable which reports on the status of that update.
     * @example
     * todos$ = observeFetch(() =>
     *   select(s => s.todos)
     *     .replaceAll(() => this.httpClient.get('http://example.com/todos').toPromise())
     * );
     * 
     * <ng-container *ngIf="todos$ | async; let todos;">
     *   <div *ngIf="todos.isLoading">loading...</div>
     *   <div *ngIf="todos.wasRejected">loading...</div>
     *   <ng-container *ngIf="todos.wasResolved">
     *     <div *ngFor="let todo of todos.storeValue">{{todo.title}}</div>
     *   <ng-container>
     * </ng-container>
     */
    observeFetch = <C>(operation: () => Promise<C>) => observeFetchInternal<S, C>(store.get)(operation);
    /**
     * The purpose of this function is to minimise the number of async pipes that need to be declared in the component template.
     * This function accepts an object whose keys are user-defined strings and values are functions selecting particular nodes of the state tree.
     * What will be returned is a single observable which means that only one async pipe is required at the root of your component template.
     * @example
     * state$ = combineObservers({
     *   userName: s.user.name,
     *   todos: s => s.todos,
     * })
     * <ng-container *ngIf="state$ | async; let state;">
     *   <div>{{state.userName}}</div>
     *   <div *ngFor="let todo of state.todos">{{todo.title}}</div>
     * </ng-container>
     */
    combineObservers = <T extends { [key: string]: (state: core.DeepReadonly<S>) => any }>(selectorObject: T) => combinedObserversInternal(store.get)(selectorObject);
  }(), store);
}

/**
 * The purpose of this function is to minimise the number of async pipes that need to be declared in the component template.
 * This function accepts an object whose keys are user-defined strings and values are store selectors.
 * What will be returned is a single observable which means that only one async pipe is required at the root of your component template.
 * @example
 * import globalStore from './my-store';
 * 
 * export class MyComponent {
 *   localStore = createNestedStore(...)
 * 
 *   state$ = combineObserversAcrossStores({
 *     userName: this.localStore.select(s => s.user.name),
 *     todos: globalStore.select(s => s.todos),
 *   })
 * }
 * <ng-container *ngIf="state$ | async; let state;">
 *   <div>{{state.userName}}</div>
 *   <div *ngFor="let todo of state.todos">{{todo.title}}</div>
 * </ng-container>
 */
export const combineObserversAcrossStores = <T extends { [key: string]: Observable<any> }>(
  arg: T
) =>
  combineLatest((Object.keys(arg) as (keyof typeof arg)[]).map((key) => arg[key])).pipe(
    map((values) => {
      const result = {} as { [key in keyof typeof arg]: any };
      (Object.keys(arg) as (keyof typeof arg)[]).forEach((key, idx) => (result[key] = values[idx]));
      return result as {
        [key in keyof T]: T[key]['subscribe'] extends (arg: infer H) => any ? (H extends ((...args: any) => any) ? Parameters<H>[0] : never) : never;
      };
    })
  );

@NgModule()
export class OlikNgModule {
  constructor(ngZone: NgZone) {
    core.listenToDevtoolsDispatch(() => ngZone.run(() => null));
  }
}


declare module 'olik' {
  // interface StoreForAnObjectOrPrimitive<C, T extends core.Trackability> {
  //   observe: () => Observable<C>;
  // }
  // interface StoreForAnArrayOfPrimitives<X extends core.DeepReadonlyArray<any>, T extends core.Trackability> extends core.StoreForAnArrayCommon<X, T> {
  //   test: string;
  // }
  // interface SelectorReader<S, U> {
  //   observe: () => Observable<U>;
  // }
  interface StoreOrDerivation<C> {
    observe: () => Observable<C>;
  }
  interface ArrayOfElementsCommonAction<X extends core.DeepReadonlyArray<any>, F extends core.FindOrFilter, T extends core.Trackability> {
    observe: () => Observable<F extends 'find' ? X[0] : X>;
  }
}