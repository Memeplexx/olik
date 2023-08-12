export type FindOrFilter = 'isFind' | 'isFilter';

export type QueryStatus = 'notQueried' | 'queried' | 'notArray';

export type ImmediateParentIsAFilter = 'yes' | 'no';

declare const brand: unique symbol;
export type Brand<T, TBrand extends string> = T & { [brand]: TBrand };

export type ThingOrArrayOfThings<T> = T | T[];

export interface RecursiveRecord {
  [key: string]: ThingOrArrayOfThings<RecursiveRecord | Primitive>;
}

export type Primitive = string | number | boolean;

export type PossiblyBrandedPrimitive = Primitive & { [brand]?: string };

export type Actual = Primitive | Record<string, unknown> | Array<unknown>;

export type PatchDeepPayloadObject<T> = Partial<{
  [P in keyof T]: PatchDeepPayload<T[P]>;
}> /*& { [x: string]: unknown }*/

export type PatchDeepPayload<T> =
  T extends (infer R)[] ? Array<PatchDeepPayload<R>> :
  T extends object ? PatchDeepPayloadObject<T> :
  T;

export type RepsertableObject<T, S> = WithOne<T> & WithMany<T> & { [K in keyof S]: S[K] extends object ? RepsertableObject<T, S[K]> : RepsertablePrimitive<T> }

export interface RepsertablePrimitive<T> extends WithOne<T>, WithMany<T> {
}

type UpdateResult<X> = X extends (() => AnyAsync<infer R>) ? Future<R> : never;

export type DecrementRecursion = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
export type LengthOfTuple<T extends number[]> = T extends { length: infer L } ? L : never;
export type DropFirstInTuple<T extends number[]> = ((...args: T) => unknown) extends (arg0: never, ...rest: infer U) => unknown ? U : T;
export type LastInTuple<T extends number[]> = T[LengthOfTuple<DropFirstInTuple<T>>];
export type MaxRecursionDepth = LastInTuple<DecrementRecursion>;

export type Rec<X, Depth extends number> = {
  done: unknown,
  recur: X
}[Depth extends -1 ? 'done' : 'recur']

export type UpdatableObject<S, F extends FindOrFilter, Q extends QueryStatus, I extends ImmediateParentIsAFilter, Depth extends number, NewDepth extends number = DecrementRecursion[Depth]> = Rec<
  & InvalidateCache
  & DeleteNode<Depth>
  & (Q extends 'notArray' ? SetNewNode : unknown)
  & (Q extends 'notArray' ? PatchObject<S> : F extends 'isFind' ? PatchArrayElement<S> : PatchArray<S>)
  & (Q extends 'notArray' ? Set<S> : F extends 'isFind' ? SetArrayElement<S> : SetArray<S, I>)
  & (Q extends 'notArray' ? PatchDeep<S> : F extends 'isFind' ? PatchDeepArrayElement<S> : PatchDeepArray<S>)
  & Readable<F extends 'isFilter' ? S[] : S>
  & ({
    [K in keyof S]: S[K] extends Array<unknown>
    ? UpdatableArray<S[K], 'isFilter', 'notQueried', NewDepth>
    : S[K] extends PossiblyBrandedPrimitive 
    ? UpdatablePrimitive<S[K], F, Q, NewDepth>
    : UpdatableObject<S[K], F, Q, 'no', NewDepth>
  })
  , Depth>

export type UpdatableArray<S extends Array<unknown>, F extends FindOrFilter, Q extends QueryStatus, Depth extends number, NewDepth extends number = DecrementRecursion[Depth]> = Rec<
  & Q extends 'queried'
  ? (
    & InvalidateCache
    & Or<S, F, NewDepth>
    & And<S, F, NewDepth>
    & (F extends 'isFind' ? SetArrayElement<S[0]> : unknown)
    & (F extends 'isFind' ? DeleteArrayElement<Depth> : DeleteArray<Depth>)
    & (S[0] extends Array<unknown> ? unknown : S[0] extends object ? UpdatableObject<S[0], F, Q, 'yes', NewDepth> : UpdatablePrimitive<S[0], F, Q, NewDepth>)
  ) : (
    & DeleteNode<Depth>
    & InvalidateCache
    & Clear
    & Push<S[0] | S>
    & SetArray<S, 'no'>
    & (S[0] extends boolean ? ToggleArray : unknown)/////
    & Find<S, NewDepth>
    & Filter<S, NewDepth>
    & Readable<F extends 'isFilter' ? S : S[0]>
    & (S[0] extends Array<unknown> ? unknown : S[0] extends object ? MergeMatching<S[0]> : unknown)
    & (
      S[0] extends object
      ? (
        & PatchArray<S[0]>
        & { [K in keyof S[0]]:
          (S[0][K] extends Array<unknown>
            ? UpdatableArray<S[0][K], 'isFilter', 'notQueried', NewDepth>
            : S[0][K] extends PossiblyBrandedPrimitive
            ? UpdatablePrimitive<S[0][K], F, Q, NewDepth>
            : UpdatableObject<S[0][K], F, Q, 'yes', NewDepth>)
        }
      )
      : AddArray
    )
  ), Depth>

export type UpdateOptions<H> = Cache & Eager<H>;

export type UpdatablePrimitive<S, F extends FindOrFilter, Q extends QueryStatus, Depth extends number> =
  & InvalidateCache
  & DeleteNode<Depth>
  & (Q extends 'notArray' ? Set<S> : F extends 'isFind' ? SetArrayElement<S> : SetArray<S, 'no'>)
  & (S extends number ? (F extends 'isFind' ? Add : AddArray) : unknown)
  & (S extends number ? (F extends 'isFind' ? Subtract : SubtractArray) : unknown)
  & (S extends boolean ? (F extends 'isFind' ? Toggle : ToggleArray) : unknown)
  & Readable<F extends 'isFilter' ? S[] : S>

export interface MergeMatching<S> {
  /**
   * Replace element(s) if they already exist or insert them if they don't
   */
  $mergeMatching: { [K in keyof S]: S[K] extends object ? RepsertableObject<S, S> : RepsertablePrimitive<S> },
}

export interface Or<S extends Array<unknown>, F extends FindOrFilter, NewDepth extends number> {
  /**
   * Add an additional clause to widen your search
   */
  $or: Comparators<S, S[0], F, NewDepth> & (S[0] extends object ? Searchable<S, S[0], F, NewDepth> : unknown)
}

export interface And<S extends Array<unknown>, F extends FindOrFilter, NewDepth extends number> {
  /**
   * Add an additional clause to narrow your search
   */
  $and: Comparators<S, S[0], F, NewDepth> & (S[0] extends object ? Searchable<S, S[0], F, NewDepth> : unknown)
}

export interface Find<S extends Array<unknown>, NewDepth extends number> {
  /**
   * Find from the selected array
   */
  $find: Comparators<S, S[0], 'isFind', NewDepth> & (S[0] extends object ? Searchable<S, S[0], 'isFind', NewDepth> : unknown)
}

export interface Filter<S extends Array<unknown>, NewDepth extends number> {
  /**
   * Filter the selected array
   */
  $filter: Comparators<S, S[0], 'isFilter', NewDepth> & (S[0] extends object ? Searchable<S, S[0], 'isFilter', NewDepth> : unknown)
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

export type SetNewNode = {
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
  $setNew(insertion: object, options?: UpdateOptions<typeof insertion>): UpdateResult<typeof insertion>;
  $setNew(insertion: object): void;
}

export type DeleteNode<Depth extends number> = [Depth] extends [MaxRecursionDepth] ? unknown : {
  /**
   * Remove the selected node from its parent object.  
   * 
   * **WARNING**: Performing this action has the potential to contradict the type-system. 
   * **Only** use this to remove properties from objects of type `{ [key: string]: any }` and 
   * **not** from objects with a known structure, for example `{ num: number, str: string }`.
   */
  $delete(): void,
  $delete(fn: AnyAsyncFn<unknown>, options?: UpdateOptions<unknown>): Future<unknown>;
}

export type DeleteArrayElement<Depth extends number> = [Depth] extends [MaxRecursionDepth] ? unknown : {
  /**
   * Remove the selected element from the array.  
   */
  $delete(): void,
  $delete(fn: AnyAsyncFn<unknown>, options?: UpdateOptions<unknown>): Future<unknown>;
}

export type DeleteArray<Depth extends number> = [Depth] extends [MaxRecursionDepth] ? unknown : {
  /**
   * Remove the selected elements from the array.  
   */
  $delete(): void,
  $delete(fn: AnyAsyncFn<unknown>, options?: UpdateOptions<unknown>): Future<unknown>;
}

export interface Clear {
  /**
   * Remove all elements from the selected array.
   */
  $clear(): void,
  $clear(fn: AnyAsyncFn<unknown>, options?: UpdateOptions<unknown>): Future<unknown>;
}

export interface Push<S> {
  /**
   * Update the selected array, pushing the array element returned by the supplied async function.
   */
  $push(element: AnyAsyncFn<S>, options?: UpdateOptions<typeof element>): UpdateResult<typeof element>;
  /**
   * Update the selected array, pushing the supplied array element.
   */
  $push(element: S): void;
}

export interface PatchObject<S> {
  /**
   * Update the selected object node, using the partial returned by the supplied async function.
   */
  $patch(patch: AnyAsyncFn<Partial<S>>, options?: UpdateOptions<typeof patch>): UpdateResult<typeof patch>;
  /**
   * Update the selected object node, using the supplied partial.
   */
  $patch(patch: Partial<S>): void;
}

export interface PatchArrayElement<S> {
  /**
   * Update the selected array element, using the partial returned by the supplied async function.
   */
  $patch(patch: AnyAsyncFn<Partial<S>>, options?: UpdateOptions<typeof patch>): UpdateResult<typeof patch>;
  /**
   * Update the selected array element, using the supplied partial.
   */
  $patch(patch: Partial<S>): void;
}

export interface PatchArray<S> {
  /**
   * Update all the selected array elements, using the partial returned by the supplied async function.
   */
  $patch(patch: AnyAsyncFn<Partial<S>>, options?: UpdateOptions<typeof patch>): UpdateResult<typeof patch>;
  /**
   * Update all the selected array elements, using the supplied partial.
   */
  $patch(patch: Partial<S>): void;
}

export interface Add {
  /**
   * Update the selected number, by adding the number returned by the supplied async function.
   */
  $add(toAdd: AnyAsyncFn<number>, options?: UpdateOptions<typeof toAdd>): UpdateResult<typeof toAdd>;
  /**
   * Update the selected number, by adding the supplied number.
   */
  $add(toAdd: number): void;
}

export interface Subtract {
  /**
   * Update the selected number, by subtracting the number returned by the supplied async function.
   */
  $subtract(toSubtract: AnyAsyncFn<number>, options?: UpdateOptions<typeof toSubtract>): UpdateResult<typeof toSubtract>;
  /**
   * Update the selected number, by subtracting the supplied number.
   */
  $subtract(toSubtract: number): void;
}

export interface Toggle {
  /**
   * Update the selected boolean, by inverting it
   */
  $toggle(): void;
}

export interface AddArray {
  /**
   * Update the selected array, by adding the number returned by the supplied async function to each element.
   */
  $add(addTo: AnyAsyncFn<number>, options?: UpdateOptions<typeof addTo>): UpdateResult<typeof addTo>;
  /**
   * Update the selected array, by adding the supplied number to each element.
   */
  $add(addTo: number): void;
}

export interface ToggleArray {
  /**
   * Update the selected boolean, by inverting it
   */
  $toggle(): void;
}

export interface SubtractArray {
  /**
   * Update the selected array, by adding the number returned by the supplied async function to each element.
   */
  $subtract(toSubtract: AnyAsyncFn<number>, options?: UpdateOptions<typeof toSubtract>): UpdateResult<typeof toSubtract>;
  /**
   * Update the selected array, by adding the supplied number to each element.
   */
  $subtract(toSubtract: number): void;
}

export interface Set<S> {
  /**
   * Update the selected node, by replacing it with the value returned by the supplied async function.
   */
  $set(replacement: AnyAsyncFn<S>, options?: UpdateOptions<typeof replacement>): UpdateResult<typeof replacement>;
  /**
   * Update the selected node, by replacing it with the supplied value.
   */
  $set(replacement: S): void;
}

export interface SetArrayElement<S> {
  /**
   * Update the selected array element, by replacing it with the value returned by the supplied async function.
   */
  $set(replacement: AnyAsyncFn<S>): UpdateResult<typeof replacement>;
  /**
   * Update the selected array element, by replacing it with the supplied value.
   */
  $set(replacement: S): void;
}

export interface SetArray<S, I extends ImmediateParentIsAFilter> {
  /**
   * Update the selected array elements, by replacing it with the elements returned by the supplied async function.
   */
  $set(replacement: AnyAsyncFn<I extends 'yes' ? S[] : S>, options?: UpdateOptions<typeof replacement>): UpdateResult<typeof replacement>;
  /**
   * Update the selected array elements, by replacing each element with the supplied value.
   */
  $set(replacement: I extends 'yes' ? S[] : S): void;
}

export interface PatchDeep<S> {
  /**
   * Update the selected array elements, by recursively merging them with the elements returned by the supplied async function.
   */
  $patchDeep(patch: AnyAsyncFn<PatchDeepPayload<S>>, options?: UpdateOptions<typeof patch>): UpdateResult<typeof patch>;
  /**
   * Update the selected array elements, by recursively merging each element with the supplied value.
   */
  $patchDeep(patch: PatchDeepPayload<S>): void;
}

export interface PatchDeepArrayElement<S> {
  /**
   * Update the selected array element, by recursively merging it with the elements returned by the supplied async function.
   */
  $patchDeep(patch: AnyAsyncFn<PatchDeepPayload<S>>, options?: UpdateOptions<typeof patch>): UpdateResult<typeof patch>;
  /**
   * Update the selected array element, by recursively merging it with the supplied value.
   */
  $patchDeep(patch: PatchDeepPayload<S>): void;
}

export interface PatchDeepArray<S> {
  /**
   * Update the selected array elements, by recursively merging them with the elements returned by the supplied async function.
   */
  $patchDeep(patch: AnyAsyncFn<PatchDeepPayload<S>>, options?: UpdateOptions<typeof patch>): UpdateResult<typeof patch>;
  /**
   * Update the selected array element2, by recursively merging them with the supplied value.
   */
  $patchDeep(patch: PatchDeepPayload<S>): void;
}

export interface WithOne<T> {
  /**
   * Update the selected array element, by replacing or inserting with the elements returned by the supplied async function.
   */
  $withOne(element: AnyAsyncFn<T>, options?: UpdateOptions<T>): UpdateResult<T>;
  /**
   * Update the selected array element, by replacing or inserting with the supplied value.
   */
  $withOne(element: T): void;
}

export interface WithMany<T> {
  /**
   * Repsert with an array of elements.
   */
  $withMany(array: AnyAsyncFn<T[]>): UpdateResult<typeof array>,
  /**
   * Repsert with an array of elements.
   */
  $withMany(array: T[]): void,
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
  $onChange(changeListener: (state: S) => void): Unsubscribe;
}

export interface Readable<S> extends Read<S>, OnChange<S> {
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
  eager?: H extends AnyAsyncFn<infer W> ? W : never,
}

export type UpdatableAny<T, F extends FindOrFilter, Q extends QueryStatus, Depth extends number, NewDepth extends number = DecrementRecursion[Depth]> = Rec<
  T extends Array<unknown>
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
    & Contains<Response>
    : unknown
  ) & (S extends string | number ?
    & Gt<S, Response>
    & Gte<S, Response>
    & Lt<S, Response>
    & Lte<S, Response>
    : unknown
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

export interface Contains<Response> {
  /**
   * Whether the selection contains the supplied regular expression
   */
  $contains: (string: string) => Response
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
  name: string;
  arg?: unknown;
}

type DerivationCalculationInput<E> = E extends Readable<infer W> ? W : never;

export type DerivationCalculationInputs<T extends Array<Readable<unknown>>> = {
  [K in keyof T]: DerivationCalculationInput<T[K]>;
}

export interface Derivation<R> extends Read<R>, OnChange<R>, InvalidateDerivation {
}

export interface FutureState<C> {
  isLoading: boolean,
  wasRejected: boolean,
  wasResolved: boolean,
  error: unknown,
  storeValue: C,
}

export interface Future<C> extends Promise<C> {
  /**
   * Gets the current status for the UI to consume
   */
  state: FutureState<C>,
}

export interface Augmentations {
  selection: { [name: string]: <C>(selection: Readable<C>) => (args: Actual[]) => unknown },
  future: { [name: string]: <C>(future: Future<C>) => (args: Actual[]) => unknown };
  derivation: { [name: string]: <R>(derivation: Derivation<R>) => (args: Actual[]) => unknown }
  async: <C>(fnReturningFutureAugmentation: () => Promise<C>) => Promise<C>;
  core: { [prop: string]: <C>(selection: Readable<C>) => unknown },
}

export interface RxjsObservable<C> {
  subscribe: (subscriber: (val: C) => void) => void,
}

export type AnyAsync<C> = RxjsObservable<C> | Promise<C>;

export type AnyAsyncFn<C> = () => AnyAsync<C>;

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

export interface ReduxDevtoolsOptions {
  /**
   * Whether or not to display the 'trace' tab in the devtools.
   * Set this to false for production builds because it negatively impacts performance.
   */
  traceActions?: boolean;
  /**
   * Limit the length of search args so because to prevent very long action types.  
   * 
   * For example, by default, the following action type:
   * `todos.find.id.eq(c985ab52-6645-11ec-90d6-0242ac120003).delete()`
   * will be abbreviated to
   * `todos.find.id.eq(c985ab).delete()`  
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
  eager?: unknown,
  arg: unknown,
}

export interface EnableNestedStoreArgs {
  storeName: string;
  instanceId: string | number;
}

export type Store<S> = (S extends never ? unknown : (S extends Array<unknown> ? UpdatableArray<S, 'isFilter', 'notQueried', MaxRecursionDepth>
  : S extends object ? UpdatableObject<S, 'isFind', 'notArray', 'yes', MaxRecursionDepth>
  : UpdatablePrimitive<S, 'isFind', 'notArray', MaxRecursionDepth>) & DestroyStore);

// do NOT remove. Needed by framework-libraries
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface StoreAugment<S> { }

export interface ChangeListener {
  actions: StateAction[];
  listener: (arg: unknown) => unknown;
  unsubscribe: () => void;
}

export interface NestStoreRef {
  detach(): void,
}

export type TraceElement = { functionName: string, fileName: string, lineNumber: number, columnNumber: number }

export type OlikAction = { type: string, payload?: unknown };

export type DevtoolsInstance = {
  init: (state: unknown) => unknown,
  subscribe: (listener: (message: { type: string, payload: unknown, state?: unknown, source: string }) => unknown) => unknown,
  unsubscribe: () => unknown,
  send: (action: OlikAction, state: unknown, stateReader: (s: unknown) => unknown, mutator: string) => unknown
}

export type OlikDevtoolsExtension = {
  connect: (options?: unknown) => DevtoolsInstance;
  disconnect: () => unknown;
  send: (action: { type: string, payload?: unknown }, state: unknown, stateReader: (s: unknown) => unknown, mutator: string) => unknown;
}

export type OlikDevtoolsOptions = {
  trace?: boolean
}
