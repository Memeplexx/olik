import { EventEmitter, NgModule, NgZone } from '@angular/core';
import * as core from 'olik';
import { FutureState } from 'olik';
import { combineLatest, from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export * from 'olik';

// declare module 'olik' {
//   interface StoreOrDerivation<C> {
//     observe: () => Observable<C>;
//   }
//   interface ArrayOfElementsCommonAction<X extends core.DeepReadonlyArray<any>, F extends core.FindOrFilter, T extends core.Trackability> {
//     observe: () => Observable<F extends 'find' ? X[0] : X>;
//   }
//   interface Future<C> {
//     observeStatus: () => Observable<FutureState<C>>;
//     asObservable: () => Observable<C>;
//   }
//   interface Async<C> extends Observable<C> {
//   }
//   interface Derivation<R> {
//     observe: () => Observable<R>;
//   }
// }

type FunctionParameter<T> = T extends (arg: infer H) => any ? H : never;
type ClassObservables<T> = {
  [I in keyof T]: T[I] extends Observable<any> ? FunctionParameter<Parameters<T[I]['subscribe']>[0]> : never;
};
type SubType<Base, Condition> = Pick<Base, {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never
}[keyof Base]>;
type Observables<T> = ClassObservables<SubType<Omit<T, 'observables$'>, Observable<any>>>;

/**
 * Takes a component instance, finds all its observables, and combines them into 1 observable for the template to consume.
 * This has the added benefit of allowing you to access all observable values synchronously as well as view your observable
 * values inside the Angular devtool extension.
 *
 * @example
 * ```
 * <ng-container *ngIf="observables$ | async; let observe;">
 *   <div>Observable 1: {{observe.observable1$}}</div>
 *   <div>Observable 2: {{observe.observable2$}}</div>
 * </ng-container>
 *
 * class MyComponent {
 *   readonly observable1$ = ...;
 *   readonly observable2$ = ...;
 *   readonly observables$ = combineComponentObservables<MyComponent>(this);
 *
 *   ngAfterViewInit() {
 *     // synchronous access to observable values
 *     const observable1Value = this.$observables.value.observable1$;
 *   }
 * }
 * ```
 */
 export const combineComponentObservables = <T>(component: T, flag?: boolean): Observable<Observables<T>> & { value: Observables<T> } => {
  const keysOfObservableMembers = Object.keys(component)
    .filter(key => (component as any)[key] instanceof Observable && !((component as any)[key] instanceof EventEmitter));
  const res = combineLatest(
    keysOfObservableMembers.map(key => (component as any)[key] as Observable<any>)
  ).pipe(
    map(observers => {
      const result = {} as {[key: string]: any};
      observers.forEach((obs, idx) => result[keysOfObservableMembers[idx]] = obs);
      (component as any).$observables = result;
      (res as any).value = result;
      return result as Observables<T>;
    })
  );
  return res as Observable<Observables<T>> & { value: Observables<T> };
};

@NgModule()
export class OlikNgModule {
  constructor(ngZone: NgZone) {
    if (ngZone) {
      core.listenToDevtoolsDispatch(() => ngZone.run(() => null));
    }
    core.augment({
      selection: {
        observe: <C>(selection: core.StoreOrDerivation<C>) => () => new Observable<any>(observer => {
          observer.next(selection.read());
          const subscription = selection.onChange(v => observer.next(v));
          return () => subscription.unsubscribe();
        }),
      },
      future: {
        observeStatus: (future) => () => new Observable<any>(observer => {
          observer.next({ error: null, isLoading: false, storeValue: future.read(), wasRejected: false, wasResolved: false });
          const subscription = future.onChange(v => observer.next(v));
          return () => subscription.unsubscribe();
        }),
        asObservable: (future) => () => from(future.asPromise())
      },
      derivation: {
        observe: <R>(selection: core.Derivation<R>) => () => new Observable<any>(observer => {
          observer.next(selection.read());
          const subscription = selection.onChange(v => observer.next(v));
          return () => subscription.unsubscribe();
        }),
      },
      async: <C>(fnReturningFutureAugmentation: () => any) => {
        const promiseOrObservable = fnReturningFutureAugmentation();
        return promiseOrObservable.then ? promiseOrObservable : (promiseOrObservable as Observable<C>).toPromise()
      },
    })
  }
}
