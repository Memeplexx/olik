export type PredicateAction<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = X[0] extends object
  ? (F extends 'find'
    ? (PatchElement<X[0], T> & DeepMergeElement<X[0], T> & ReplaceObjectElement<X[0], T> & RemoveObjectElement<T> & OnChangeObjectElement<X[0]> & InvalidateCache & Read<X, F> & And<X, F, T> & Or<X, F, T>)
    : (PatchAllElements<X, F, T> & DeepMergeAllElements<X, T> & ReplaceObjectElements<X[0], T> & RemoveAllObjectElements<T> & OnChangeObjectElements<X> & InvalidateCache & Read<X, F> & And<X, F, T> & Or<X, F, T>))
  : (F extends 'find'
    ? (ReplacePrimitiveElement<X[0], T> & RemovePrimitiveElement<T> & OnChangePrimitiveElement<X> & InvalidateCache & Read<X, F> & And<X, F, T> & Or<X, F, T>)
    : (ReplacePrimitiveElements<X[0], T> & RemoveAllPrimitiveElements<T> & OnChangePrimitiveElements<X> & InvalidateCache & Read<X, F> & And<X, F, T> & Or<X, F, T>));

/**
 * Query options
 */
export type Predicate<X extends DeepReadonlyArray<any>, P, F extends FindOrFilter, T extends Trackability> =
  [P] extends [number] ? Gt<X, P, F, T> & Gte<X, P, F, T> & Lt<X, P, F, T> & Lte<X, P, F, T> & Eq<X, P, F, T> & Ne<X, P, F, T> & In<X, P, F, T> & Ni<X, P, F, T>
  : [P] extends [string] ? Gt<X, P, F, T> & Gte<X, P, F, T> & Lt<X, P, F, T> & Lte<X, P, F, T> & Match<X, F, T> & Eq<X, P, F, T> & Ne<X, P, F, T> & In<X, P, F, T> & Ni<X, P, F, T>
  : (Eq<X, P, F, T> & Ne<X, P, F, T> & In<X, P, F, T> & Ni<X, P, F, T>);

/**
 * A function which accepts another function to select a property from an array element
 */
export type PredicateFunctionObject<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = <P>(getProp: (element: DeepReadonly<X[0]>) => P) => Predicate<X, P, F, T>;

/**
 * A function which accepts another function to select a property from an array element
 */
export type PredicateFunctionPrimitive<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = () => Predicate<X, X[0], F, T>;

export interface StoreOrDerivation<C> {
  /**
   * Listens to any updates on this node
   * @returns a subscription which will need to be unsubscribed from to prevent a memory leak
   * 
   * @example
   * const subscription = select(s => s.todos)
   *   .onChange(todos => console.log(todos));
   * 
   * onComponentDestroyed() {
   *   subscription.unSubscribe();
   * }
   */
  onChange: (callbackFn: (node: C) => any) => Unsubscribable,
  /**
   * @returns the current state
   */
  read: () => C,
}

/**
 * An object which is capable of resetting its internal state
 */
export type StoreWhichIsResettable<C, T extends Trackability> = {
  /**
   * Reverts the current state to how it was when the store was initialized.
   * Beware that all component stores will also be removed.
   */
  reset: (options: ActionOptions<T>) => void,
  /**
   * Ensures that fresh data is retrieved the next time any promises are used to populate this node of the state tree.
   */
  invalidateCache: () => void,
} & StoreOrDerivation<C>;

export type StoreWhichAllowsRemoving<T extends Trackability> = {
  /**
   * Removes the selected node from it's parent node.  
   * ***WARNING***: invoking this has the potentional to contradict the type-system.
   * Ideally you should only use this to remove a property from a node with dynamically typed properties, eg `{ [key: string]: any }` and NOT from a node with statically typed properties, eg `{ str: '', num: 0 }`
   * @example
   * const select = createApplicationStore({ skillpoints: {} as {[name: string]: number} });
   * 
   * select(s => s.skillpoints.archery)
   *   .remove()
   */
  remove(asyncRemover: () => AnyAsync<any>, options: ActionOptions<T>): Future<any>;
  remove(options: ActionOptions<T>): void;
}

/**
 * An object which is capable of managing states of various shapes
 */
export type Store<C, T extends Trackability> = ([C] extends undefined ? any :
  [C] extends [DeepReadonlyArray<object>] ? (FilterObjects<[C][0], T> & FindObject<[C][0], T> & InsertOne<C[0], T> & InsertMany<C, T> & RemoveAll<T> & PatchAll<[C][0], T> & ReplaceAll<[C][0], T> & UpsertMatching<[C][0], T>) :
  [C] extends [DeepReadonlyArray<any>] ? (FilterPrimitives<[C][0], T> & FindPrimitive<[C][0], T> & InsertOne<C[0], T> & InsertMany<C, T> & RemoveAll<T> & ReplaceAll<[C][0], T>) :
  [C] extends [number] ? (Replace<C, T> & Increment<T>) :
  [C] extends [object] ? (Patch<C, T> & DeepMerge<C, T> & Replace<C, T>) : Replace<C, T>)
  & StoreWhichIsResettable<C, T>;

/**
 * An object which support state updates which do not require tags
 */
export type StoreWhichDoesntEnforceTags<C> = Store<C, 'untagged'>;

/**
 * An object which support state updates which require tags
 */
export type StoreWhichEnforcesTags<C> = Store<C, 'tagged'>;

/**
 * An object which is capable of managing state for a component
 */
export type StoreForAComponent<C> = Store<C, 'untagged'> & { detachFromApplicationStore: () => void, setInstanceName: (instanceName: string) => void };

/**
 * A function which selects from the store
 */
export type Selector<S, C, X = C> = X extends C & ReadonlyArray<any> ? (s: S) => X : (s: S) => C;

export type SelectorReader<S, U> = { get: U, read: () => DeepReadonly<S> };

export type SelectorReaderComponent<S, U> = SelectorReader<S, U> & { detachFromApplicationStore: () => void, setInstanceName: (instanceName: string) => void };

/**
 * A function which selects from a component store
 */
export type SelectorFromAComponentStore<S> = [S] extends [Array<any>] | [number] | [string] | [boolean]
  ? () => StoreForAComponent<S>
  : <C = DeepReadonly<S>>(selector?: (arg: DeepReadonly<S>) => C) => StoreForAComponent<C> & (C extends S ? {} : StoreWhichAllowsRemoving<'untagged'>);

/**
 * A function which selects from a store
 */
export type SelectorFromAStore<S> = [S] extends [Array<any>] | [number] | [string] | [boolean]
  ? () => StoreWhichDoesntEnforceTags<S>
  : <C = DeepReadonly<S>>(selector?: (arg: DeepReadonly<S>) => C) => StoreWhichDoesntEnforceTags<C> & (C extends S ? {} : StoreWhichAllowsRemoving<'untagged'>);

/**
 * A function which selects from a store which enforces the use of tags when performing a state update
 */
export type SelectorFromAStoreEnforcingTags<S> = [S] extends [Array<any>] | [number] | [string] | [boolean]
  ? () => StoreWhichEnforcesTags<S>
  : <C = DeepReadonly<S>>(selector?: (arg: DeepReadonly<S>) => C) => StoreWhichEnforcesTags<C> & (C extends S ? {} : StoreWhichAllowsRemoving<'tagged'>);

/**
 * An input for a derivation
 */
type DerivationCalculationInput<E> = E extends StoreOrDerivation<infer W> ? W : never;

/**
 * All inputs for a particular derivation
 */
export type DerivationCalculationInputs<T extends Array<StoreOrDerivation<any>>> = {
  [K in keyof T]: DerivationCalculationInput<T[K]>;
}

/**
 * An object representing options which are supplied when creating a standard store
 */
export type OptionsForMakingAnApplicationStore = {
  /**
   * Options for the Redux Devtools extension.
   * @see https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md
   */
  devtools?: any,
  /**
   * Whether or not your action types (as seen from within the Redux Devtools Extension) should include 'tags'.
   * Tags are strings which can be supplied when performing any state update.
   * They are mostly useful in identifying the source of a state update (eg. from which component / file an update was made).
   * Note that if this option is not set to `true`, tags can still be visible within your action payloads.
   * The default value for this property is `true`.
   */
  actionTypesToIncludeTag?: boolean,
  /**
   * As a supplement to the `actionTypesToIncludeTag` argument, this property accepts a function which
   * will allow you to abbreviate your tags so that they do not make your action types too long.
   * This can be particularly useful if you are using the node `__filename` as your tag.
   * 
   * The following example illustrates the problem this property is meant to solve:
   * 
   * ---
   * 
   * Consider the following state update:
   * ```
   * select(s => s.todos).replaceAll(newTodosArray, { tag: __filename });
   * ```
   * By default, the above action type will look like this:
   * ```
   * todos.replaceAll() [src/components/views/todos.ts]
   * ```
   * This is where this `actionTypeTagAbbreviator` becomes useful:
   * ```
   * actionTypeTagAbbreviator: tag => tag
   *   .replace(/^.*[\\\/]/, '')   // convert full path to file name
   *   .replace(/.ts/, '')         // remove extension
   * ```
   * Now your action type will look like this
   * ```
   * todos.replaceAll() [todos]
   * ```
   */
  actionTypeTagAbbreviator?: (tag: string) => string,
  /**
   * The maximum length of variables in your where clause.
   * By default, this library limits the length of variables in your where clause, so
   * ```
   * select(s => s.todos).find(id).eq(d55bd15c-0675-11ec-9a03-0242ac130003).remove()
   * ```
   * will be abbreviated to
   * ```
   * select(s => s.todos).find(id).eq(d55bd1).remove()
   * ```
   * This is done in order to prevent needlessly long action types.
   * You can override the default max length of variables by supplying a number here.
   */
  actionTypeWhereClauseMaxValueLength?: number,
  /**
   * If set to `true`, then this store will replace any existing application store. 
   * If set to `false`, this store will be merged into the existing application store.
   * The default value for this property is `false`.
   */
  replaceExistingStoreIfItExists?: boolean,
  /**
   * Whether or not action stack-traces should be logged to the console.
   * Internally, this makes use of `new Error().stack` to take advantage of sourcemaps
   */
  traceActions?: boolean,
}

export const Deferred = Symbol('deferred');

/**
 * An object representing options which are supplied when creating a component store
 */
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
   * Options for the Redux Devtools extension. Note that this configuration is ignored if your component store was
   * automatically nested inside a pre-existing application store
   * @see https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md
   */
  devtools?: any,
  /**
   * Whether or not action stack-traces should be logged to the console.
   * Internally, this makes use of `new Error().stack` to take advantage of sourcemaps
   */
  traceActions?: boolean,
};

/**
 * An object representing derived state
 */
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
};

export type Augmentations = {
  selection: { [name: string]: <C>(selection: StoreOrDerivation<C>) => (...args: any[]) => any },
  future: { [name: string]: <C>(future: Future<C>) => (...args: any[]) => any };
  derivation: { [name: string]: <R>(derivation: Derivation<R>) => (...args: any[]) => any }
  async: <C>(fnReturningFutureAugmentation: () => any) => Promise<C>;
}

/**
 * Whether updates to the store requires tags or not
 */
export type Trackability = 'tagged' | 'untagged';

/**
 * Whether this predicate is for a filter() or a find()
 */
export type FindOrFilter = 'find' | 'filter';

/**
 * An object which can be unsubscribed from
 */
export interface Unsubscribable {
  /**
   * Unsubscribes from this listener thereby preventing a memory leak.
   */
  unsubscribe: () => any,
}

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
 * Un-does the work done by the DeepReadonly type. In other words, this makes an object wrapped with DeepReadonly mutable.
 */
export type DeepWritable<E> =
  E extends (string | number | boolean) ? E :
  E extends DeepReadonlyArray<infer R> ? Array<R> :
  E extends DeepReadonlyObject<infer R> ? R :
  never;

export interface Async<C> {
}

export type AnyAsync<C> = Async<C> | Promise<C>;

export type ActionOptions<T extends Trackability> = T extends 'untagged' ? (TaggedUpdate<'untagged'> | void) : TaggedUpdate<'tagged'>;

export type UpdateOptions<T extends Trackability, H> = T extends 'untagged' ? (TaggedUpdate<'untagged'> & PromisableUpdate<H> | void) : TaggedUpdate<'tagged'> & PromisableUpdate<H>;

export type InsertOptions<T extends Trackability, H> = UpdateOptions<T, H> & (UpdateAtIndex | void);

export type UpdateAtIndex = {
  /**
   * The index where new elements should be inserted.  
   * The default insertion behavior is that new elements will be appended to the end of the existing array
   */
  atIndex?: number
};

export type PromisableUpdate<H> = H extends () => AnyAsync<any> ? {
  /**
   * Avoid unnecessary promise invocations by supplying the number of milliseconds that should elapse before the promise is invoked again.
   * To un-do this, you can call `invalidateCache()` on the node of the state tree, for example
   * @example
   * select(s => s.todos).invalidateCache();
   * @example
   * select(s => s.todos).find(s => s.id).eq(2).invalidateCache();
   */
  cacheFor?: number;
  /**
   * Allows you to set an initial value to update the store with.
   * If the promise is rejected, this value will be reverted to what it was before the promise was invoked.
   * @example
   * const newUsername = 'Jeff';
   * select(s => s.username)
   *   .replace(() => updateUsernameOnApi(newUsername), { optimisticallyUpdateWith: newUsername })
   *   .catch(err => notifyUserOfError(err))
   */
  optimisticallyUpdateWith?: H extends () => AnyAsync<infer W> ? W : never,
} : {};

export type FutureState<C> = {
  isLoading: boolean,
  wasRejected: boolean,
  wasResolved: boolean,
  error: any,
  storeValue: C,
};

export interface Future<C> extends Promise<C> {
  /**
   * Calls the promise you used to update your state
   */
  asPromise: () => Promise<C>;
  /**
   * Gets the current status for the UI to consume
   */
  getFutureState: () => FutureState<C>,
}

export interface And<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> {
  /**
   * Append more criteria with which to find/filter the array
   * @param getProp a function which selects the array element property to compare
   * @example
   * select(s => s.todos)
   *  .and(e => e.status).eq('todo')
   *  ...
   */
  and: X[0] extends object ? <P>(getProp: (element: DeepReadonly<X[0]>) => P) => Predicate<X, P, F, T> : () => Predicate<X, X[0], F, T>,
}

export interface Or<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> {
  /**
   * Append more criteria with which to find/filter the array
   * @param getProp a function which selects the array element property to compare
   * @example
   * select(s => s.todos)
   *  .or(t => t.status).eq('todo')
   *  ...
   */
  or: X[0] extends object ? <P>(getProp: (element: DeepReadonly<X[0]>) => P) => Predicate<X, P, F, T> : () => Predicate<X, X[0], F, T>,
}

export interface FilterPrimitives<X extends DeepReadonlyArray<any>, T extends Trackability> {
  /**
   * Specify a where clause to find many elements.
   * @example
   * ```
   * select(s => s.todos)
   *  .filter().eq('done')
   *  ...
   * ```
   */
  filter: PredicateFunctionPrimitive<X, 'filter', T>,
}

export interface FindPrimitive<X extends DeepReadonlyArray<any>, T extends Trackability> {
  /**
   * Specify a where clause to find one element.  
   * @example
   * select(s => s.todos)
   *  .find().eq(3)
   *  ...
   */
  find: PredicateFunctionPrimitive<X, 'find', T>,
}

export interface FilterObjects<X extends DeepReadonlyArray<any>, T extends Trackability> {
  /**
   * Specify a where clause to find 0 or more array elements.
   * @example
   * ```
   * select(s => s.todos)
   *   .filter(t => t.status).eq('done')
   *   ...
   * ```
   */
  filter: PredicateFunctionObject<X, 'filter', T>,
}

export interface FindObject<X extends DeepReadonlyArray<any>, T extends Trackability> {
  /**
   * Specify a where clause to find precisely one array element.  
   * @example
   * select(s => s.todos)
   *  .find(t => t.id).eq(3)
   *  ...
   */
  find: PredicateFunctionObject<X, 'find', T>,
}

export interface UpsertMatching<X extends DeepReadonlyArray<any>, T extends Trackability> {
  /**
   * Insert element(s) into the store array (if they do not already exist) or update them (if they do)
   * @example
   * select(s => s.users)
   *  .upsertMatching(s => s.id) // get the property that uniquely identifies each array element
   *  .withOne(element) // pass in an element to be upserted
   * 
   * @example
   * select(s => s.users)
   *  .upsertMatching(s => s.id) // get the property that uniquely identifies each array element
   *  .withMany(element) // pass in the elements to be upserted
   */
  upsertMatching: <P>(getProp: (element: DeepReadonly<X[0]>) => P) => {
    withOne: <H extends (X[0] | (() => AnyAsync<X[0]>)) >(element: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<any>) ? Future<X[0]> : void,
    withMany: <H extends (X | (() => AnyAsync<X>)) >(array: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<any>) ? Future<X> : void,
  };
}

export interface InsertOne<C, T extends Trackability> {
  /**
   * Add one or more elements into the existing array
   * @example
   * select(s => s.todos)
   *  .insert(newTodo);
   * @example
   * select(s => s.todos)
   *  .insert(() => getTodoFromApi())
   * @example
   * select(s => s.todos)
   *  .insert(todo, { atIndex: 5 });
   */
  insertOne: <H extends (C | (() => AnyAsync<C>)) >(insertion: H, options: InsertOptions<T, H>) => H extends (() => AnyAsync<any>) ? Future<C> : void,
}

export interface InsertMany<X extends DeepReadonlyArray<any>, T extends Trackability> {
  /**
   * Add one or more elements into the existing array
   * @example
   * select(s => s.todos)
   *  .insert(newArrayOfTodos);
   * @example
   * select(s => s.todos)
   *  .insert(() => getTodosFromApi())
   * @example
   * select(s => s.todos)
   *  .insert(todos, { atIndex: 5 });
   */
  insertMany: <H extends (X | (() => AnyAsync<X>)) >(insertion: H, options: InsertOptions<T, H>) => H extends (() => AnyAsync<any>) ? Future<X> : void,
}

export interface ReplaceObjectElements<X extends DeepReadonlyArray<any>, T extends Trackability> {
  /**
   * Replaces the selected elements
   * @example
   * select(s => s.todos)
   *  .filter(s => s.status).eq('done')
   *  .replace({ id: 1, text: 'bake cookies' })
   */
  replaceAll: <H extends X[0] | (() => AnyAsync<X[0]>) >(replacement: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<X[0]>) ? Future<X> : void,
}

export interface ReplacePrimitiveElements<X extends DeepReadonlyArray<any>, T extends Trackability> {
  /**
   * Replaces the selected elements
   * @example
   * select(s => s.numbers)
   *  .filter().gt(3)
   *  .replace(0)
   */
  replace: <H extends X[0] | (() => AnyAsync<X[0]>) >(replacement: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<X[0]>) ? Future<X> : void,
}

export interface ReplacePrimitiveElement<C, T extends Trackability> {
  /**
   * Replaces the selected element(s)
   * @example
   * select(s => s.numbers)
   *  .find().eq(3)
   *  .replace(6)
   */
  replace: <H extends C | (() => AnyAsync<C>) >(replacement: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<C>) ? Future<C> : void,
}

export interface ReplaceObjectElement<C, T extends Trackability> {
  /**
   * Replaces the selected element(s)
   * @example
   * select(s => s.todos)
   *  .find(s => s.id).eq(3)
   *  .replace({ id: 1, title: 'bake cookies' })
   */
  replace: <H extends C | (() => AnyAsync<C>) >(replacement: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<C>) ? Future<C> : void,
}

export interface Replace<C, T extends Trackability> {
  /**
   * Substitutes this primitive value
   * @example
   * select(s => s.user.age).replace(33);
   */
  replace: <H extends C | (() => AnyAsync<C>) >(replacement: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<any>) ? Future<C> : void,
}

export interface ReplaceAll<X extends DeepReadonlyArray<any>, T extends Trackability> {
  /**
  * Substitute all existing elements with a new array of elements
  * @example
  * select(s => s.todos)
  *   .replaceAll(newTodos);
  */
  replaceAll: <H extends X | (() => AnyAsync<X>) >(replacement: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<X>) ? Future<X> : void,
}

export interface RemoveObjectElement<T extends Trackability> {
  /**
   * Removes the element that was found in the `find()` clause
   * @example
   * select(s => s.todos)
   *  .find(s => s.id).eq(3)
   *  .remove()
   */
  remove(asyncRemover: () => AnyAsync<any>, options: ActionOptions<T>): Future<any>;
  remove(options: ActionOptions<T>): void;
}

export interface RemovePrimitiveElement<T extends Trackability> {
  /**
   * Removes the element that was found in the `find()` clause
   * @example
   * select(s => s.numbers)
   *  .find().eq(3)
   *  .remove()
   */
  remove(asyncRemover: () => AnyAsync<any>, options: ActionOptions<T>): Future<any>;
  remove(options: ActionOptions<T>): void;
}

export interface RemoveAll<T extends Trackability> {
  /**
  * Removes all elements from the existing array
  * @example
  * select(s => s.todos)
  *  .removeAll();
  */
  removeAll(asyncRemover: () => AnyAsync<any>, options: ActionOptions<T>): Future<any>;
  removeAll(options: ActionOptions<T>): void;
}

export interface RemoveAllObjectElements<T extends Trackability> {
  /**
  * Removes all elements from the existing array
  * @example
  * select(s => s.todos)
  *  .filter(s => s.status).eq('done')
  *  .removeAll();
  */
  removeAll(asyncRemover: () => AnyAsync<any>, options: ActionOptions<T>): Future<any>;
  removeAll(options: ActionOptions<T>): void;
}

export interface RemoveAllPrimitiveElements<T extends Trackability> {
  /**
  * Removes all elements from the existing array
  * @example
  * select(s => s.numbers)
  *  .filter().gt(3)
  *  .removeAll();
  */
  removeAll(asyncRemover: () => AnyAsync<any>, options: ActionOptions<T>): Future<any>;
  removeAll(options: ActionOptions<T>): void;
}

export interface Increment<T extends Trackability> {
  /**
   * Increment the value by the specified amount
   * @example
   * select(s => s.user.age)
   *  .increment(1);
   */
  increment: <H extends number | (() => AnyAsync<number>) >(incrementBy: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<any>) ? Future<number> : void,
}

export interface OnChange<X extends DeepReadonlyArray<any>, F extends FindOrFilter> {
  /**
   * Will be called any time the selected node changes.
   * @example
   * const subscription = select(s => s.todos)
   *  .onChange(value => console.log(value));
   * 
   * // don't forget to unsubscribe to prevent a memory leak
   * subscription.unsubscribe(); 
   */
  onChange: (listener: (state: DeepReadonly<F extends 'find' ? X[0] : X>) => void) => Unsubscribable;
}

export interface OnChangeObjectElements<X extends DeepReadonlyArray<any>> {
  /**
   * Will be called any time the selected node changes.
   * @example
   * const subscription = select(s => s.todos)
   *  .filter(s => s.status).eq('done')
   *  .onChange(value => console.log(value));
   * 
   * // don't forget to unsubscribe to prevent a memory leak
   * subscription.unsubscribe(); 
   */
  onChange: (listener: (state: DeepReadonly<X>) => void) => Unsubscribable;
}

export interface OnChangePrimitiveElements<X extends DeepReadonlyArray<any>> {
  /**
   * Will be called any time the selected node changes.
   * @example
   * const subscription = select(s => s.numbers)
   *  .filter().gt(3)
   *  .onChange(value => console.log(value));
   * 
   * // don't forget to unsubscribe to prevent a memory leak
   * subscription.unsubscribe(); 
   */
  onChange: (listener: (state: DeepReadonly<X>) => void) => Unsubscribable;
}

export interface OnChangeObjectElement<C> {
  /**
   * Will be called any time the selected node changes.
   * @example
   * const subscription = select(s => s.todos)
   *  .find(s => s.id).eq(3)
   *  .onChange(value => console.log(value));
   * 
   * // don't forget to unsubscribe to prevent a memory leak
   * subscription.unsubscribe(); 
   */
  onChange: (listener: (state: DeepReadonly<C>) => void) => Unsubscribable;
}

export interface OnChangePrimitiveElement<C> {
  /**
   * Will be called any time the selected node changes.
   * @example
   * const subscription = select(s => s.numbers)
   *  .find().eq(3)
   *  .onChange(value => console.log(value));
   * 
   * // don't forget to unsubscribe to prevent a memory leak
   * subscription.unsubscribe(); 
   */
  onChange: (listener: (state: DeepReadonly<C>) => void) => Unsubscribable;
}

export interface Read<X extends DeepReadonlyArray<any>, F extends FindOrFilter> {
  /**
   * Returns the current value of the selected node.
   */
  read: () => DeepReadonly<F extends 'find' ? X[0] : X>;
}

export interface InvalidateCache {
  /**
   * Ensures that fresh data is retrieved the next time any promises are used to populate this node of the state tree.
   */
  invalidateCache: () => void,
}

export interface PatchAllElements<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> {
  /**
   * Partially updates each selected array element allowing you to omit those properties which should not change
   * @param patch the partially filled object to be used as a patch
   * @param updateOptions
   * @example
   * select(s => s.todos)
   *  .patch({ done: true })
   */
  patchAll: <H extends Partial<X[0]> | (() => AnyAsync<Partial<X[0]>>) >(patch: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<any>) ? Future<F extends 'find' ? H : H[]> : void,
}

export interface PatchAll<X extends DeepReadonlyArray<any>, T extends Trackability> {
  /**
   * ...
   */
  patchAll: <H extends Partial<X[0]> | (() => AnyAsync<Partial<X[0]>>) >(patch: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<any>) ? Future<H[]> : void,
}

export interface Patch<C, T extends Trackability> {
  /**
   * Partially updates this object
   * @example
   * select(s => s.user)
   *  .patch({ firstName: 'James', age: 33 })
   */
  patch: <H extends (Partial<C> | (() => AnyAsync<Partial<C>>)) >(partial: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<Partial<C>>) ? Future<C> : void,
};

export interface PatchElement<C, T extends Trackability> {
  /**
   * Partially updates this object
   * @example
   * select(s => s.todos)
   *  .find(s => s.id).eq(3)
   *  .patch({ status: 'done', priority: 1 })
   */
  patch: <H extends (Partial<C> | (() => AnyAsync<Partial<C>>)) >(partial: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<Partial<C>>) ? Future<C> : void,
};

export interface DeepMerge<C, T extends Trackability> {
  /**
   * Deep-merges the existing object with the supplied object.
   * This is similar to `patch()` insofar that it partially updates the selected object, but dissimilar to `patch()` insofar as the object passed in may be arbitrarily deep.
   * @example
   * select(s => s.user)
   *  .deepMerge({ lastName: 'Brown', employeeProfile: { company: 'Google' } });
   */
  deepMerge: <K extends Partial<C>, H extends K | (() => AnyAsync<K>) >(state: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<C>) ? Future<C> : void,
};

export interface DeepMergeElement<C, T extends Trackability> {
  /**
   * Deep-merges the selected element with the supplied object.
   * This is similar to `patch()` insofar that it partially updates the selected object, but dissimilar to `patch()` insofar as the object passed in may be arbitrarily deep.
   * @example
   * select(s => s.todos)
   *  .find(s => s.id).eq(3)
   *  .deepMerge({ status: 'done', relatedTodoIds: [1, 2, 3] });
   */
  deepMerge: <K extends Partial<C>, H extends K | (() => AnyAsync<K>) >(state: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<C>) ? Future<C> : void,
};

export interface DeepMergeAllElements<X extends DeepReadonlyArray<any>, T extends Trackability> {
  /**
   * Deep-merges each of the selected elements with the supplied object.
   * This is similar to `patch()` insofar that it partially updates the selected object, but dissimilar to `patch()` insofar as the object passed in may be arbitrarily deep.
   * @example
   * select(s => s.todos)
   *  .filter(s => s.status).eq('done')
   *  .deepMerge({ status: 'todo', relatedTodoIds: [1, 2, 3] });
   */
  deepMerge: <K extends Partial<X>, H extends K | (() => AnyAsync<K>) >(state: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<X>) ? Future<X> : void,
};

export interface Eq<X extends DeepReadonlyArray<any>, P, F extends FindOrFilter, T extends Trackability> {
  /**
   * Searches for array element(s) where the previously selected property **equals** the supplied value
   * @example
   * select(s => s.todos)
   *  .find(s => s.id).eq(1)
   * ...
   */
  eq: (value: P) => PredicateAction<X, F, T>,
}

export interface Ne<X extends DeepReadonlyArray<any>, P, F extends FindOrFilter, T extends Trackability> {
  /**
   * Searches for array element(s) where the previously selected property **does not equal** the supplied value
   * @example
   * select(s => s.todos)
   *  .filter(s => s.priority).ne(1)
   * ...
   */
  ne: (value: P) => PredicateAction<X, F, T>,
}

export interface In<X extends DeepReadonlyArray<any>, P, F extends FindOrFilter, T extends Trackability> {
  /**
   * Searches for array element(s) where the previously selected property **is in** the supplied array
   * @example
   * select(s => s.todos)
   *  .filter(s => s.priority).in([1, 2])
   * ...
   */
  in: (value: P[]) => PredicateAction<X, F, T>,
}

export interface Ni<X extends DeepReadonlyArray<any>, P, F extends FindOrFilter, T extends Trackability> {
  /**
   * Searches for array element(s) where the previously selected property **is not in** the supplied array
   * @example
   * select(s => s.todos)
   *  .filter(s => s.priority).ni([1, 2])
   * ...
   */
  ni: (value: P[]) => PredicateAction<X, F, T>,
}

export interface Gt<X extends DeepReadonlyArray<any>, E, F extends FindOrFilter, T extends Trackability> {
  /**
   * Searches for array element(s) where the previously selected property **is greater than** the supplied value
   * @example
   * select(s => s.todos)
   *  .filter(s => s.priority).gt(2)
   * ...
   */
  gt: (value: E) => PredicateAction<X, F, T>,
}

export interface Gte<X extends DeepReadonlyArray<any>, E, F extends FindOrFilter, T extends Trackability> {
  /**
   * Searches for array element(s) where the previously selected property **is greater than or equal to** the supplied value
   * @example
   * select(s => s.todos)
   *  .filter(s => s.priority).gte(2)
   * ...
   */
  gte: (value: E) => PredicateAction<X, F, T>,
}

export interface Lt<X extends DeepReadonlyArray<any>, E, F extends FindOrFilter, T extends Trackability> {
  /**
   * Searches for array element(s) where the previously selected property **is less than** the supplied value
   * @example
   * select(s => s.todos)
   *  .filter(s => s.priority).lt(2)
   * ...
   */
  lt: (value: E) => PredicateAction<X, F, T>,
}

export interface Lte<X extends DeepReadonlyArray<any>, E, F extends FindOrFilter, T extends Trackability> {
  /**
   * Searches for array element(s) where the previously selected property **is less than or equal to** the supplied value
   * @example
   * select(s => s.todos)
   *  .filter(s => s.priority).lte(2)
   *  ...
   */
  lte: (value: E) => PredicateAction<X, F, T>,
}

export interface Match<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> {
  /**
   * Searches for array element(s) where the previously selected property **matches** the supplied regular expression
   * @param pattern any regular expression
   * @example
   * select(s => s.todos)
   *  .filter(s => s.title).match(/^hello/)
   *  ...
   */
  match: (pattern: RegExp) => PredicateAction<X, F, T>,
}


export type TaggedUpdate<T extends Trackability> = T extends 'untagged' ? {
  /**
   * Any string which may be used to identify the origin of a state update.    
   * 
   * This tag is optional because your store was initialized using `store()` instead of `storeEnforcingTags()`.
   *   
   * If, when initializing your store, you passed `actionTypesToIncludeTag: true` inside the options object, then your tag will appear in the action payload as follows:
   * ```
   * {
   *   type: 'some.value.replace()',
   *   tag: 'YourTag'
   *   ...
   * }
   * ```
   * If, when initializing your store, you did not pass `actionTypesToIncludeTag: true` inside the options object, then your tag will appear as a suffix to the action type, for example:  
   * ```
   * {
   *   type: 'some.value.replace() [YourTag]',
   *   ...
   * }
   * ```
   */
  tag?: string
} : {
  /**
   * Any string which may be used to identify the origin of a state update.  
   * 
   * This tag is required because your store was initialized using `storeEnforcingTags()` instead of `store()`.    
   *   
   * If, when initializing your store, you passed `actionTypesToIncludeTag: true` inside the options object, then your tag will appear in the action payload as follows:
   * ```
   * {
   *   type: 'some.value.replace()',
   *   tag: 'YourTag'
   *   ...
   * }
   * ```
   * If, when initializing your store, you did not pass `actionTypesToIncludeTag: true` inside the options object, then your tag will appear as a suffix to the action type, for example:  
   * ```
   * {
   *   type: 'some.value.replace() [YourTag]',
   *   ...
   * }
   * ```
   */
  tag: string
}


