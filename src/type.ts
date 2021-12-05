export type FindOrFilter = 'isFind' | 'isFilter';
export type QueryStatus = 'notQueried' | 'queried';

export interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {
}

export type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

export type DeepReadonly<T> =
  T extends (infer R)[] ? DeepReadonlyArray<R> :
  T extends object ? DeepReadonlyObject<T> :
  T;

export type UpsertableObject<T, S> = WithOne<T> & WithMany<T> & { [K in keyof S]: S[K] extends object ? UpsertableObject<T, S[K]> : UpsertablePrimitive<T> }

export interface UpsertablePrimitive<T> extends WithOne<T>, WithMany<T> {
}

type Payload<S> = S | (() => AnyAsync<S>);
type UpdateResult<X extends AnyAsync<any>> = X extends (() => AnyAsync<infer R>) ? Future<R> : void;

export type UpdatableObject<S, F extends FindOrFilter, Q extends QueryStatus> = (
  Patch<S> & (
    F extends 'isFind' ? Replace<S> : {}
  ) & ({
    [K in keyof S]: S[K] extends Array<any>
    ? UpdatableArray<S[K], 'isFilter', 'notQueried'>
    : S[K] extends object ? UpdatableObject<S[K], F, Q>
    : UpdatablePrimitive<S[K], F, Q>
  }) & (
    Readable<F extends 'isFilter' ? S[] : S>
  ) & InvalidateCache & Remove
);

export type UpdatableArray<S extends Array<any>, F extends FindOrFilter, Q extends QueryStatus> = (
  Q extends 'queried' ? (
    ({
      or: Comparators<S, S[0], F> & (S[0] extends object ? Searchable<S, S[0], F> : {}),
      and: Comparators<S, S[0], F> & (S[0] extends object ? Searchable<S, S[0], F> : {}),
    } & Remove)
    & (F extends 'isFind' ? Replace<S[0]> : {})
    & (S[0] extends Array<any> ? {} : S[0] extends object ? UpdatableObject<S[0], F, Q> : UpdatablePrimitive<S[0], F, Q>)
  ) : (
    ({
      find: Comparators<S, S[0], 'isFind'> & (S[0] extends object ? Searchable<S, S[0], 'isFind'> : {}),
      filter: Comparators<S, S[0], 'isFilter'> & (S[0] extends object ? Searchable<S, S[0], 'isFilter'> : {}),
    } & RemoveAll & InsertMany<S> & InsertOne<S[0]> & ReplaceAll<S>) & (
      S[0] extends Array<any> ? {} : S[0] extends object ? UpsertMatching<S[0]> : {}
    ) & (
      S[0] extends object ? (({
        [K in keyof S[0]]: (S[0][K] extends Array<any>
          ? UpdatableArray<S[0][K], 'isFilter', 'notQueried'>
          : S[0][K] extends object
          ? UpdatableObject<S[0][K], F, Q>
          : UpdatablePrimitive<S[0][K], F, Q>)
      }) & PatchAll<S[0]>) : IncrementAll
    ) & (
      Readable<F extends 'isFilter' ? S : S[0]>
    )
  )
)

export type UpdateOptions<H> = (H extends () => AnyAsync<any> ? & CacheFor & OptimisticallyUpdateWith<H> : {}) | void;

export type UpdatablePrimitive<S, F extends FindOrFilter, Q extends QueryStatus> = (
  (
    Q extends 'notQueried' ? ReplaceAll<S> : F extends 'isFind' ? Replace<S> : {}
  ) & (
    S extends number ? (Q extends 'notQueried' ? IncrementAll : Increment) : {}
  ) & (
    Readable<F extends 'isFilter' ? S[] : S>
  ) & InvalidateCache & Remove
);

export interface UpsertMatching<S> {
  upsertMatching: { [K in keyof S]: S[K] extends object ? UpsertableObject<S, S> : UpsertablePrimitive<S> },
}

export interface Unsubscribe {
  unsubscribe: () => any,
}

export interface InvalidateCache {
  invalidateCache: () => void,
}

export interface Remove {
  remove(): void,
  remove<X extends Payload<any>>(options: X): Future<any>;
}

export interface RemoveAll {
  removeAll(): void,
  removeAll<X extends Payload<any>>(options: X): Future<any>;
}

export interface InsertOne<S> {
  insertOne<X extends Payload<S>>(element: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface InsertMany<S> {
  insertMany<X extends Payload<S>>(element: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface Patch<S> {
  patch<X extends Payload<Partial<S>>>(patch: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface PatchAll<S> {
  patchAll<X extends Payload<Partial<S>>>(patch: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface Increment {
  increment<X extends Payload<number>>(by: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface IncrementAll {
  incrementAll<X extends Payload<number>>(by: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface Replace<S> {
  replace<X extends Payload<S>>(replacement: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface ReplaceAll<S> {
  replaceAll<X extends Payload<S>>(replacement: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface Invalidate {
  invalidate(): void,
}

export interface Read<S> {
  read(): DeepReadonly<S>;
}

export interface OnChange<S> {
  onChange(changeListener: (state: DeepReadonly<S>) => any): Unsubscribe;
}

export interface Readable<S> extends Read<S>, OnChange<S> {
}

export interface WithOne<T> {
  withOne: <X extends Payload<T>>(element: X) => UpdateResult<X>,
}

export interface WithMany<T> {
  withMany: <X extends Payload<T[]>>(array: X) => UpdateResult<X>,
}

export interface CacheFor {
  /**
   * Avoid unnecessary promise invocations by supplying the number of milliseconds that should elapse before the promise is invoked again.
   * To un-do this, you can call `invalidateCache()` on the node of the state tree, for example
   * @example
   * select.todos.invalidateCache();
   * @example
   * select.todos.find.id.eq(2).invalidateCache();
   */
  cacheFor?: number;
}

export interface OptimisticallyUpdateWith<H> {
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

export type ComponentStore<S>
  = Store<S> & { removeFromApplicationStore: () => void };
export type Store<S>
  = Omit<S extends Array<any> ? UpdatableArray<S, 'isFilter', 'notQueried'>
    : S extends object ? UpdatableObject<S, 'isFind', 'queried'>
    : UpdatablePrimitive<S, 'isFind', 'queried'>, 'remove'>;

type DerivationCalculationInput<E> = E extends Readable<infer W> ? W : never;

export type DerivationCalculationInputs<T extends Array<Readable<any>>> = {
  [K in keyof T]: DerivationCalculationInput<T[K]>;
}

export interface Derivation<R> extends Read<R>, OnChange<R>, Invalidate {
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

export const Deferred = Symbol('deferred');

export type OptionsForMakingAComponentStore = {
  /**
   * The name that will distinguish this component store from others within the state tree
   */
  componentName: string;
  /**
   * The string that will distinguish different instances of the same component store.
   */
  instanceName: string | number | typeof Deferred;
  /**
   * Whether or not action stack-traces should be logged to the console.
   * Internally, this makes use of `new Error().stack` to take advantage of sourcemaps
   */
  traceActions?: boolean,

  applicationStoreName?: string;
};

export interface OptionsForMakingAnApplicationStore {
  name?: string,
  replaceExistingStoreIfItExists?: boolean,
  disabledDevtoolsIntegration?: boolean,
}