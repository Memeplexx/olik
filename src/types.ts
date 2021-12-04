export type FindOrFilter = 'isFind' | 'isFilter';
export type QueryStatus = 'notQueried' | 'queried';

/**
 * An array which cannot be mutated
 */
export interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {
}

/**
 * An object which cannot be mutated
 */
export type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

/**
 * An object or an array which cannot be mutated
 */
export type DeepReadonly<T> =
  T extends (infer R)[] ? DeepReadonlyArray<R> :
  T extends object ? DeepReadonlyObject<T> :
  T;

/**
 * An object which can be unsubscribed from
 */
export interface Unsubscribe {
  /**
   * Unsubscribes from this listener thereby preventing a memory leak.
   */
  unsubscribe: () => any,
}

export type UpsertableObject<T, S> = {
  withOne: (element: T) => void,
  withMany: (array: T[]) => void,
} & { [K in keyof S]: S[K] extends object ? UpsertableObject<T, S[K]> : UpsertablePrimitive<T> }

export type UpsertablePrimitive<T> = {
  withOne: (element: T) => void,
  withMany: (array: T[]) => void,
}

type Payload<S> = S | (() => AnyAsync<S>);
type UpdateResult<X extends AnyAsync<any>> = X extends (() => AnyAsync<infer R>) ? Future<R> : void;

export type UpdatableObject<S, F extends FindOrFilter, Q extends QueryStatus> = (
  ({
    patch: (patch: Partial<S>) => void;
  }) & (
    F extends 'isFind' ? {
      replace: (replacement: Payload<S>) => void;
    } : {}
  ) & ({
    [K in keyof S]: S[K] extends Array<any>
    ? UpdatableArray<S[K], 'isFilter', 'notQueried'>
    : S[K] extends object ? UpdatableObject<S[K], F, Q>
    : UpdatablePrimitive<S[K], F, Q>
  }) & (
    Readable<F extends 'isFilter' ? S[] : S>
  ) & {
    invalidateCache: () => void,
    remove: () => void,
  }
);

export type UpdatableArray<S extends Array<any>, F extends FindOrFilter, Q extends QueryStatus> = (
  Q extends 'queried' ? (
    ({
      or: Comparators<S, S[0], F> & (S[0] extends object ? Searchable<S, S[0], F> : {}),
      and: Comparators<S, S[0], F> & (S[0] extends object ? Searchable<S, S[0], F> : {}),
      remove: () => void,
    }) & (
      F extends 'isFind'
      ? { replace: (replacement: S[0]) => void }
      : {}
    ) & (
      S[0] extends Array<any>
      ? {}
      : S[0] extends object
      ? UpdatableObject<S[0], F, Q>
      : UpdatablePrimitive<S[0], F, Q>
    )
  ) : (
    ({
      find: Comparators<S, S[0], 'isFind'> & (S[0] extends object ? Searchable<S, S[0], 'isFind'> : {}),
      filter: Comparators<S, S[0], 'isFilter'> & (S[0] extends object ? Searchable<S, S[0], 'isFilter'> : {}),
      removeAll: () => void,
      replaceAll: <X extends Payload<S>>(newArray: X, options: UpdateOptions<X>) => UpdateResult<X>;
      insertOne: (element: S[0]) => void,
      insertMany: (array: S) => void,
    }) & (
      S[0] extends Array<any> ? {} : S[0] extends object ? ({
        upsertMatching: { [K in keyof S[0]]: S[0][K] extends object ? UpsertableObject<S[0], S[0]> : UpsertablePrimitive<S[0]> },
      }) : {}
    ) & (
      S[0] extends object ? (({
        [K in keyof S[0]]: (S[0][K] extends Array<any>
          ? UpdatableArray<S[0][K], 'isFilter', 'notQueried'>
          : S[0][K] extends object ? UpdatableObject<S[0][K], F, Q>
          : UpdatablePrimitive<S[0][K], F, Q>)
      }) & ({
        patchAll: (patch: Partial<S[0]>) => void,
      })) : ({
        incrementAll: (by: number) => void
      })
    ) & (
      Readable<F extends 'isFilter' ? S : S[0]>
    )
  )
)

export type UpdateOptions<H> = (H extends () => AnyAsync<any> ? {
  /**
   * Avoid unnecessary promise invocations by supplying the number of milliseconds that should elapse before the promise is invoked again.
   * To un-do this, you can call `invalidateCache()` on the node of the state tree, for example
   * @example
   * select.todos.invalidateCache();
   * @example
   * select.todos.find.id.eq(2).invalidateCache();
   */
  cacheFor?: number;
  /**
   * Allows you to set an initial value to update the store with.
   * If the promise is rejected, this value will be reverted to what it was before the promise was invoked.
   * @example
   * const newUsername = 'Jeff';
   * select.username
   *   .replace(() => updateUsernameOnApi(newUsername), { optimisticallyUpdateWith: newUsername })
   *   .catch(err => notifyUserOfError(err))
   */
  optimisticallyUpdateWith?: H extends () => AnyAsync<infer W> ? W : never,
} : {}) | void;

export type UpdatablePrimitive<S, F extends FindOrFilter, Q extends QueryStatus> = (
  (
    Q extends 'notQueried' ? /*{
      replaceAll: <X extends Payload<S>>(replacement: X, options: UpdateOptions<X>) => UpdateResult<X>;
    }*/ ReplaceAll<S> : F extends 'isFind' ? {
      replace: <X extends Payload<S>>(replacement: X, options: UpdateOptions<X>) => UpdateResult<X>;
    } : {}
  ) & (
    S extends number ? (
      Q extends 'notQueried' ? ({
        incrementAll: <X extends Payload<number>>(by: X, options: UpdateOptions<X>) => UpdateResult<X>;
      }) : ({
        increment: <X extends Payload<number>>(by: X, options: UpdateOptions<X>) => UpdateResult<X>;
      })
    ) : {}
  ) & (
    Readable<F extends 'isFilter' ? S[] : S>
  ) & {
    invalidateCache: () => void,
    remove: () => void,
  }
);

export interface ReplaceAll<S> {
  replaceAll: <X extends Payload<S>>(replacement: X, options: UpdateOptions<X>) => UpdateResult<X>;
}

export interface Readable<S> {
  read: () => DeepReadonly<S>;
  onChange: (changeListener: (state: DeepReadonly<S>) => any) => Unsubscribe;
}

export type UpdatableAny<T, F extends FindOrFilter, Q extends QueryStatus>
  = T extends Array<any>
  ? UpdatableArray<T, F, Q>
  : T extends object
  ? UpdatableObject<T, F, Q>
  : UpdatablePrimitive<T, F, Q>;

export type Comparators<T, S, F extends FindOrFilter> = {
  eq: (value: S) => UpdatableAny<T, F, 'queried'>,
  ne: (value: S) => UpdatableAny<T, F, 'queried'>,
  in: (array: S[]) => UpdatableAny<T, F, 'queried'>,
  ni: (array: S[]) => UpdatableAny<T, F, 'queried'>,
} & (S extends string ? {
  match: (matches: RegExp) => UpdatableAny<T, F, 'queried'>,
  gt: (greaterThan: S) => UpdatableAny<T, F, 'queried'>,
  gte: (greaterThanOrEqualTo: S) => UpdatableAny<T, F, 'queried'>,
  lt: (lessThan: S) => UpdatableAny<T, F, 'queried'>,
  lte: (lessThanOrEqualTo: S) => UpdatableAny<T, F, 'queried'>,
} : S extends number ? {
  gt: (greaterThan: S) => UpdatableAny<T, F, 'queried'>,
  gte: (greaterThanOrEqualTo: S) => UpdatableAny<T, F, 'queried'>,
  lt: (lessThan: S) => UpdatableAny<T, F, 'queried'>,
  lte: (lessThanOrEqualTo: S) => UpdatableAny<T, F, 'queried'>,
} : {});

export type Searchable<T, S, F extends FindOrFilter> = {
  [K in keyof S]: (S[K] extends object
    ? (Searchable<T, S[K], F> & Comparators<T, S[K], F>)
    : Comparators<T, S[K], F>)
};

export interface StateAction {
  type: 'property' | 'search' | 'comparator' | 'action' | 'searchConcat' | 'upsertMatching';
  name: string;
  arg?: any;
  actionType?: string;
}

export interface QuerySpec {
  query: (e: any) => boolean,
  concat: 'and' | 'or' | 'last'
};

export type Store<S>
  = Omit<S extends Array<any> ? UpdatableArray<S, 'isFilter', 'notQueried'>
  : S extends object ? UpdatableObject<S, 'isFind', 'queried'>
  : UpdatablePrimitive<S, 'isFind', 'queried'>, 'remove'>;

type DerivationCalculationInput<E> = E extends Readable<infer W> ? W : never;

export type DerivationCalculationInputs<T extends Array<Readable<any>>> = {
  [K in keyof T]: DerivationCalculationInput<T[K]>;
}

export interface Derivation<R> {
  /**
   * The current value of the derivation
   */
  read: () => R,
  /**
   * Listens to any updates on this derivation
   * @returns a subscription which will need to be unsubscribed from to prevent a memory leak
   * @example
   * deriveFrom(...)
   *   .onChange(derivation => console.log(derivation)) ;
   */
  onChange: (listener: (value: R) => any) => Unsubscribe,
  /**
   * Ensure that the next time state is read, it is re-calculated
   */
  invalidate: () => void,
}

export type FutureState<C> = {
  isLoading: boolean,
  wasRejected: boolean,
  wasResolved: boolean,
  error: any,
  storeValue: C,
};

export interface Future<C> extends Promise<C> {
  /**
   * Gets the current status for the UI to consume
   */
  getFutureState: () => FutureState<C>,
}

export type Augmentations = {
  selection: { [name: string]: <C>(selection: Readable<C>) => (...args: any[]) => any },
  future: { [name: string]: <C>(future: Future<C>) => (...args: any[]) => any };
  derivation: { [name: string]: <R>(derivation: Derivation<R>) => (...args: any[]) => any }
  async: <C>(fnReturningFutureAugmentation: () => any) => Promise<C>;
}

export interface Async<C> {
}

export type AnyAsync<C> = Async<C> | Promise<C>;

