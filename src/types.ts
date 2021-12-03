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
export interface Unsubscribable {
  /**
   * Unsubscribes from this listener thereby preventing a memory leak.
   */
  unsubscribe: () => any,
}

export type UpsertableObject<T, S> = {
  withOne: (upsertion: T) => void,
  withMany: (upsertion: T[]) => void,
} & { [K in keyof S]: S[K] extends object ? UpsertableObject<T, S[K]> : UpsertablePrimitive<T> }

export type UpsertablePrimitive<T> = {
  withOne: (upsertion: T) => void,
  withMany: (upsertion: T[]) => void,
}

type Payload<S> = S | (() => Promise<S>);
type Result<X extends Payload<any>> = X extends (() => Promise<infer R>) ? Promise<R> : void;

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
      replaceAll: (newArray: S) => void,
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


export type UpdatablePrimitive<S, F extends FindOrFilter, Q extends QueryStatus> = (
  (
    Q extends 'notQueried' ? {
      replaceAll: (replacement: S) => void;
    } : F extends 'isFind' ? {
      replace: <X extends Payload<S>, H = X extends Function ? { cacheFor: number, optimisticallyUpdateWith: S } : {}>(replacement: X, options?: H) => Result<X>;
    } : {}
  ) & (
    S extends number ? (
      Q extends 'notQueried' ? ({
        incrementAll: (by: number) => void;
      }) : ({
        increment: (by: number) => void;
      })
    ) : {}
  ) & (
    Readable<F extends 'isFilter' ? S[] : S>
  ) & {
    invalidateCache: () => void,
    remove: () => void,
  }
);

export interface Readable<S> {
  read: () => DeepReadonly<S>;
  onChange: (changeListener: (state: DeepReadonly<S>) => any) => Unsubscribable;
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

/**
 * An object which can be unsubscribed from
 */
export interface Unsubscribable {
  /**
   * Unsubscribes from this listener thereby preventing a memory leak.
   */
  unsubscribe: () => any,
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
  onChange: (listener: (value: R) => any) => Unsubscribable,
  /**
   * Ensure that the next time state is read, it is re-caculated
   */
  invalidate: () => void,
}
