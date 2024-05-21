import { StoreInternal } from "./type-internal";

export type FindOrFilter = 'isFind' | 'isFilter';

export type QueryStatus = 'notQueried' | 'queried' | 'notArray';

export type ImmediateParentIsAnArray = 'yes' | 'no';

export declare const brand: unique symbol;
export type Brand<T, TBrand extends string> = T & { [brand]: TBrand };

export type ThingOrArrayOfThings<T> = T | T[];

export type Primitive = string | number | boolean;

export type BasicRecord = Record<string, unknown>;

export type BasicArray = Array<unknown>;

export type PossiblyBrandedPrimitive = Primitive & { [brand]?: string };

export type SerializableState = {
  [P: string]: SerializableState | ReadonlyArray<SerializableState | Primitive | null> | Primitive | null;
}

export type PatchDeepPayloadObject<T> = Partial<{
  [P in keyof T]: PatchDeepPayload<T[P]>;
}>;

export type PatchDeepPayload<T> =
  T extends (infer R)[] ? ReadonlyArray<PatchDeepPayload<R>> :
  T extends object ? PatchDeepPayloadObject<T> :
  T;

export type DeepReadonly<T> = T extends Primitive | Date ? T : T extends Array<infer R> ? DeepReadonlyArray<R> : DeepReadonlyObject<T>;
export type DeepReadonlyObject<T> = { readonly [P in keyof T]: DeepReadonly<T[P]>; }
export type DeepReadonlyArray<T> = ReadonlyArray<DeepReadonly<T>>;

export type StoreDef<S> = Store<S> & (S extends never ? unknown : StoreAugment<S>);

export type ValueOf<T> = T[keyof T];

export type RepsertableObject<T, S> = With<T> & { [K in keyof S]: S[K] extends object ? RepsertableObject<T, S[K]> : RepsertablePrimitive<T> }

export interface RepsertablePrimitive<T> extends With<T> {
}

export type DecrementRecursion = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
export type LengthOfTuple<T extends number[]> = T extends { length: infer L } ? L : never;
export type DropFirstInTuple<T extends number[]> = ((...args: T) => unknown) extends (arg0: never, ...rest: infer U) => unknown ? U : T;
export type LastInTuple<T extends number[]> = T[LengthOfTuple<DropFirstInTuple<T>>];
export type MaxRecursionDepth = LastInTuple<DecrementRecursion>;

export type Rec<X, Depth extends number> = {
  done: unknown,
  recur: X
}[Depth extends -1 ? 'done' : 'recur']


export type UpdatableObject<S, F extends FindOrFilter, Q extends QueryStatus, I extends ImmediateParentIsAnArray, Depth extends number, NewDepth extends number = DecrementRecursion[Depth]> = Rec<
  & InvalidateCache
  & DeleteNode<Depth>
  & Readable<F extends 'isFilter' ? S[] : S>
  & (Q extends 'notArray'
    ? (SetNewNode & PatchObject<S> & SetNode<S> & PatchDeep<S>)
    : F extends 'isFind' ? PatchArrayElement<S> & SetArrayElement<S> & PatchDeepArrayElement<S>
    : PatchArray<S> & SetArray<S, I> & PatchDeepArray<S>)
  & ({
    [K in keyof S]: (S[K] extends ReadonlyArray<unknown>
      ? UpdatableArray<S[K], 'isFilter', 'notQueried', 'no', NewDepth>
      : S[K] extends PossiblyBrandedPrimitive
      ? UpdatablePrimitive<S[K], F, Q, 'no', NewDepth>
      : UpdatableObject<S[K], F, Q, 'no', NewDepth>) & SetObjectKey
  })
  , Depth>

export type UpdatableArray<S extends ReadonlyArray<unknown>, F extends FindOrFilter, Q extends QueryStatus, I extends ImmediateParentIsAnArray, Depth extends number, NewDepth extends number = DecrementRecursion[Depth]> = Rec<
  (& Q extends 'queried'
    ? (
      & Or<S, F, NewDepth>
      & And<S, F, NewDepth>
      & (F extends 'isFind' ? SetArrayElement<S[0]> & DeleteArrayElement<Depth> : DeleteArray<Depth>)
      & (S[0] extends ReadonlyArray<unknown> ? unknown : S[0] extends object ? UpdatableObject<S[0], F, Q, F extends 'isFind' ? 'no' : 'yes', NewDepth> : UpdatablePrimitive<S[0], F, Q, I, NewDepth>)
    ) : (
      & DeleteNode<Depth>
      & Clear
      & Slice
      & Push<S[0]>
      & PushMany<S>
      & SetArray<S, I>
      & (S[0] extends boolean ? ToggleArray : unknown)
      & Find<S, NewDepth>
      & Filter<S, NewDepth>
      & At<S, NewDepth>
      & Readable<F extends 'isFilter' ? S : S[0]>
      & (S[0] extends ReadonlyArray<unknown> ? unknown : S[0] extends PossiblyBrandedPrimitive ? MergePrimitive<S[0]> : MergeMatching<S[0]>)
      & (S extends ReadonlyArray<PossiblyBrandedPrimitive> ? SetUnique<S> : unknown)
      & (
        S[0] extends object
        ? (
          & PatchArray<S[0]>
          & { [K in keyof S[0]]:
            (S[0][K] extends ReadonlyArray<unknown>
              ? UpdatableArray<S[0][K], 'isFilter', 'notQueried', 'no', NewDepth>
              : S[0][K] extends PossiblyBrandedPrimitive
              ? UpdatablePrimitive<S[0][K], F, Q, 'no', NewDepth>
              : UpdatableObject<S[0][K], F, Q, 'no', NewDepth>)
          }
        )
        : AddArray
      )
    ))
  & InvalidateCache
  & (S extends ReadonlyArray<PossiblyBrandedPrimitive> ? DeDuplicateArray<S> : unknown)
  , Depth>

export type UpdatablePrimitive<S, F extends FindOrFilter, Q extends QueryStatus, I extends ImmediateParentIsAnArray, Depth extends number> =
  & InvalidateCache
  & DeleteNode<Depth>
  & (Q extends 'notArray' ? SetNode<S> : F extends 'isFind' ? SetArrayElement<S> : SetArray<S, I>)
  & (S extends number ? (F extends 'isFind' ? Add & Subtract : AddArray & SubtractArray) : unknown)
  & (S extends boolean ? (F extends 'isFind' ? Toggle : ToggleArray) : unknown)
  & Readable<F extends 'isFilter' ? S[] : S>

export type PayloadWithPotentialStore<T> = T | Readable<T> | (
  T extends PossiblyBrandedPrimitive ? never :
  T extends ReadonlyArray<infer R> ? ReadonlyArray<PayloadWithPotentialStore<R>> :
  T extends Record<string, unknown> ? DeepReadonlyObject<({ [P in keyof T]: PayloadWithPotentialStore<T[P]> })>
  : never
);

export interface DeDuplicateArray<S> {
  /**
   * Remove duplicates from array
   */
  $deDuplicate: () => S,
}

export interface MergeMatching<S> {
  /**
   * Replace element(s) if they already exist or insert them if they don't
   */
  $mergeMatching: { [K in keyof S]: S[K] extends object ? RepsertableObject<S, S> : RepsertablePrimitive<S> },
}

export interface MergePrimitive<S> {
  /**
   * Replace element(s) if they already exist or insert them if they don't
   */
  $merge: (toMerge: PayloadWithPotentialStore<S | S[]>) => void,
}

export interface Or<S extends ReadonlyArray<unknown>, F extends FindOrFilter, NewDepth extends number> {
  /**
   * Add an additional clause to widen your search
   */
  $or: Comparators<S, S[0], F, NewDepth> & (S[0] extends object ? Searchable<S, S[0], F, NewDepth> : unknown)
}

export interface And<S extends ReadonlyArray<unknown>, F extends FindOrFilter, NewDepth extends number> {
  /**
   * Add an additional clause to narrow your search
   */
  $and: Comparators<S, S[0], F, NewDepth> & (S[0] extends object ? Searchable<S, S[0], F, NewDepth> : unknown)
}

export interface Find<S extends ReadonlyArray<unknown>, NewDepth extends number> {
  /**
   * Find from the selected array
   */
  $find: Comparators<S, S[0], 'isFind', NewDepth> & (S[0] extends object ? Searchable<S, S[0], 'isFind', NewDepth> : unknown)
}

export interface Filter<S extends ReadonlyArray<unknown>, NewDepth extends number> {
  /**
   * Filter the selected array
   */
  $filter: Comparators<S, S[0], 'isFilter', NewDepth> & (S[0] extends object ? Searchable<S, S[0], 'isFilter', NewDepth> : unknown)
}

export interface At<S extends ReadonlyArray<unknown>, NewDepth extends number> {
  /**
   * Get array index
   */
  $at: (index: number) => S[0] extends object ? UpdatableObject<S[0], 'isFind', 'notArray', 'no', NewDepth> : UpdatablePrimitive<S[0], 'isFind', 'notArray', 'no', NewDepth>
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
  $setNew(insertion: Record<string, unknown>): void;
}

export type Delete = {
  /**
   * Remove the selected node from its parent object.  
   * 
   * **WARNING**: Performing this action has the potential to contradict the type-system. 
   * **Only** use this to remove properties from objects of type `{ [key: string]: any }` and 
   * **not** from objects with a known structure, for example `{ num: number, str: string }`.
   */
  $delete(): void,
};

export type DeleteNode<Depth extends number> = [Depth] extends [MaxRecursionDepth] ? unknown : Delete;

export type DeleteArrayElement<Depth extends number> = [Depth] extends [MaxRecursionDepth] ? unknown : Delete;

export type DeleteArray<Depth extends number> = [Depth] extends [MaxRecursionDepth] ? unknown : Delete;

export interface Clear {
  /**
   * Remove all elements from the selected array.
   */
  $clear(): void,
}

export interface Slice {
  /**
   * Functionally similar to the array slice method.
   */
  $slice(arg: { start: number, end?: number }): void,
}

export interface Push<S> {
  /**
   * Update the selected array, pushing the supplied array element.
   */
  $push(element: S): void;
}

export interface PushMany<S> {
  /**
   * Update the selected array, pushing the supplied array elements.
   */
  $pushMany(element: S): void;
}

export interface SetObjectKey {
  /**
   * Update the selected object, by adding the supplied key-value pair.
   */
  $setKey(key: string): void;
}

export interface PatchObject<S> {
  /**
   * Update the selected object node, using the supplied partial.
   */
  $patch(patch: Partial<PayloadWithPotentialStore<S>>): void;
}

export interface PatchArrayElement<S> {
  /**
   * Update the selected array element, using the supplied partial.
   */
  $patch(patch: PayloadWithPotentialStore<Partial<S>>): void;
}

export interface PatchArray<S> {
  /**
   * Update all the selected array elements, using the supplied partial.
   */
  $patch(patch: PayloadWithPotentialStore<Partial<S>>): void;
}

export interface Add {
  /**
   * Update the selected number, by adding the supplied number.
   */
  $add(toAdd: number): void;
}

export interface Subtract {
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
   * Update the selected array, by adding the supplied number to each element.
   */
  $subtract(toSubtract: number): void;
}

export interface SetNode<S> {
  /**
   * Update the selected node, by replacing it with the supplied value.
   */
  $set(replacement: PayloadWithPotentialStore<S>): void;
}

export interface SetArrayElement<S> {
  /**
   * Update the selected array element, by replacing it with the supplied value.
   */
  $set(replacement: PayloadWithPotentialStore<S>): void;
}

export interface SetArray<S, I> {
  /**
   * Update the selected array elements, by replacing each element with the supplied value.
   */
  $set(replacement: PayloadWithPotentialStore<I extends 'yes' ? S[] : S>): void;
}

export interface SetUnique<S extends ReadonlyArray<PossiblyBrandedPrimitive>> {
  /**
   * Set array elements and only unique ones will be kept.
   */
  $setUnique(replacement: PayloadWithPotentialStore<S>): void;
}

export interface PatchDeep<S> {
  /**
   * Update the selected array elements, by recursively merging each element with the supplied value.
   */
  $patchDeep(patch: PatchDeepPayload<S>): void;
}

export interface PatchDeepArrayElement<S> {
  /**
   * Update the selected array element, by recursively merging it with the supplied value.
   */
  $patchDeep(patch: PatchDeepPayload<S>): void;
}

export interface PatchDeepArray<S> {
  /**
   * Update the selected array element2, by recursively merging them with the supplied value.
   */
  $patchDeep(patch: PatchDeepPayload<S>): void;
}

export interface With<T> {
  /**
   * The element or array of elements to merge
   */
  $with(array: PayloadWithPotentialStore<T | T[]>): void,
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
  $state: DeepReadonly<S>;
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
  $onChange(changeListener: (state: DeepReadonly<S>) => void): Unsubscribe;
}

export interface Readable<S> extends Read<S>, OnChange<S> {
}

export type Derivable<S> = Read<S> & (
  {
    $onChange(changeListener: (state: DeepReadonly<S>) => void): Unsubscribe;
  } |
  {
    $onChangeSync(changeListener: (state: DeepReadonly<S>) => void): Unsubscribe;
  }
)

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
  T extends ReadonlyArray<unknown>
  ? UpdatableArray<T, F, Q, 'no', NewDepth>
  : T extends object
  ? UpdatableObject<T, F, Q, 'no', NewDepth>
  : UpdatablePrimitive<T, F, Q, 'no', NewDepth>
  ,
  Depth>

export type Comparators<T, S, F extends FindOrFilter, Depth extends number, NewDepth extends number = DecrementRecursion[Depth], Response = UpdatableAny<T, F, 'queried', NewDepth>> = Rec<
  (
    & Eq<S, Response>
    & Ne<S, Response>
    & In<S, Response>
    & Ni<S, Response>
  ) & (
    S extends boolean ?
    (
      & IsTrue<Response>
      & IsFalse<Response>
    )
    : unknown
  ) & (
    S extends string ?
    (
      & Match<Response>
      & Contains<Response>
      & ContainsIgnoreCase<Response>
      & IsContainedIn<Response>
      & IsContainedInIgnoreCase<Response>
      & IsTruthy<Response>
      & IsFalsy<Response>
    )
    : unknown
  ) & (
    S extends string | number ?
    (
      & Gt<S, Response>
      & Gte<S, Response>
      & Lt<S, Response>
      & Lte<S, Response>
      & IsTruthy<Response>
      & IsFalsy<Response>
    )
    : unknown
  )
  ,
  Depth>

export interface IsTrue<Response> {
  /**
   * Whether the selection is true
   */
  $isTrue: () => Response
}

export interface IsFalse<Response> {
  /**
   * Whether the selection is false
   */
  $isFalse: () => Response
}

export interface IsTruthy<Response> {
  /**
   * Whether the selection is truthy
   */
  $isTruthy: () => Response
}

export interface IsFalsy<Response> {
  /**
   * Whether the selection is falsey
   */
  $isFalsy: () => Response
}

export interface Eq<S, Response> {
  /**
   * Whether the selection is equal to the supplied value
   */
  $eq: (equalTo: S | Readable<S>) => Response
}

export interface Ne<S, Response> {
  /**
   * Whether the selection is not equal to the supplied value
   */
  $ne: (notEqualTo: S | Readable<S>) => Response
}

export interface In<S, Response> {
  /**
   * Whether the selection is within the supplied array
   */
  $in: (within: S[] | Readable<S[]>) => Response
}

export interface Ni<S, Response> {
  /**
   * Whether the selection is not within the supplied array
   */
  $ni: (notWithin: S[] | Readable<S[]>) => Response
}

export interface Gt<S, Response> {
  /**
   * Whether the selection is greater than the supplied value
   */
  $gt: (greaterThan: S | Readable<S>) => Response
}

export interface Gte<S, Response> {
  /**
   * Whether the selection is greater than or equal to the supplied value
   */
  $gte: (greaterThanOrEqualTo: S | Readable<S>) => Response
}

export interface Lt<S, Response> {
  /**
   * Whether the selection is less than the supplied value
   */
  $lt: (lessThan: S | Readable<S>) => Response
}

export interface Lte<S, Response> {
  /**
   * Whether the selection is less than or equal to the supplied value
   */
  $lte: (lessThanOrEqualTo: S | Readable<S>) => Response
}

export interface Match<Response> {
  /**
   * Whether the selection matches the supplied regular expression
   */
  $match: (matches: RegExp) => Response
}

export interface Contains<Response> {
  /**
   * Whether the selection contains the supplied string
   */
  $contains: (string: string | Store<string>) => Response
}

export interface ContainsIgnoreCase<Response> {
  /**
   * Whether the selection contains the supplied string ignoring case
   */
  $containsIgnoreCase: (string: string | Store<string>) => Response
}

export interface IsContainedIn<Response> {
  /**
   * Whether the supplied string is contains in the selection
   */
  $isContainedIn: (string: string | Store<string>) => Response
}

export interface IsContainedInIgnoreCase<Response> {
  /**
   * Whether the supplied string is contains in the selection ignoring case
   */
  $isContainedInIgnoreCase: (string: string | Store<string>) => Response
}

export type Searchable<T, S, F extends FindOrFilter, Depth extends number, NewDepth extends number = DecrementRecursion[Depth]> = Rec<{
  [K in keyof S]: (S[K] extends object
    ? (Searchable<T, S[K], F, NewDepth> & Comparators<T, S[K], F, NewDepth>)
    : Comparators<T, S[K], F, NewDepth>)
}, Depth>

export interface StateAction {
  name: string;
  arg?: unknown;
  searchIndices?: number[];
}

type DerivationCalculationInput<E> = E extends Readable<infer W> ? W : never;

export type DerivationCalculationInputs<T extends ReadonlyArray<Derivable<unknown>>> = {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selection: { [name: string]: <C>(selection: Readable<C>) => (...args: any[]) => unknown },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  future: { [name: string]: <C>(future: Future<C>) => (...args: any[]) => unknown };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  derivation: { [name: string]: <R>(derivation: Derivation<R>) => (...args: any[]) => unknown }
  async: <C>(fnReturningFutureAugmentation: () => Promise<C>) => Promise<C>;
  core: { [prop: string]: <C>(selection: Readable<C>) => unknown },
}

export interface RxjsObservable<C> {
  subscribe: (subscriber: (val: C) => void) => void,
}

export type AnyAsync<C> = RxjsObservable<C> | Promise<C>;

export type AnyAsyncFn<C> = () => AnyAsync<C>;

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

export type Store<S> = S extends never ? unknown : (S extends Array<unknown> ? UpdatableArray<S, 'isFilter', 'notQueried', 'yes', MaxRecursionDepth>
  : S extends object ? UpdatableObject<S, 'isFind', 'notArray', 'no', MaxRecursionDepth>
  : UpdatablePrimitive<S, 'isFind', 'notArray', 'no', MaxRecursionDepth>);

// do NOT remove. Needed by framework-libraries
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface StoreAugment<S> { }

export interface ChangeListener {
  actions: StateAction[];
  listeners: Array<(arg: unknown) => unknown>;
  cachedState: unknown,
  path: string,
  unsubscribe: () => void;
}

export type TraceElement = { functionName: string, fileName: string, lineNumber: number, columnNumber: number }

export type OlikAction = { type: string, typeOrig?: string, payload?: unknown, payloadPaths?: Record<string, string> };

export type DevtoolsInstance = {
  init: (state: unknown) => unknown,
  subscribe: (listener: (message: { type: string, payload: unknown, state?: unknown, source: string }) => unknown) => unknown,
  unsubscribe: () => unknown,
  send: (action: OlikAction, state: unknown, stateReader: (s: unknown) => unknown, mutator: string) => unknown
}

export type LibState = {
  store: undefined | StoreInternal,
  asyncUpdate: undefined | ((stateActions: StateAction[], prop: string, options: { cache?: number, eager?: unknown }, arg: unknown) => unknown),
  devtools: undefined | { dispatch: (arg: { stateActions: StateAction[], actionType?: string, payloadPaths?: Record<string, string> }) => unknown },
  state: undefined | BasicRecord,
  changeListeners: ChangeListener[],
  initialState: undefined | BasicRecord,
  disableDevtoolsDispatch?: boolean,
  derivations: Map<DerivationKey, unknown>,
  stacktraceError: null | Error,
}

export type DerivationKey = { key: string, state: unknown, from?: DerivationKey[] }

export type DevtoolsAction = {
  actionType: string;
  payloadPaths?: Record<string, string>;
  source: string;
  stateActions: StateAction[];
  trace?: string;
}

export type DevtoolsOptions = {
  /**
   * A list of paths that should be ignored in the action type list.
   * This should be used when a specific update is done very frequently and you don't want to see it in the devtools.
   * This is done to reduce 'noise' in the devtools in order to improve the debugging experience.
   */
  whitelist: Array<Readable<unknown>>
}
