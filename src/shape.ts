/**
 * The current status of a fetch
 */
export type FetcherStatus = 'pristine' | 'rejected' | 'resolved' | 'resolving';

/**
 * A tag which may need to be supplied when performing a state update
 */
export type Tag<B> = B extends true ? string : void;

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
 * The state of a current fetch
 */
export interface FetchState<S, C, P, B extends boolean> {
  /**
   * The current resolved data, if any.
   */
  data: C;
  /**
   * The current rejection, if any.
   */
  error: any;
  /**
   * The current status. Changes to this value can be observed using onChange() and onChangeOnce().
   */
  status: FetcherStatus;
  /**
   * The store associated with this fetch
   */
  store: Store<C, B>;
  /**
   * The argument that was used in the request (if any)
   */
  fetchArg: FetchArgument<P>;
  /**
   * Clears data from the cache (not the store) so that the next time data it requested, it is also re-fetched
   */
  invalidateCache: () => any;
  /**
   * Takes a function that will be invoked whenever the status changes
   */
  onChange: (listener: (fetch: FetchState<S, C, P, B>) => any) => Unsubscribable;
  /**
   * Returns the underlying promise associated with this fetch
   */
  onChangeOnce: () => Promise<FetchState<S, C, P, B>>;
  /**
   * Takes a function that will be invoked whenever the cache expires
   */
  onCacheExpired: (listener: (fetch: FetchState<S, C, P, B>) => any) => Unsubscribable;
  /**
   * Returns a promise which will resolve when the cache next expires
   */
  onCacheExpiredOnce: () => Promise<FetchState<S, C, P, B>>;
  /**
   * Invalidates the cache (if any data is cached) and re-fetches
   */
  refetch: FetchFunction<S, C, P, B>;
};

/**
 * An object which can be passed in when creating a fetcher
 */
export type OptionsForCreatingAFetcher<C, B extends boolean, X extends (params: any) => Promise<C>> = {
  /**
   * The store that you want this fetcher to read to and write from
   */
  onStore: Store<C, B>,
  /**
   * A function returning a promise to fetch asynchronous data, for example:
   * ```
   * getData: () => fetchThingsFromApi(),
   * ```
   */
  getData: X,
  /**
   * By default, fetchers will simply replace all data associated with a part of the store specified by the `getData` property.
   * However, this behavior can be overridden here. For example, maybe you want to append resolved data to existing store data as follows:
   * ```
   * setData: arg => arg.store.addAfter(arg.data)
   * ```
   */
  setData?: (args: { store: Store<C, B>, data: C, param: Parameters<X>[0], tag?: string }) => any,
  /**
   * How long, in milliseconds, you want the library to cache fetch responses.
   */
  cacheFor?: number,
};

/**
 * A function which fetches data, but takes no argument
 */
export type FetchFunctionTakingNoArg<S, C, P, B extends boolean> = (tag: Tag<B>) => FetchState<S, C, P, B>;

/**
 * A function which fetches data and takes an argument
 */
export type FetchFunctionTakingAnArg<S, C, P, B extends boolean> = (params: FetchArgument<P>, tag: Tag<B>) => FetchState<S, C, P, B>;

/**
 * A function returned when a fetcher is first created. This function can then be invoked when a fetch is needed.
 */
export type FetchFunction<S, C, P, B extends boolean> = P extends void ? FetchFunctionTakingNoArg<S, C, P, B> : FetchFunctionTakingAnArg<S, C, P, B>;

/**
 * An object which is capable of storing and updating state which is in the shape of an array of primitives
 */
type StoreForAnArrayOfPrimitives<C extends DeepReadonlyArray<any>, B extends boolean> = {
  /**
   * Appends an element, or an array of elements, onto the end of the array
   * ```
   * select(s => s.todos)
   *   .addAfter(newTodos);
   * ```
   */
  addAfter: (elements: C[0] | C[0][], tag: Tag<B>) => void,
  /**
   * Prepends an element, or an array of elements, into the beginning of the array
   * ```
   * select(s => s.todos)
   *   .addBefore(newTodos);
   * ```
   */
  addBefore: (elements: C[0] | C[0][], tag: Tag<B>) => void,
  /**
   * Removes all elements from the array
   * ```
   * select(s => s.todos)
   *   .removeAll();
   * ```
   */
  removeAll: (tag: Tag<B>) => void,
  /**
   * Deletes the first element from the array
   * ```
   * select(s => s.todos)
   *   .removeFirst();
   * ```
   */
  removeFirst: (tag: Tag<B>) => void,
  /**
   * Deletes the last element from the array
   * ```
   * select(s => s.todos)
   *   .removeLast();
   * ```
   */
  removeLast: (tag: Tag<B>) => void,
  /**
   * Delete elements which match a specific condition
   * ```
   * select(s => s.todos)
   *   .removeWhere(t => t.status === 'done')
   * ```
   */
  removeWhere: (where: (arg: C[0]) => boolean, tag: Tag<B>) => void,
  /**
   * Substitutes all elements with a new array of elements
   * ```
   * select(s => s.todos)
   *   .replaceAll(newTodos);
   * ```
   */
  replaceAll: (replacement: C, tag: Tag<B>) => void,
  /**
   * Substitute elements which match a specific condition
   * ```
   * select(s => s.todos)
   *   .replaceWhere(t => t.id === 5)
   *   .with({ id: 5, text: 'bake cookies' });
   * ```
   */
  replaceWhere: (where: (element: C[0]) => boolean) => { with: (element: C[0], tag: Tag<B>) => void },
  /**
   * Substitutes or appends an element depending on whether or not it can be found.
   * Note that if more than one element is found which matches the criteria specified in the 'where' clause, an error will be thrown
   * ```
   * select(s => s.todos)
   *   .upsertWhere(t => t.id === 5)
   *   .with({ id: 5, text: 'bake cookies' });
   * ```
   */
  upsertWhere: (where: (element: C[0]) => boolean) => { with: (element: C[0], tag: Tag<B>) => void },
  /**
   * Merges the supplied array into the existing array.  
   * Any supplied elements will either replace their corresponding element in the store (if a match could be found) or else they will be appended to the store array.  
   * ```
   * select(s => s.todos)
   *   .mergeWhere((existingElement, newElement) => existingElement.id === newElement.id)
   *   .with(newTodosArray);
   * ```
   */
  mergeWhere: (where: (existingElement: C[0], newElement: C[0]) => boolean) => { with: (elements: C, tag: Tag<B>) => void },
}

/**
 * An object which is capable of storing and updating state which is in the shape of an array
 */
export type StoreForAnArray<C extends DeepReadonlyArray<any>, B extends boolean> = {
  /**
   * Partially updates zero or more elements which match a specific condition
   * ```
   * select(s => s.todos)
   *   .patchWhere(t => t.status === 'done')
   *   .with({ status: 'todo' });
   * ```
   */
  patchWhere: (where: (element: C[0]) => boolean) => { with: (element: Partial<C[0]>, tag: Tag<B>) => void },
} & StoreForAnArrayOfPrimitives<C, B>;

/**
 * An object which is capable of storing and updating state which is in the shape of a primitive
 */
export type StoreForAPrimitive<C extends any, B extends boolean> = {
  /**
   * Substitutes the primitive value
   * ```
   * select(s => s.user.age)
   *   .replaceWith(33)
   * ```
   */
  replaceWith: (replacement: C, tag: Tag<B>) => void,
}

/**
 * An object which is capable of storing and updating state which is in the shape of an object
 */
export type StoreForAnObject<C extends any, B extends boolean> = {
  /**
   * Partially updates the object
   * ```
   * select(s => s.user)
   *   .patchWith({ firstName: 'James', age: 33 })
   * ```
   */
  patchWith: (partial: Partial<C>, tag: Tag<B>) => void,
} & StoreForAPrimitive<C, B>;

/**
 * An object which is capable of reading from and listening to changes made to a certain piece of state
 */
export type StoreWhichIsReadable<C> = {
  /**
   * Listens to any updates on this node
   * @returns a subscription which will need to be unsubscribed from to prevent a memory leak
   * ```
   * select(s => s.todos)
   *   .onChange(todos => console.log(todos)) ;
   * ```
   */
  onChange: (performAction: (selection: C) => any) => Unsubscribable,
  /**
   * @returns the current state
   */
  read: () => C,
}

/**
 * An object which is capable of resetting its internal state
 */
export type StoreWhichIsResettable<C extends any, B extends boolean> = {
  /**
   * Reverts the current state to how it was when the store was initialized.
   * Beware that if this store is marked as a `containerForNestedStores`, then all nested stores will also be removed
   */
  reset: (tag: Tag<B>) => void,
} & StoreWhichIsReadable<C>;

/**
 * An object which is capable of storing nested stores
 */
export type StoreWhichMayContainNestedStores<S, C, B extends boolean> = StoreForAnObject<C, B> & StoreWhichIsReadable<C> & {
  renew: (state: S) => void;
  reset: () => void;
};

/**
 * An object which is capable of managing states of various shapes
 */
export type Store<C, B extends boolean> = ([C] extends undefined ? any :
    [C] extends DeepReadonlyArray<object[]> ? StoreForAnArray<[C][0], B> :
    [C] extends DeepReadonlyArray<any[]> ? StoreForAnArrayOfPrimitives<[C][0], B> :
    [C] extends [object] ? StoreForAnObject<C, B> : StoreForAPrimitive<C, B>) & StoreWhichIsResettable<C, B>;

/**
 * An object which support state updates which do not require tags
 */
export type StoreWhichDoesntEnforceTags<C> = Store<C, false>;

/**
 * An object which support state updates which require tags
 */
export type StoreWhichEnforcesTags<C> = Store<C, true>;

/**
 * An object which is capable of managing state, but which can also be nested within another store
 */
export type StoreWhichIsNested<C> = Store<C, false> & {
  /**
   * Removes this nested store from the store which was marked as a `containerForNestedStores`.
   */
  removeFromContainingStore: () => void;
};

/**
 * For internal use only.
 */
export type StoreWhichIsNestedInternal<S, C> = Store<C, false> & {
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
type DerivationCalculationInput<E> = E extends StoreWhichIsReadable<infer W> ? W : E extends StoreWhichIsReadable<infer W> ? W : never;

/**
 * All inputs for a particular derivation
 */
export type DerivationCalculationInputs<T extends Array<StoreWhichIsReadable<any>>> = {
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
    export?: boolean | "custom";
    /**
     * import history of actions from a file
     */
    import?: boolean | "custom";
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
   *   .onChange(result => console.log(result)) ;
   * ```
   */
  onChange: (listener: (value: R) => any) => Unsubscribable,
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

