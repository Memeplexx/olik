import { StoreInternal } from "./type-internal";

export type FindOrFilter = 'isFind' | 'isFilter';

export type QueryStatus = 'notQueried' | 'queried' | 'notArray';

export type ImmediateParentIsAnArray = 'yes' | 'no';

export declare const brand: unique symbol;
export type Brand<T, TBrand extends string> = T & { [brand]: TBrand };

export type ThingOrArrayOfThings<T> = T | T[];

export type Primitive = string | number | boolean;

export type BasicRecord = Record<string, unknown>;

export type BasicArray<T = unknown> = Array<T>;

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

export type Store<S> = BaseStore<S> & (S extends never ? unknown : StoreAugment<S>);

export type ValueOf<T> = T[keyof T];

export type MergeMatchingObject<T, S> = { [K in keyof S]: S[K] extends object ? MergeMatchingObject<T, S[K]> : MergeMatchingPrimitive<T> } & With<T>

export type MergeMatchingPrimitive<T> = { $and: { [K in keyof T]: T[K] extends object ? MergeMatchingObject<T, T[K]> : MergeMatchingPrimitive<T> } } & With<T>;

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
  & DeleteNode<Depth>
  & Readable<F extends 'isFilter' ? S[] : S>
  & (Q extends 'notArray'
    ? (SetNewNode & PatchObject<S> & SetNode<S> & PatchDeep<S>)
    : F extends 'isFind' ? PatchArrayElement<S> & SetArrayElement<S> & PatchDeepArrayElement<S>
    : PatchArray<S> & SetArray<S, I> & PatchDeepArray<S>)
  & {
    [K in keyof S]: (S[K] extends ReadonlyArray<unknown>
      ? UpdatableArray<S[K], 'isFilter', 'notQueried', 'no', NewDepth>
      : S[K] extends PossiblyBrandedPrimitive
      ? UpdatablePrimitive<S[K], F, Q, 'no', NewDepth>
      : UpdatableObject<S[K], F, Q, 'no', NewDepth>) & SetObjectKey
  }
  , Depth>

export type UpdatableArray<S extends ReadonlyArray<unknown>, F extends FindOrFilter, Q extends QueryStatus, I extends ImmediateParentIsAnArray, Depth extends number, NewDepth extends number = DecrementRecursion[Depth]> = Rec<
  (& Q extends 'queried'
    ? (
      & Or<S, F, NewDepth>
      & And<S, F, NewDepth>
      & (F extends 'isFind' ? SetArrayElement<S[0]> & DeleteArrayElement<Depth> : DeleteArray<Depth>)
      & (S[0] extends ReadonlyArray<unknown> ? unknown : S[0] extends object ? UpdatableObject<S[0], F, Q, F extends 'isFind' ? 'no' : 'yes', NewDepth> : UpdatablePrimitive<S[0], F, Q, I, NewDepth>)
    ) : (
      & (S[0] extends PossiblyBrandedPrimitive ? SortPrimitive<S[0]> : S[0] extends BasicRecord ? SortObject<S[0]> : unknown)
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
      & OnChangeArray<S>
      & (S[0] extends ReadonlyArray<unknown> ? unknown : S[0] extends PossiblyBrandedPrimitive ? MergePrimitive<S[0]> : MergeMatching<S[0]>)
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
  , Depth>

export type UpdatablePrimitive<S, F extends FindOrFilter, Q extends QueryStatus, I extends ImmediateParentIsAnArray, Depth extends number> =
  & DeleteNode<Depth>
  & (Q extends 'notArray' ? SetNode<S> : F extends 'isFind' ? SetArrayElement<S> : SetArray<S, I>)
  & (S extends number ? (F extends 'isFind' ? Add & Subtract : AddArray & SubtractArray) : unknown)
  & (S extends boolean ? (F extends 'isFind' ? Toggle : ToggleArray) : unknown)
  & Readable<F extends 'isFilter' ? S[] : S>

export type Payload<T> = T | (
  T extends PossiblyBrandedPrimitive ? never :
  T extends ReadonlyArray<infer R> ? ReadonlyArray<Payload<R>> :
  T extends BasicRecord ? DeepReadonlyObject<({ [P in keyof T]: Payload<T[P]> })>
  : never
);

export interface MergeMatching<S> {
  /**
   * Replace element(s) if they already exist or insert them if they don't
   */
  $mergeMatching: { [K in keyof S]: S[K] extends object ? MergeMatchingObject<S, S> : MergeMatchingPrimitive<S> },
}

export interface MergePrimitive<S> {
  /**
   * Replace element(s) if they already exist or insert them if they don't
   */
  $merge: (toMerge: Payload<S | S[]>) => void,
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

/**
 * Unsubscribe from the change listener that was previously added to the selected node.
 */
export type Unsubscribe = () => void;

export interface SetNewNode {
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
  $setNew(insertion: BasicRecord): void;
}

export interface Delete {
  /**
   * Remove the selected node from its parent object.  
   * 
   * **WARNING**: Performing this action has the potential to contradict the type-system. 
   * **Only** use this to remove properties from objects of type `{ [key: string]: any }` and 
   * **not** from objects with a known structure, for example `{ num: number, str: string }`.
   */
  $delete(): void,
}

export type DeleteNode<Depth extends number> = [Depth] extends [MaxRecursionDepth] ? unknown : Delete;

export type DeleteArrayElement<Depth extends number> = [Depth] extends [MaxRecursionDepth] ? unknown : Delete;

export type DeleteArray<Depth extends number> = [Depth] extends [MaxRecursionDepth] ? unknown : Delete;

export interface Clear {
  /**
   * Remove all elements from the selected array.
   */
  $clear(): void,
}

export interface SliceArg {
  start?: number,
  end?: number,
}

export interface Slice {
  /**
   * Functionally similar to the array slice method.
   */
  $slice(arg: SliceArg): void,
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
   * Change the key of the selected node.
   */
  $setKey(key: string): void;
}

export interface PatchObject<S> {
  /**
   * Update the selected object node, using the supplied partial.
   */
  $patch(patch: Payload<Partial<S>>): void;
}

export interface PatchArrayElement<S> {
  /**
   * Partially update the selected array element.
   */
  $patch(patch: Payload<Partial<S>>): void;
}

export interface PatchArray<S> {
  /**
   * Update all the selected array elements, using the supplied partial.
   */
  $patch(patch: Payload<Partial<S>>): void;
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
  $set(replacement: Payload<S>): void;
}

export interface SetArrayElement<S> {
  /**
   * Update the selected array element, by replacing it with the supplied value.
   */
  $set(replacement: Payload<S>): void;
}

export interface SetArray<S, I> {
  /**
   * Update the selected array elements, by replacing each element with the supplied value.
   */
  $set(replacement: Payload<I extends 'yes' ? S[] : S>): void;
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

export type With<T> = {
  /**
   * The element or array of elements to merge
   */
  $with(array: Payload<T | T[]>): void,
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
   * const unsubscribe = select.todos
   *   .$onChange(todos => console.log(`There are now ${todos.length} todos in the store`));
   * 
   * // On done
   * unsubscribe();
   */
  $onChange(changeListener: (state: DeepReadonly<S>, previous: DeepReadonly<S>) => void, options?: { fireImmediately?: boolean }): Unsubscribe;
}

export interface OnChangeArray<S> {
  /**
   * Receive events whenever new array elements are inserted.
   */
  $onInsertElements: (changeListener: (state: DeepReadonly<S>) => void) => Unsubscribe;
  /**
   * Receive events whenever array elements are deleted.
   */
  $onDeleteElements: (changeListener: (state: DeepReadonly<S>) => void) => Unsubscribe;
  /**
   * Receive events whenever existing array elements are updated.
   */
  $onUpdateElements: (changeListener: (state: DeepReadonly<S>) => void) => Unsubscribe;
}

export type SortableProperty = number | string | Date | { [brand]?: string };

export type SortOrder = keyof SortType<BasicRecord>;

export interface SortType<S extends BasicRecord | SortableProperty> {
  $ascending: () => SortMemo<S>;
  $descending: () => SortMemo<S>;
}

export type SortMemo<S extends BasicRecord | SortableProperty> = Read<S[]> & OnChange<S[]> & Destroy;

export interface Destroy {
  /**
   * Unsubscribes from all updates to the store
   */
  $destroy: () => unknown;
}

export interface SortPrimitive<S extends SortableProperty> {
  /**
   * Ensure that the selected array is sorted.
   */
  $memoizeSort: SortType<S>;
}

export interface SortObject<S extends BasicRecord> {
  /**
   * Define a memoized sorted array.
   */
  $memoizeSortBy: { [key in keyof S as S[key] extends (number | string | Date) ? key : never]: SortType<S> };
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
  $contains: (string: string | BaseStore<string>) => Response
}

export interface ContainsIgnoreCase<Response> {
  /**
   * Whether the selection contains the supplied string ignoring case
   */
  $containsIgnoreCase: (string: string | BaseStore<string>) => Response
}

export interface IsContainedIn<Response> {
  /**
   * Whether the supplied string is contains in the selection
   */
  $isContainedIn: (string: string | BaseStore<string>) => Response
}

export interface IsContainedInIgnoreCase<Response> {
  /**
   * Whether the supplied string is contains in the selection ignoring case
   */
  $isContainedInIgnoreCase: (string: string | BaseStore<string>) => Response
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

export interface Augmentations {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selection: { [name: string]: <C>(selection: Readable<C>) => (...args: any[]) => unknown },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  derivation: { [name: string]: <R>(derivation: Derivation<R>) => (...args: any[]) => unknown }
  async: <C>(fnReturningFutureAugmentation: () => Promise<C>) => Promise<C>;
  core: { [prop: string]: <C>(selection: Readable<C>) => unknown },
}

export interface RxjsObservable<C> {
  subscribe: (subscriber: (val: C) => void) => void,
}

export type AnyAsync<C> = RxjsObservable<C> | Promise<C>;

export type BaseStore<S> = UpdatableObject<S, 'isFind', 'notArray', 'no', MaxRecursionDepth>;

// do NOT remove. Needed by framework-libraries
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface StoreAugment<S> { }

export interface ChangeListener {
  actions: StateAction[];
  listeners: Array<(currentState: DeepReadonly<unknown>, previousState: DeepReadonly<unknown>) => unknown>;
  cachedState: unknown,
  path: string,
  unsubscribe: () => void;
}

export interface OlikAction {
  type: string,
  typeOrig?: string,
  payload?: unknown,
  payloadPaths?: Record<string, string>
}

export interface LibState {
  store: undefined | StoreInternal,
  devtools: undefined | { dispatch: (arg: { stateActions: StateAction[], actionType?: string }) => unknown },
  sortModule: undefined | {
    sortObject: ((stateActions: StateAction[], name: SortOrder) => () => SortMemo<BasicRecord>),
    sortPrimitive: ((stateActions: StateAction[], name: SortOrder) => () => SortMemo<string | number | Date | { [brand]?: string }>),
  },
  state: undefined | BasicRecord,
  changeListeners: ChangeListener[],
  insertListeners: ChangeListener[],
  updateListeners: ChangeListener[],
  deleteListeners: ChangeListener[],
  initialState: undefined | BasicRecord,
  disableDevtoolsDispatch?: boolean,
  stacktraceError: null | Error,
  insertedElements: unknown[],
  updatedElements: unknown[],
  deletedElements: unknown[],
}

export interface DevtoolsAction {
  actionType: string;
  source: string;
  stateActions: StateAction[];
  trace?: string;
}

export interface DevtoolsOptions {
  /**
   * A list of paths that should be ignored in the action type list.
   * This should be used when a specific update is done very frequently and you don't want to see it in the devtools.
   * This is done to reduce 'noise' in the devtools in order to improve the debugging experience.
   */
  whitelist: Array<Readable<unknown>>
}
