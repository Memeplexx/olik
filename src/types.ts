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

export type UpdatableObject<S, F extends FindOrFilter, Q extends QueryStatus> = {
  replace: (replacement: S) => void;
  patch: (patch: Partial<S>) => void;
}
  & { [K in keyof S]: S[K] extends Array<any>
    ? UpdatableArray<S[K], 'isFilter', 'notQueried'>
    : S[K] extends object ? UpdatableObject<S[K], F, Q>
    : UpdatablePrimitive<S[K], F, Q> }
  & Readable<S, F>;

export type UpdatableArray<S extends Array<any>, F extends FindOrFilter, Q extends QueryStatus> = (Q extends 'queried' ? {
  or: Comparators<S, S[0], F> & (S[0] extends object ? Searchable<S, S[0], F> : {}),
  and: Comparators<S, S[0], F> & (S[0] extends object ? Searchable<S, S[0], F> : {}),
  replace: (replacement: F extends 'isFilter' ? S : S[0]) => void,
  remove: () => void,
} : {
  find: Comparators<S, S[0], 'isFind'> & (S[0] extends object ? Searchable<S, S[0], 'isFind'> : {}),
  filter: Comparators<S, S[0], 'isFilter'> & (S[0] extends object ? Searchable<S, S[0], 'isFilter'> : {}),
  removeAll: () => void,
  replaceAll: (newArray: S) => void,
  addOne: (element: S[0]) => void,
  addMany: (array: S) => void,
  upsertMatching: { [K in keyof S[0]]: S[0][K] extends object ? UpsertableObject<S[0], S[0]> : UpsertablePrimitive<S[0]> },
})
  & (S[0] extends Array<any> ? {} : S[0] extends object ? UpdatableObject<S[0], F, Q> : UpdatablePrimitive<S[0], F, Q>);

export type UpdatablePrimitive<S, F extends FindOrFilter, Q extends QueryStatus> = (
  Q extends 'notQueried' ? {
    replaceAll: (replacement: S) => void;
  } : {
    replace: (replacement: S) => void;
  }
) & (S extends number ?
  (Q extends 'notQueried' ? {
    incrementAll: (by: number) => void;
  } : {
    increment: (by: number) => void;
  }) : {
  }
  ) & Readable<S, F>;

export interface Readable<S, F extends FindOrFilter> {
  read: () => F extends 'isFilter' ? DeepReadonly<S[]> : DeepReadonly<S>;
  onChange: (changeListener: (state: F extends 'isFilter' ? DeepReadonly<S[]> : DeepReadonly<S>) => any) => Unsubscribable;
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

export type Searchable<T, S, F extends FindOrFilter> = { [K in keyof S]: (S[K] extends object ? (Searchable<T, S[K], F> & Comparators<T, S[K], F>) : Comparators<T, S[K], F>) };

export interface StateAction {
  type: 'property' | 'search' | 'comparator' | 'action' | 'searchConcat';
  name: string;
  arg: any;
  actionType: string | null;
}

export interface QuerySpec {
  query: (e: any) => boolean,
  concat: 'and' | 'or' | 'last'
};