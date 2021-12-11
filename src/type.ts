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

export type DeepMergePayloadObject<T> = Partial<{
  [P in keyof T]: DeepMergePayload<T[P]>;
}> & { [x: string]: any }

export type DeepMergePayload<T> =
  T extends (infer R)[] ? Array<DeepMergePayload<R>> :
  T extends object ? DeepMergePayloadObject<T> :
  T;

export type UpsertableObject<T, S> = WithOne<T> & WithMany<T> & { [K in keyof S]: S[K] extends object ? UpsertableObject<T, S[K]> : UpsertablePrimitive<T> }

export interface UpsertablePrimitive<T> extends WithOne<T>, WithMany<T> {
}

type Payload<S> = S | (() => AnyAsync<S>);
type UpdateResult<X extends AnyAsync<any>> = X extends (() => AnyAsync<infer R>) ? Future<R> : void;

export type UpdatableObject<S, F extends FindOrFilter, Q extends QueryStatus> = (
  Patch<S> & (
    F extends 'isFind' ? Replace<S> & DeepMerge<S> : {}
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
  /**
   * Unsubscribe from the change listener that was previously added to the selected node.
   */
  unsubscribe: () => void,
}

export interface InvalidateCache {
  /**
   * Ensure that any data cached on the selected node is re-fetched the next time a promise is used to populate this node.
   */
  invalidateCache: () => void,
}

export interface Remove {
  /**
   * Remove the selected property from its parent object.  
   * 
   * **WARNING**: Performing this action has the potential to contradict the type-system. 
   * **Only** use this to remove properties from objects of type `{ [key: string]: any }` and 
   * **not** from objects with a known structure, for example `{ num: number, str: string }`.
   */
  remove(): void,
  remove<X extends Payload<any>>(options: X): Future<any>;
}

export interface RemoveAll {
  /**
   * Remove all elements from the selected array node.
   */
  removeAll(): void,
  removeAll<X extends Payload<any>>(options: X): Future<any>;
}

export interface InsertOne<S> {
  /**
   * Insert the supplied array element into the selected array node. 
   */
  insertOne<X extends Payload<S>>(element: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface InsertMany<S> {
  /**
   * Insert the supplied array into the selected array node. 
   */
  insertMany<X extends Payload<S>>(element: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface Patch<S> {
  /**
   * Partially update the selected object node with the supplied state.
   */
  patch<X extends Payload<Partial<S>>>(patch: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface PatchAll<S> {
  /**
   * Partially update all the selected object nodes with the supplied state.
   */
  patchAll<X extends Payload<Partial<S>>>(patch: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface Increment {
  /**
   * Add the supplied number onto the selected node.
   */
  increment<X extends Payload<number>>(by: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface IncrementAll {
  /**
   * Add the supplied number onto all the selected nodes. 
   */
  incrementAll<X extends Payload<number>>(by: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface Replace<S> {
  /**
   * Replace the selected node with the supplied state.
   */
  replace<X extends Payload<S>>(replacement: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface ReplaceAll<S> {
  /**
   * Replace all the selected nodes with the supplied state.
   */
  replaceAll<X extends Payload<S>>(replacement: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface DeepMerge<S> {
  /**
   * Recursively merge the supplied object into the selected node.
   */
  deepMerge: <X extends Payload<DeepMergePayload<S>>>(toMerge: X, options: UpdateOptions<X>) => UpdateResult<X>;
}

export interface InvalidateDerivation {
  /**
   * Ensure that, the next time this derivation is read, it is re-calculated.
   */
  invalidate(): void,
}

export interface Read<S> {
  /**
   * Read the current state from the selected node.
   */
  read(): DeepReadonly<S>;
}

export interface OnChange<S> {
  /**
   * Listen to updates made to the selected node.  
   * Please ensure that you unsubscribe once you're done listening for updates.
   * 
   * @example
   * const subscription = select.todos
   *   .onChange(todos => console.log(`There are now ${todos.length} todos in the store`));
   * 
   * subscription.unsubscribe();
   */
  onChange(changeListener: (state: DeepReadonly<S>) => any): Unsubscribe;
}

export interface Readable<S> extends Read<S>, OnChange<S> {
}

export interface WithOne<T> {
  /**
   * Upsert with an individual array element.
   */
  withOne: <X extends Payload<T>>(element: X) => UpdateResult<X>,
}

export interface WithMany<T> {
  /**
   * Upsert with an array of elements.
   */
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
  = Omit<S extends Array<any> ? UpdatableArray<S, 'isFilter', 'notQueried'>
    : S extends object ? UpdatableObject<S, 'isFind', 'queried'>
    : UpdatablePrimitive<S, 'isFind', 'queried'>, 'remove'> & {
      removeFromApplicationStore: () => void,
      setDeferredInstanceName: (instanceName: string | number) => void,
    };

export type Store<S>
  = Omit<S extends Array<any> ? UpdatableArray<S, 'isFilter', 'notQueried'>
    : S extends object ? UpdatableObject<S, 'isFind', 'queried'>
    : UpdatablePrimitive<S, 'isFind', 'queried'>, 'remove'>;

type DerivationCalculationInput<E> = E extends Readable<infer W> ? W : never;

export type DerivationCalculationInputs<T extends Array<Readable<any>>> = {
  [K in keyof T]: DerivationCalculationInput<T[K]>;
}

export interface Derivation<R> extends Read<R>, OnChange<R>, InvalidateDerivation {
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
  /**
   * The name that will identify your store in the devtools extension.
   * The default value is `document.title`.
   */
  applicationStoreName?: string;
};

export interface OptionsForMakingAnApplicationStore {
  /**
   * The name that will identify your store in the devtools extension.
   * The default value is `document.title`.
   */
  name: string,
}