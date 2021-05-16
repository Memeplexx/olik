import { NgModule, NgZone } from '@angular/core';
import * as core from 'olik';
import { Observable } from 'rxjs';

export * from 'olik';

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
) => <L extends Parameters<typeof select>[0], C extends FnReturnType<L>>(
  selector: L
) => new Observable<C>(observer => {
  const subscription = select(selector).onChange(v => observer.next(v as C));
  return () => subscription.unsubscribe();
});

export const createAppStore = <S>(initialState: S, options?: core.OptionsForMakingAStore) => {
  const { select, read } = core.createAppStore(initialState, options);
  return {
    /**
     * Select a piece of the state to operate on and perform some action on it
     * @example
     * select(s => s.username).replace('Jeff');
     */
    select,
    /**
     * Read the state tree
     * @example
     * const username = read().username;
     */
    read,
    /**
     * Converts the state you select into an observable.
     * @example
     * todos$ = observe(s => s => s.todos);
     * 
     * <div *ngFor="let todo of todos.storeValue">{{todo.title}}</div>
     */
    observe: <L extends Parameters<typeof select>[0]>(selector: L) => observeInternal(select)(selector),
    /**
     * Takes an async state-update, and returns an Observable which reports on the status of that update.
     * @example
     * todos$ = observeFetch(() =>
     *   select(s => s.todos)
     *     .replaceAll(() => fetchTodosFromAPI())
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
    observeFetch: <C>(operation: () => Promise<C>) => observeFetchInternal<S, C>(select)(operation),
  };
}

export const createAppStoreEnforcingTags = <S>(initialState: S, options?: core.OptionsForMakingAStore) => {
  const { select, read } = core.createAppStoreEnforcingTags(initialState, options);
  return {
    /**
     * Select a piece of the state to operate on and perform some action on it
     * @example
     * select(s => s.username).replace('Jeff', { tag: 'MyComponent' });
     */
    select,
    /**
     * Read the state tree
     * @example
     * const username = read().username;
     */
    read,
    /**
     * Converts the state you select into an observable.
     * @example
     * todos$ = observe(s => s => s.todos);
     * 
     * <div *ngFor="let todo of todos.storeValue">{{todo.title}}</div>
     */
    observe: <L extends Parameters<typeof select>[0]>(selector: L) => observeInternal<S>(select as any)(selector),
    /**
     * Takes an async state-update, and returns an Observable which reports on the status of that update.
     * @example
     * todos$ = observeFetch(() =>
     *   select(s => s.todos)
     *     .replaceAll(() => fetchTodosFromAPI())
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
    observeFetch: <C>(operation: () => Promise<C>) => observeFetchInternal<S, C>(select as any as core.SelectorFromAStore<S>)(operation),
  };
}

export const creaeNestedStore = <S>(initialState: S, options: core.OptionsForMakingANestedStore) => {
  const { select, read } = core.creatNestedStore(initialState, options);
  return {
    /**
     * Select a piece of the state to operate on and perform some action on it
     * @example
     * select(s => s.username).replace('Jeff');
     */
    select,
    /**
     * Read the state tree
     * @example
     * const username = read().username;
     */
    read,
    /**
     * Converts the state you select into an observable.
     * @example
     * todos$ = observe(s => s => s.todos);
     * 
     * <div *ngFor="let todo of todos.storeValue">{{todo.title}}</div>
     */
    observe: <L extends Parameters<typeof select>[0]>(selector: L) => observeInternal<S>(select)(selector),
    /**
     * Takes an async state-update, and returns an Observable which reports on the status of that update.
     * @example
     * todos$ = observeFetch(() =>
     *   select(s => s.todos)
     *     .replaceAll(() => fetchTodosFromAPI())
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
    observeFetch: <C>(operation: () => Promise<C>) => observeFetchInternal<S, C>(select)(operation),
  };
}

@NgModule()
export class OlikNgModule {
  constructor(ngZone: NgZone) {
    core.listenToDevtoolsDispatch(() => ngZone.run(() => null));
  }
}
