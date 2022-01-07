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
type UpdateResult<X> = X extends (() => AnyAsync<infer R>) ? Future<R> : void;

export type DecrementRecursion = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
export type LengthOfTuple<T extends any[]> = T extends { length: infer L } ? L : never;
export type DropFirstInTuple<T extends any[]> = ((...args: T) => any) extends (arg0: any, arg1: any, arg2: any, ...rest: infer U) => any ? U : T;
export type LastInTuple<T extends any[]> = T[LengthOfTuple<DropFirstInTuple<T>>];
export type MaxRecursionDepth = LastInTuple<DecrementRecursion>;

export type Rec<X, Depth extends number> = {
  done: {},
  recur: X
}[Depth extends -1 ? 'done' : 'recur']

export type UpdatableObject<S, F extends FindOrFilter, Q extends QueryStatus, Depth extends number, NewDepth extends number = DecrementRecursion[Depth]> = Rec<
  & Patch<S>
  & Remove<Depth>
  & InvalidateCache
  & (F extends 'isFind' ? (Replace<S> & DeepMerge<S>) : {})
  & Readable<F extends 'isFilter' ? S[] : S>
  & ({
    [K in keyof S]: S[K] extends Array<any>
    ? UpdatableArray<S[K], 'isFilter', 'notQueried', NewDepth>
    : S[K] extends object ? UpdatableObject<S[K], F, Q, NewDepth>
    : UpdatablePrimitive<S[K], F, Q, NewDepth>
  })
  , Depth>

export type UpdatableArray<S extends Array<any>, F extends FindOrFilter, Q extends QueryStatus, Depth extends number, NewDepth extends number = DecrementRecursion[Depth]> = Rec<
  & Q extends 'queried'
  ? (
    & Remove<Depth>
    & InvalidateCache
    & (F extends 'isFind' ? Replace<S[0]> : {})
    & Or<S, F, NewDepth>
    & And<S, F, NewDepth>
    & (S[0] extends Array<any> ? {} : S[0] extends object ? UpdatableObject<S[0], F, Q, NewDepth> : UpdatablePrimitive<S[0], F, Q, NewDepth>)
  ) : (
    & Remove<Depth>
    & InvalidateCache
    & RemoveAll
    & InsertMany<S>
    & InsertOne<S[0]>
    & ReplaceAll<S>
    & Readable<F extends 'isFilter' ? S : S[0]>
    & (S[0] extends Array<any> ? {} : S[0] extends object ? UpsertMatching<S[0]> : {})
    & Find<S, NewDepth>
    & Filter<S, NewDepth>
    & (
      S[0] extends object
      ? (
        & PatchAll<S[0]>
        & { [K in keyof S[0]]:
          (S[0][K] extends Array<any>
            ? UpdatableArray<S[0][K], 'isFilter', 'notQueried', NewDepth>
            : S[0][K] extends object
            ? UpdatableObject<S[0][K], F, Q, NewDepth>
            : UpdatablePrimitive<S[0][K], F, Q, NewDepth>)
        }
      )
      : IncrementAll
    )
  ), Depth>

export type UpdateOptions<H> = (H extends () => AnyAsync<any> ? & CacheFor & OptimisticallyUpdateWith<H> : {}) | void;

export type UpdatablePrimitive<S, F extends FindOrFilter, Q extends QueryStatus, Depth extends number> =
  & InvalidateCache
  & Remove<Depth>
  & (Q extends 'notQueried' ? ReplaceAll<S> : F extends 'isFind' ? Replace<S> : {})
  & (S extends number ? (Q extends 'notQueried' ? IncrementAll : Increment) : {})
  & Readable<F extends 'isFilter' ? S[] : S>


export interface UpsertMatching<S> {
  upsertMatching: { [K in keyof S]: S[K] extends object ? UpsertableObject<S, S> : UpsertablePrimitive<S> },
}

export interface Or<S extends Array<any>, F extends FindOrFilter, NewDepth extends number> {
  or: Comparators<S, S[0], F, NewDepth> & (S[0] extends object ? Searchable<S, S[0], F, NewDepth> : {})
}

export interface And<S extends Array<any>, F extends FindOrFilter, NewDepth extends number> {
  and: Comparators<S, S[0], F, NewDepth> & (S[0] extends object ? Searchable<S, S[0], F, NewDepth> : {})
}

export interface Find<S extends Array<any>, NewDepth extends number> {
  /**
   * Find from the selected array
   */
  find: Comparators<S, S[0], 'isFind', NewDepth> & (S[0] extends object ? Searchable<S, S[0], 'isFind', NewDepth> : {})
}

export interface Filter<S extends Array<any>, NewDepth extends number> {
  /**
   * Filter the selected array
   */
  filter: Comparators<S, S[0], 'isFilter', NewDepth> & (S[0] extends object ? Searchable<S, S[0], 'isFilter', NewDepth> : {})
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

export type Remove<Depth extends number> = [Depth] extends [MaxRecursionDepth] ? {} : {
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
   * The current state from the selected node.
   */
  state: DeepReadonly<S>;
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

export type UpdatableAny<T, F extends FindOrFilter, Q extends QueryStatus, Depth extends number, NewDepth extends number = DecrementRecursion[Depth]> = Rec<
  T extends Array<any>
  ? UpdatableArray<T, F, Q, NewDepth>
  : T extends object
  ? UpdatableObject<T, F, Q, NewDepth>
  : UpdatablePrimitive<T, F, Q, NewDepth>
  ,
  Depth>

export type Comparators<T, S, F extends FindOrFilter, Depth extends number, NewDepth extends number = DecrementRecursion[Depth], Response = UpdatableAny<T, F, 'queried', NewDepth>> = Rec<
  & Eq<S, Response>
  & Ne<S, Response>
  & In<S, Response>
  & Ni<S, Response>
  & (S extends string ?
    & Match<Response>
    : {}
  ) & (S extends string | number ?
    & Gt<S, Response>
    & Gte<S, Response>
    & Lt<S, Response>
    & Lte<S, Response>
    : {}
  )
  ,
  Depth>

export interface Eq<S, Response> {
  /**
   * Whether the selection is equal to the supplied value
   */
  eq: (equalTo: S) => Response
}

export interface Ne<S, Response> {
  /**
   * Whether the selection is not equal to the supplied value
   */
  ne: (notEqualTo: S) => Response
}

export interface In<S, Response> {
  /**
   * Whether the selection is within the supplied array
   */
  in: (within: S[]) => Response
}

export interface Ni<S, Response> {
  /**
   * Whether the selection is not within the supplied array
   */
  ni: (notWithin: S[]) => Response
}

export interface Gt<S, Response> {
  /**
   * Whether the selection is greater than the supplied value
   */
  gt: (greaterThan: S) => Response
}

export interface Gte<S, Response> {
  /**
   * Whether the selection is greater than or equal to the supplied value
   */
  gte: (greaterThanOrEqualTo: S) => Response
}

export interface Lt<S, Response> {
  /**
   * Whether the selection is less than the supplied value
   */
  lt: (lessThan: S) => Response
}

export interface Lte<S, Response> {
  /**
   * Whether the selection is less than or equal to the supplied value
   */
  lte: (lessThanOrEqualTo: S) => Response
}

export interface Match<Response> {
  /**
   * Whether the selection matches the supplied regular expression
   */
  match: (matches: RegExp) => Response
}

export type Searchable<T, S, F extends FindOrFilter, Depth extends number, NewDepth extends number = DecrementRecursion[Depth]> = Rec<
  {
    [K in keyof S]: (S[K] extends object
      ? (Searchable<T, S[K], F, NewDepth> & Comparators<T, S[K], F, NewDepth>)
      : Comparators<T, S[K], F, NewDepth>)
  }
  ,
  Depth>

export interface StateAction {
  type: 'property' | 'search' | 'comparator' | 'action' | 'searchConcat' | 'upsertMatching';
  name: string;
  arg?: any;
  actionType?: string;
}

type DerivationCalculationInput<E> = E extends Readable<infer W> ? W : never;

export type DerivationCalculationInputs<T extends Array<Readable<any>>> = {
  [K in keyof T]: DerivationCalculationInput<T[K]>;
}

export interface Derivation<R> extends Read<R>, OnChange<R>, InvalidateDerivation {
}

export interface FutureState<C> {
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

export interface Augmentations {
  selection: { [name: string]: <C>(selection: Readable<C>) => (...args: any[]) => any },
  future: { [name: string]: <C>(future: Future<C>) => (...args: any[]) => any };
  derivation: { [name: string]: <R>(derivation: Derivation<R>) => (...args: any[]) => any }
  async: <C>(fnReturningFutureAugmentation: () => any) => Promise<C>;
}

export interface Async<C> {
}

export type AnyAsync<C> = Async<C> | Promise<C>;

export interface OptionsForMakingAStore<S> {
  /**
   * The name that will identify your store in the devtools extension.
   * The default value is `document.title`.
   */
  name: string,
  /**
   * The initial state of your store. Can be any serializable object
   */
  state: S,
  /**
   * Sometimes actions with the same `type` may be dispatched many times in a short period.
   * An example of this might be tracking the users mouse cursor position.
   * To prevent these actions from spamming the debug logs, we can 'batch' those actions
   * that have an identical `type` for a specific number of milliseconds.
   * This effectively acts like a 'throttle' + 'debounce'.
   * The default value is `0`.
   */
  batchActions?: number;
}

export interface OptionsForNestedAStore<S> {
  /**
   * The store to be nested
   */
  store: StoreLike<S>,
  /**
   * The name that will distinguish instances of this store
   */
  instanceName: string | number,
  /**
   * The name of the store in which this store should be nested
   */
  containerName: string,
}

export interface OptionsForMergingAStore<S> {
  /**
   * The store to be merged
   */
  store: StoreLike<S>,
  /**
   * The name of the store with which this store should be merged
   */
  nameOfStoreToMergeInto: string,
}

export interface ReduxDevtoolsOptions {
  /**
   * The store to be monitored
   */
  store: Readable<any>;
  /**
   * Whether or not to display the 'trace' tab in the devtools.
   * Set this to false for production builds as it negatively impacts performance.
   */
  traceActions?: boolean;
  /**
   * Limit the length of search args so as to prevent very long action types.  
   * 
   * For example, by default, the following action type:
   * `todos.find.id.eq(c985ab52-6645-11ec-90d6-0242ac120003).remove()`
   * will be abbreviated to
   * `todos.find.id.eq(c985ab).remove()`  
   * 
   * Default value is `6`
   */
  limitSearchArgLength?: number
}

export interface EnableAsyncActionsArgs {
  storeName: string,
  stateActions: StateAction[],
  batchActions?: number,
  prop: string,
  cacheFor?: number,
  optimisticallyUpdateWith?: any,
  arg: any,
}

export type Store<S> = (S extends Array<any> ? UpdatableArray<S, 'isFilter', 'notQueried', MaxRecursionDepth>
  : S extends object ? UpdatableObject<S, 'isFind', 'queried', MaxRecursionDepth>
  : UpdatablePrimitive<S, 'isFind', 'queried', MaxRecursionDepth>);

export interface ChangeListener {
  actions: StateAction[];
  listener: (arg: any) => any;
}

export interface NestStoreRef {
  detach(): void,
}

export interface StoreLike<S> extends Read<S>, OnChange<S>, InvalidateCache, Replace<S> {
}

