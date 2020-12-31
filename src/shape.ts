/**
 * A tag which may need to be supplied when performing a state update
 */
export type Tag<B> = B extends 'tagged' ? string : void;

/**
 * Whether updates to the store requires tags or not
 */
export type Trackability = 'tagged' | 'untagged';

/**
 * An argument which can be supplied when fetching data
 */
export type FetchArgument<T> = T extends infer T ? T : void;

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
 * An object or an array which cannot be mutated
 */
export type DeepReadonly<T> =
  T extends (infer R)[] ? DeepReadonlyArray<R> :
  T extends object ? DeepReadonlyObject<T> :
  T;

/**
 * An array which cannot be mutated
 */
interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> { }

/**
 * An object which cannot be mutated
 */
export type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

/**
 * A container for a promise as well as its cache duration
 */
export type CachedPromise<C> = {
  /**
   * A function accepting zero or more arguments, and returning a promise
   */
  promise: (...args: any[]) => Promise<C>,
  /**
   * An array of arguments
   */
  args?: any[],
  /**
   * How long, in milliseconds the cached data should be retained
   */
  ttl: number,
};
export type CachedPromiseDescriptor<C, X extends (...args: any[]) => Promise<C>> = Parameters<X>[0] extends undefined ?
  { ttl: (num: number) => CachedPromiseNoArgs<C, X> } :
  { args: (...params: Parameters<X>) => { ttl: (num: number) => CachedPromiseWithArgs<C, X> } };

/**
 * Represents an action payload which may either be a primitive, a. object, a function returning a promise, or a CachedPromise
 */
export type LiteralOrPromiseReturning<C> = C | (() => Promise<C>) | CachedPromise<C>;

/**
 * The result of an update action where the argument was a PayloadOrPrimitive
 */
export type LiteralOrPromiseReturningResult<R, C> = R extends (CachedPromise<C> | (() => Promise<C>)) ? Promise<DeepReadonly<C>> : void;

/**
 * An object which is capable of storing and updating state which is in the shape of an array of primitives
 */
export type StoreForAnArray<C extends DeepReadonlyArray<any>, T extends Trackability> = {
  /**
   * Appends any number of elements onto the end of the array
   * @example
   * ```
   * get(s => s.todos).addAfter(newTodos);
   * ```
   */
  addAfter: <R extends LiteralOrPromiseReturning<C[0] | C>>(payload: R, tag: Tag<T>) => LiteralOrPromiseReturningResult<R, C[0] | C>,
  /**
   * Prepends  any number of elements onto the beginning of the array
   * @example
   * ```
   * get(s => s.todos).addBefore(newTodos);
   * ```
   */
  addBefore: <R extends LiteralOrPromiseReturning<C[0] | C>>(payload: R, tag: Tag<T>) => LiteralOrPromiseReturningResult<R, C[0] | C>,
  /**
   * Removes all elements from the array
   * @example
   * ```
   * get(s => s.todos).removeAll();
   * ```
   */
  removeAll: (tag: Tag<T>) => void,
  /**
   * Deletes the first element from the array
   * @example
   * ```
   * get(s => s.todos).removeFirst();
   * ```
   */
  removeFirst: (tag: Tag<T>) => void,
  /**
   * Deletes the last element from the array
   * @example
   * ```
   * get(s => s.todos).removeLast();
   * ```
   */
  removeLast: (tag: Tag<T>) => void,
  /**
   * Delete elements which match a specific condition
   * @example
   * ```
   * get(s => s.todos).removeWhere(t => t.status === 'done')
   * ```
   */
  removeWhere: (where: (arrayElement: C[0]) => boolean, tag: Tag<T>) => void,
  /**
   * Substitutes all elements with a new array of elements
   * @example
   * ```
   * get(s => s.todos).replaceAll(newTodos);
   * ```
   */
  replaceAll: <R extends LiteralOrPromiseReturning<C>>(replacement: R, tag: Tag<T>) => LiteralOrPromiseReturningResult<R, C>,
  /**
   * Substitute elements which match a specific condition
   * @example
   * ```
   * get(s => s.todos)
   *   .replaceWhere(t => t.id === 5)
   *   .with({ id: 5, text: 'bake cookies' });
   * ```
   */
  replaceWhere: (where: (arrayElement: C[0]) => boolean) => { with: <R extends LiteralOrPromiseReturning<C[0]>>(element: R, tag: Tag<T>) => LiteralOrPromiseReturningResult<R, C[0]> },
  /**
   * Substitutes or appends an element depending on whether or not it can be found.
   * Note that if more than one element is found which matches the criteria specified in the 'where' clause, an error will be thrown
   * @example
   * ```
   * get(s => s.todos)
   *   .upsertWhere(t => t.id === 5)
   *   .with({ id: 5, text: 'bake cookies' });
   * ```
   */
  upsertWhere: (where: (arrayElement: C[0]) => boolean) => { with: <R extends LiteralOrPromiseReturning<C[0]>>(element: R, tag: Tag<T>) => LiteralOrPromiseReturningResult<R, C[0]> },
  /**
   * Merges the supplied array into the existing array.  
   * Any supplied elements will either replace their corresponding element in the store (if a match could be found) or else they will be appended to the store array.  
   * @example
   * ```
   * get(s => s.todos)
   *   .mergeWhere((currEl, newEl) => currEl.id === newEl.id)
   *   .with(newTodosArray);
   * ```
   */
  mergeWhere: (where: (existingArrayElement: C[0], newArrayElement: C[0]) => boolean) => { with: <R extends LiteralOrPromiseReturning<C>>(elements: R, tag: Tag<T>) => LiteralOrPromiseReturningResult<R, C> },
}

/**
 * An object which is capable of storing and updating state which is in the shape of an array
 */
export type StoreForAnArrayOfObjects<C extends DeepReadonlyArray<any>, T extends Trackability> = {
  /**
   * Partially updates zero or more elements which match a specific condition
   * @example
   * ```
   * get(s => s.todos)
   *   .patchWhere(t => t.status === 'done')
   *   .with({ status: 'todo' });
   * ```
   */
  patchWhere: (where: (arrayElement: C[0]) => boolean) => { with: <R extends LiteralOrPromiseReturning<Partial<C[0]>>>(element: R, tag: Tag<T>) => LiteralOrPromiseReturningResult<R, Partial<C[0]>> },
} & StoreForAnArray<C, T>;

/**
 * An object which is capable of storing and updating state which is in the shape of a primitive
 */
export type StoreForAnObjectOrPrimitive<C extends any, T extends Trackability> = {
  /**
   * Substitutes this primitive value
   * @example
   * ```
   * get(s => s.user.age).replace(33)
   * ```
   * @example
   * ```
   * get(s => s.user.age).replace(() => fetchUserAgeAsPromise())
   * ```
   */
  replace: <R extends LiteralOrPromiseReturning<C>>(replacement: R, tag: Tag<T>) => LiteralOrPromiseReturningResult<R, C>,
}

/**
 * An object which is capable of storing and updating state which is in the shape of an object
 */
export type StoreForAnObject<C extends any, T extends Trackability> = {
  /**
   * Partially updates this object
   * @example
   * ```
   * get(s => s.user).patch({ firstName: 'James', age: 33 })
   * ```
   */
  patch: <R extends LiteralOrPromiseReturning<Partial<C>>>(partial: R, tag: Tag<T>) => LiteralOrPromiseReturningResult<R, Partial<C>>,
} & StoreForAnObjectOrPrimitive<C, T>;

/**
 * An object which is capable of reading from and listening to changes made to a certain piece of state
 */
export type StoreWhichIsReadableAndCacheable<C> = {
  /**
   * @returns the current state
   */
  readInitial: () => DeepReadonly<C>,
  /**
   * Invalidates all caches on this node and any descendants of this node.
   */
  invalidateCache: () => void,
  /**
   * If there is a cache associated with this node, then the function you supply here will be invoked whenever that cache expires.
   * Note that this will not be triggered if invalidateCache() is manually called.
   */
  onCacheExpired: (listener: () => any) => Unsubscribable,
} & StoreOrDerivation<C>;

export type StoreOrDerivation<C> = {
  /**
   * Listens to any updates on this node
   * @returns a subscription which will need to be unsubscribed from to prevent a memory leak
   * ```
   * get(s => s.todos).onChange(todos => console.log(todos)) ;
   * ```
   */
  onChange: (performAction: (selection: DeepReadonly<C>) => any) => Unsubscribable,
  /**
   * @returns the current state
   */
  read: () => DeepReadonly<C>,
}

/**
 * A container for a function returning promise and a ttl
 */
export type CachedPromiseNoArgs<C, X extends (...args: any[]) => Promise<C>> = { promise: X, ttl: number };

/**
 * A container for a function accepting 1 or more arguments returning promise and a ttl
 */
export type CachedPromiseWithArgs<C, X extends (...args: any[]) => Promise<C>> = { promise: X, ttl: number, args: Parameters<X> }

/**
 * An object which is capable of resetting its internal state
 */
export type StoreWhichIsResettable<C extends any, T extends Trackability> = {
  /**
   * Reverts the current state to how it was when the store was initialized.
   * Beware that if this store is marked as a `containerForNestedStores`, then all nested stores will also be removed
   */
  reset: (tag: Tag<T>) => void,
} & StoreWhichIsReadableAndCacheable<C>;

/**
 * An object which is capable of storing nested stores
 */
export type StoreWhichMayContainNestedStores<S, C, T extends Trackability> = StoreForAnObject<C, T> & StoreWhichIsReadableAndCacheable<C> & {
  renew: (state: S) => void;
  reset: () => void;
};

/**
 * An object which is capable of managing states of various shapes
 */
export type Store<C, T extends Trackability> = ([C] extends undefined ? any :
  [C] extends DeepReadonlyArray<object[]> ? StoreForAnArrayOfObjects<[C][0], T> :
  [C] extends DeepReadonlyArray<any[]> ? StoreForAnArray<[C][0], T> :
  [C] extends [object] ? StoreForAnObject<C, T> : StoreForAnObjectOrPrimitive<C, T>)
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
 * An object which is capable of managing state, but which can also be nested within another store
 */
export type StoreWhichIsNested<C> = Store<C, 'untagged'> & {
  /**
   * Removes this nested store from the store which was marked as a `containerForNestedStores`.
   */
  removeFromContainingStore: () => void;
};

/**
 * For internal use only.
 */
export type StoreWhichIsNestedInternal<S, C> = Store<C, 'untagged'> & {
  defineReset: (initState: S) => () => any;
  defineRemoveFromContainingStore: (name: string, key: string) => () => any;
  defineRemoveNestedStore: (name: string, key: string) => () => any;
} & StoreWhichIsNested<C>;

export type SimpleObject = { [key: string]: any };

export type Selector<S, C, X = C> = X extends C & ReadonlyArray<any> ? (s: S) => X : (s: S) => C;

/**
 * A function which selects from a nested store
 */
export type SelectorFromANestedStore<S> = (<C = S>(selector?: (arg: DeepReadonly<S>) => C) => StoreWhichIsNested<C>);

/**
 * A function which selects from a store
 */
export type SelectorFromAStore<S> = (<C = S>(selector?: (arg: DeepReadonly<S>) => C) => StoreWhichDoesntEnforceTags<C>);

/**
 * A function which selects from a store which enforces the use of tags when performing a state update
 */
export type SelectorFromAStoreEnforcingTags<S> = (<C = S>(selector?: (arg: DeepReadonly<S>) => C) => StoreWhichEnforcesTags<C>);

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

export type OptionsForMakingAStore = {
  /**
   * Specifications for the Redux Devtools Extension. Pass 'false' if you do not want your store to be tracked within the Redux Devtools extension.
   * See https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md for more info
   */
  devtools?: OptionsForReduxDevtools | false;
  /**
   * Setting this to true will mean that any stores which are subsequently created using `makeNested()` will automatically be nested within this store.
   * Those nested stores will then be visible within the Redux Devtools extension.
   */
  containerForNestedStores?: boolean;
}

export type OptionsForMakingAStoreEnforcingTags = {
  /**
   * If supplied, this function can transform all tags passed in when updating state.
   * This is of use if, for example, you are using the __filename node variable as a tag, and you would like the abbreviate the file path to something more readable.
   */
  tagSanitizer?: (tag: string) => string;
} & OptionsForMakingAStore;

/**
 * An object representing options which the Redux Ddevtools extension accepts
 */
export type OptionsForReduxDevtools = {
  /**
   * the instance name to be showed on the monitor page. Default value is `document.title`.
   * If not specified and there's no document title, it will consist of `tabId` and `instanceId`.
   */
  name?: string;
  /**
   * If you want to restrict the extension, specify the features you allow.
   * If not specified, all of the features are enabled. When set as an object, only those included as `true` will be allowed.
   * Note that except `true`/`false`, `import` and `export` can be set as `custom` (which is by default for Redux enhancer), meaning that the importing/exporting occurs on the client-side.
   * Otherwise, you'll get/set the data right from the monitor part.
   */
  features?: {
    /**
     * start/pause recording of dispatched actions
     */
    pause?: boolean;
    /**
     * persist states on page reloading
     */
    persist?: boolean;
    /**
     * export history of actions in a file
     */
    export?: boolean | 'custom';
    /**
     * import history of actions from a file
     */
    import?: boolean | 'custom';
    /**
     * jump back and forth (time traveling
     */
    jump?: boolean;
    /**
     * skip (cancel) actions
     */
    skip?: boolean;
    /**
     * dispatch custom actions or action creators
     */
    dispatch?: boolean;
  };
}

/**
 * An object representing derived state
 */
export type Derivation<R> = {
  /**
   * The current value of the derivation
   */
  read: () => R,
  /**
   * Listens to any updates on this derivation
   * @returns a subscription which will need to be unsubscribed from to prevent a memory leak
   * ```
   * deriveFrom(...)
   *   .onChange(derivation => console.log(derivation)) ;
   * ```
   */
  onChange: (listener: (value: DeepReadonly<R>) => any) => Unsubscribable,
};

export type WindowAugmentedWithReduxDevtools = {
  __REDUX_DEVTOOLS_EXTENSION__: {
    connect: (options: OptionsForReduxDevtools) => {
      init: (state: any) => any,
      subscribe: (listener: (message: { type: string, payload: any, state?: any, source: string }) => any) => any,
      unsubscribe: () => any,
      send: (action: { type: string }, state: any) => any
    };
    disconnect: () => any;
    send: (action: { type: string, payload?: any }, state: any, options: OptionsForReduxDevtools) => any;
    _mockInvokeSubscription: (message: { type: string, payload: any, state?: any, source: any }) => any,
    _subscribers: Array<(message: { type: string, payload: any, state?: any, source: any }) => any>,
  }
}

