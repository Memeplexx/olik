export type FindOrFilter = 'isFind' | 'isFilter';

export type QueryStatus = 'notQueried' | 'queried' | 'notArray';

export type ImmediateParentIsAFilter = 'yes' | 'no';

export type DeepMergePayloadObject<T> = Partial<{
  [P in keyof T]: DeepMergePayload<T[P]>;
}> & { [x: string]: any }

export type DeepMergePayload<T> =
  T extends (infer R)[] ? Array<DeepMergePayload<R>> :
  T extends object ? DeepMergePayloadObject<T> :
  T;

export type RepsertableObject<T, S> = WithOne<T> & WithMany<T> & { [K in keyof S]: S[K] extends object ? RepsertableObject<T, S[K]> : RepsertablePrimitive<T> }

export interface RepsertablePrimitive<T> extends WithOne<T>, WithMany<T> {
}

export type Payload<S> = S | (() => AnyAsync<S>);
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

export type UpdatableObject<S, F extends FindOrFilter, Q extends QueryStatus, I extends ImmediateParentIsAFilter, Depth extends number, NewDepth extends number = DecrementRecursion[Depth]> = Rec<
  & InvalidateCache
  & RemoveNode<Depth>
  & (Q extends 'notArray' ? InsertNode : {})
  & (Q extends 'notArray' ? PatchObject<S> : F extends 'isFind' ? PatchArrayElement<S> : PatchArray<S>)
  & (Q extends 'notArray' ? Set<S> : F extends 'isFind' ? SetArrayElement<S> : SetArray<S, I>)
  & (Q extends 'notArray' ? DeepMerge<S> : F extends 'isFind' ? DeepMergeArrayElement<S> : DeepMergeArray<S>)
  & Readable<F extends 'isFilter' ? S[] : S>
  & ({
    [K in keyof S]: S[K] extends Array<any>
    ? UpdatableArray<S[K], 'isFilter', 'notQueried', NewDepth>
    : S[K] extends object ? UpdatableObject<S[K], F, Q, 'no', NewDepth>
    : UpdatablePrimitive<S[K], F, Q, NewDepth>
  })
  , Depth>

export type UpdatableArray<S extends Array<any>, F extends FindOrFilter, Q extends QueryStatus, Depth extends number, NewDepth extends number = DecrementRecursion[Depth]> = Rec<
  & Q extends 'queried'
  ? (
    & InvalidateCache
    & Or<S, F, NewDepth>
    & And<S, F, NewDepth>
    & (F extends 'isFind' ? SetArrayElement<S[0]> : {})
    & (F extends 'isFind' ? RemoveArrayElement<Depth> : RemoveArray<Depth>)
    & (S[0] extends Array<any> ? {} : S[0] extends object ? UpdatableObject<S[0], F, Q, 'yes', NewDepth> : UpdatablePrimitive<S[0], F, Q, NewDepth>)
  ) : (
    & RemoveNode<Depth>
    & InvalidateCache
    & Clear
    & Push<S[0] | S>
    & SetArray<S, 'no'>
    & Find<S, NewDepth>
    & Filter<S, NewDepth>
    & Readable<F extends 'isFilter' ? S : S[0]>
    & (S[0] extends Array<any> ? {} : S[0] extends object ? RepsertMatching<S[0]> : {})
    & (
      S[0] extends object
      ? (
        & PatchArray<S[0]>
        & { [K in keyof S[0]]:
          (S[0][K] extends Array<any>
            ? UpdatableArray<S[0][K], 'isFilter', 'notQueried', NewDepth>
            : S[0][K] extends object
            ? UpdatableObject<S[0][K], F, Q, 'yes', NewDepth>
            : UpdatablePrimitive<S[0][K], F, Q, NewDepth>)
        }
      )
      : AddArray
    )
  ), Depth>

export type UpdateOptions<H> = (H extends () => AnyAsync<any> ? & Cache & Eager<H> : {}) | void;

export type UpdatablePrimitive<S, F extends FindOrFilter, Q extends QueryStatus, Depth extends number> =
  & InvalidateCache
  & RemoveNode<Depth>
  & (Q extends 'notArray' ? Set<S> : F extends 'isFind' ? SetArrayElement<S> : SetArray<S, 'no'>)
  & (S extends number ? (F extends 'isFind' ? Add : AddArray) : {})
  & (S extends number ? (F extends 'isFind' ? Subtract : SubtractArray) : {})
  & Readable<F extends 'isFilter' ? S[] : S>

export interface RepsertMatching<S> {
  /**
   * Replace element(s) if they already exist or insert them if they don't
   */
  $repsertMatching: { [K in keyof S]: S[K] extends object ? RepsertableObject<S, S> : RepsertablePrimitive<S> },
}

export interface Or<S extends Array<any>, F extends FindOrFilter, NewDepth extends number> {
  /**
   * Add an additional clause to widen your search
   */
  $or: Comparators<S, S[0], F, NewDepth> & (S[0] extends object ? Searchable<S, S[0], F, NewDepth> : {})
}

export interface And<S extends Array<any>, F extends FindOrFilter, NewDepth extends number> {
  /**
   * Add an additional clause to narrow your search
   */
  $and: Comparators<S, S[0], F, NewDepth> & (S[0] extends object ? Searchable<S, S[0], F, NewDepth> : {})
}

export interface Find<S extends Array<any>, NewDepth extends number> {
  /**
   * Find from the selected array
   */
  $find: Comparators<S, S[0], 'isFind', NewDepth> & (S[0] extends object ? Searchable<S, S[0], 'isFind', NewDepth> : {})
}

export interface Filter<S extends Array<any>, NewDepth extends number> {
  /**
   * Filter the selected array
   */
  $filter: Comparators<S, S[0], 'isFilter', NewDepth> & (S[0] extends object ? Searchable<S, S[0], 'isFilter', NewDepth> : {})
}

export interface Unsubscribe {
  /**
   * Unsubscribe from the change listener that was previously added to the selected node.
   */
  unsubscribe: () => void,
}

export interface InvalidateCache {
  /**
   * Ensure that any data cached on the selected node is re-fetched the next time a request is made to asynchronously populate this node.
   */
  $invalidateCache: () => void,
}

export type InsertNode = {
  /**
   * Insert an object into the selected object.  
   * 
   * **WARNING**: Performing this action has the potential to contradict the type-system. 
   * **Only** use this to add objects onto objects of type `{ [key: string]: any }` and 
   * **not** onto objects with a known structure, for example `{ num: number, str: string }`.
   * 
   * Also note that you cannot insert primitives or arrays into the selected object.
   * The former has been enforced by the type system while the latter could not be.
   */
  $insert<X extends Payload<object>>(insertion: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export type RemoveNode<Depth extends number> = [Depth] extends [MaxRecursionDepth] ? {} : {
  /**
   * Remove the selected node from its parent object.  
   * 
   * **WARNING**: Performing this action has the potential to contradict the type-system. 
   * **Only** use this to remove properties from objects of type `{ [key: string]: any }` and 
   * **not** from objects with a known structure, for example `{ num: number, str: string }`.
   */
  $remove(): void,
  $remove<X extends Payload<any>>(options: X): Future<any>;
}

export type RemoveArrayElement<Depth extends number> = [Depth] extends [MaxRecursionDepth] ? {} : {
  /**
   * Remove the selected element from the array.  
   */
  $remove(): void,
  $remove<X extends Payload<any>>(options: X): Future<any>;
}

export type RemoveArray<Depth extends number> = [Depth] extends [MaxRecursionDepth] ? {} : {
  /**
   * Remove the selected elements from the array.  
   */
  $remove(): void,
  $remove<X extends Payload<any>>(options: X): Future<any>;
}

export interface Clear {
  /**
   * Remove all elements from the selected array.
   */
  $clear(): void,
  $clear<X extends Payload<any>>(options: X): Future<any>;
}

export interface Push<S> {
  /**
   * Push the supplied array element onto the end of the selected array. 
   */
  $push<X extends Payload<S>>(element: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface PatchObject<S> {
  /**
   * Partially update the selected object node with the supplied state.
   */
  $patch<X extends Payload<Partial<S>>>(patch: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface PatchArrayElement<S> {
  /**
   * Partially update the selected array element with the supplied state.
   */
  $patch<X extends Payload<Partial<S>>>(patch: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface PatchArray<S> {
  /**
   * Partially update all the selected array elements with the supplied state.
   */
  $patch<X extends Payload<Partial<S>>>(patch: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface Add {
  /**
   * Add the supplied number onto the selected number.
   */
  $add<X extends Payload<number>>(toAdd: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface Subtract {
  /**
   * Subtract the supplied number from the selected number.
   */
  $subtract<X extends Payload<number>>(subtractBy: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface AddArray {
  /**
   * Add the supplied number onto each of the numbers in the selected array. 
   */
  $add<X extends Payload<number>>(addTo: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface SubtractArray {
  /**
   * Subtract the supplied number from each of the numbers in the selected array. 
   */
  $subtract<X extends Payload<number>>(toSubtract: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface Set<S> {
  /**
   * Replace the selected node with the supplied state.
   */
  $set<X extends Payload<S>>(replacement: X, options?: UpdateOptions<X>): UpdateResult<X>;
}

export interface SetArrayElement<S> {
  /**
   * Replace the selected array element with a new element.
   */
  $set<X extends Payload<S>>(replacement: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface SetArray<S, I extends ImmediateParentIsAFilter> {
  /**
   * Replace the selected elements with the provided array element(s).
   */
  $set<X extends Payload<I extends 'yes' ? S[] : S>>(replacement: X, options: UpdateOptions<X>): UpdateResult<X>;
}

export interface DeepMerge<S> {
  /**
   * Recursively merge the supplied object into the selected node.
   * 
   * **WARNING**: Performing this action has the potential to contradict the type-system.
   */
  $deepMerge: <X extends Payload<DeepMergePayload<S>>>(toMerge: X, options: UpdateOptions<X>) => UpdateResult<X>;
}

export interface DeepMergeArrayElement<S> {
  /**
   * Recursively merge the supplied object into the selected array element.
   */
  $deepMerge: <X extends Payload<DeepMergePayload<S>>>(toMerge: X, options: UpdateOptions<X>) => UpdateResult<X>;
}

export interface DeepMergeArray<S> {
  /**
   * Recursively merge the supplied object into all of the selected array elements.
   */
  $deepMerge: <X extends Payload<DeepMergePayload<S>>>(toMerge: X, options: UpdateOptions<X>) => UpdateResult<X>;
}

export interface InvalidateDerivation {
  /**
   * Ensure that, the next time this derivation is read, it is re-calculated.
   */
  $invalidate(): void,
}

export interface Read<S> {
  /**
   * The current state of the selected node.
   */
  $state: S;
}

export interface OnChange<S> {
  /**
   * Listen to updates made to the selected node.  
   * Please ensure that you unsubscribe once you're done listening for updates.
   * 
   * @example
   * const subscription = select.todos
   *   .$onChange(todos => console.log(`There are now ${todos.length} todos in the store`));
   * 
   * subscription.unsubscribe();
   */
  $onChange(changeListener: (state: S) => any): Unsubscribe;
}

export interface Readable<S> extends Read<S>, OnChange<S> {
}

export interface WithOne<T> {
  /**
   * Repsert with an individual array element.
   */
  $withOne: <X extends Payload<T>>(element: X) => UpdateResult<X>,
}

export interface WithMany<T> {
  /**
   * Repsert with an array of elements.
   */
  $withMany: <X extends Payload<T[]>>(array: X) => UpdateResult<X>,
}

export interface Cache {
  /**
   * Avoid unnecessary promise invocations by supplying the number of milliseconds that should elapse before the promise is invoked again.
   * To un-do this, you can call `$invalidateCache()` on the node of the state tree, for example
   * @example
   * select.todos
   *   .$invalidateCache();
   * @example
   * select.todos
   *   .$find.id.$eq(2)
   *   .$invalidateCache();
   */
  cache?: number;
}

export interface Eager<H> {
  /**
   * Allows you to set an initial value to update the store with.
   * If the promise is rejected, this value will be reverted to what it was before the promise was invoked.
   * @example
   * const newUsername = 'Jeff';
   * select.username
   *   .$set(() => updateUsernameOnApi(newUsername), { eager: newUsername })
   *   .catch(err => notifyUserOfError(err))
   */
  eager?: H extends () => AnyAsync<infer W> ? W : never,
}

export type UpdatableAny<T, F extends FindOrFilter, Q extends QueryStatus, Depth extends number, NewDepth extends number = DecrementRecursion[Depth]> = Rec<
  T extends Array<any>
  ? UpdatableArray<T, F, Q, NewDepth>
  : T extends object
  ? UpdatableObject<T, F, Q, 'yes', NewDepth>
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
  $eq: (equalTo: S) => Response
}

export interface Ne<S, Response> {
  /**
   * Whether the selection is not equal to the supplied value
   */
  $ne: (notEqualTo: S) => Response
}

export interface In<S, Response> {
  /**
   * Whether the selection is within the supplied array
   */
  $in: (within: S[]) => Response
}

export interface Ni<S, Response> {
  /**
   * Whether the selection is not within the supplied array
   */
  $ni: (notWithin: S[]) => Response
}

export interface Gt<S, Response> {
  /**
   * Whether the selection is greater than the supplied value
   */
  $gt: (greaterThan: S) => Response
}

export interface Gte<S, Response> {
  /**
   * Whether the selection is greater than or equal to the supplied value
   */
  $gte: (greaterThanOrEqualTo: S) => Response
}

export interface Lt<S, Response> {
  /**
   * Whether the selection is less than the supplied value
   */
  $lt: (lessThan: S) => Response
}

export interface Lte<S, Response> {
  /**
   * Whether the selection is less than or equal to the supplied value
   */
  $lte: (lessThanOrEqualTo: S) => Response
}

export interface Match<Response> {
  /**
   * Whether the selection matches the supplied regular expression
   */
  $match: (matches: RegExp) => Response
}

export interface DestroyStore {
  /**
   * To be called to remove this store and all its subscriptions.
   */
  $destroyStore: () => void,
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
  type: 'property' | 'search' | 'comparator' | 'action' | 'searchConcat' | 'repsertMatching';
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
  state: FutureState<C>,
}

export interface Augmentations {
  selection: { [name: string]: <C>(selection: Readable<C>) => (...args: any[]) => any },
  future: { [name: string]: <C>(future: Future<C>) => (...args: any[]) => any };
  derivation: { [name: string]: <R>(derivation: Derivation<R>) => (...args: any[]) => any }
  async: <C>(fnReturningFutureAugmentation: () => any) => Promise<C>;
  core: { [prop: string]: <C>(selection: Readable<C>) => any },
}

export interface RxjsObservable<C> {
  subscribe: (subscriber: (val: C) => any) => any,
}

export type AnyAsync<C> = RxjsObservable<C> | Promise<C>;

export interface OptionsForMakingAStore<S> {
  /**
   * The initial state of your store. Can be any serializable object
   */
  state: S,
  /**
   * Supplying a key here will ensure that the store returned is nested under that key in the application store.
   * This is useful if you want to manage component state independently of the rest of the application state.
   * If there is no application store, then this will be ignored.
   */
  key?: string;
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
  limitSearchArgLength?: number;
  /**
   * Limit the length of payloads within the action type.  
   * 
   * For example, by default, the following action type:
   * `todos.set({ one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 })`
   * could be abbreviated to
   * `todos.set({ one: 1, two: 2, three: 3 })`  
   * 
   * Default value is `100`
   */
  limitPayloadArgLength?: number;
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

export interface ReduxDevtoolsOptionsRetroactive extends ReduxDevtoolsOptions {
  /**
   * The name of the store that you want to track
   */
  storeName: string;
}

export interface EnableAsyncActionsArgs {
  stateActions: StateAction[],
  prop: string,
  cache?: number,
  eager?: any,
  arg: any,
}

export interface EnableNestedStoreArgs {
  storeName: string;
  instanceId: string | number;
}

export type Store<S> = (S extends never ? { } : (S extends Array<any> ? UpdatableArray<S, 'isFilter', 'notQueried', MaxRecursionDepth>
  : S extends object ? UpdatableObject<S, 'isFind', 'notArray', 'yes', MaxRecursionDepth>
  : UpdatablePrimitive<S, 'isFind', 'notArray', MaxRecursionDepth>) & DestroyStore);

// do NOT remove. Needed by framework-libraries
export interface StoreAugment<S> { }

export interface ChangeListener {
  actions: StateAction[];
  listener: (arg: any) => any;
  unsubscribe: () => void;
}

export interface NestStoreRef {
  detach(): void,
}

export interface StoreLike<S> extends Read<S>, OnChange<S>, InvalidateCache, Set<S> {
}

export type OlikAction = { type: string, payload?: any };

export type DevtoolsInstance = {
  init: (state: any) => any,
  subscribe: (listener: (message: { type: string, payload: any, state?: any, source: string }) => any) => any,
  unsubscribe: () => any,
  send: (action: OlikAction, state: any, stateReader: (s: any) => any, mutator: string) => any
}

export type OlikDevtoolsExtension = {
  connect: (options?: any) => DevtoolsInstance;
  disconnect: () => any;
  send: (action: { type: string, payload?: any }, state: any, stateReader: (s: any) => any, mutator: string) => any;
}
