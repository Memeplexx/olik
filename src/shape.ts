/**
 * A tag which may need to be supplied when performing a state update
 */
export type Tag<B> = B extends 'tagged' ? string : void;

/**
 * Whether updates to the store requires tags or not
 */
export type Trackability = 'tagged' | 'untagged';

/**
 * Whether this predicate is for a filter() or a find()
 */
export type FindOrFilter = 'find' | 'filter';

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
 * An array which cannot be mutated
 */
export interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> { }

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

export type FunctionReturning<C> = (currentValue: DeepReadonly<C>) => C;

export type ArrayAction<X extends Array<any>, F extends FindOrFilter, T extends Trackability> = X[0] extends object ? ArrayOfObjectsAction<X, F, T> : ArrayOfElementsAction<X, F, T>;

export type ArrayFnAction<X extends Array<any>, F extends FindOrFilter, T extends Trackability> = X[0] extends object ? ArrayOfObjectsFnAction<X, F, T> : ArrayOfElementsFnAction<X, F, T>;

export type BasicPredicate<X extends Array<any>, E, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Checks whether the previously selected property **equals** the supplied value
   * @example
   * ...
   * .eq(1)
   * ...
   */
  eq: (value: E) => ArrayAction<X, F, T>,
  /**
   * Checks whether the previously selected property does **not equal** the supplied value
   * @example
   * ...
   * .ne(1)
   * ...
   */
  ne: (value: E) => ArrayAction<X, F, T>,
  /**
   * Checks whether the previously selected property **is in** the supplied array
   * @example
   * ...
   * .filter(e => e.id).in([1, 2])
   * ...
   */
  in: (value: E[]) => ArrayAction<X, F, T>,
  /**
   * Checks whether the previously selected property **is not in** the supplied array
   * @example
   * ...
   * .ni([1, 2])
   * ...
   */
  ni: (value: E[]) => ArrayAction<X, F, T>,
}

export type NumberPredicate<X extends Array<any>, E, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Checks whether the previously selected number property **is greater than** the supplied number
   * @example
   * ...
   * .gt(2)
   * ...
   */
  gt: (value: number) => ArrayAction<X, F, T>,
  /**
   * Checks whether the previously selected number property **is less than** the supplied number
   * @example
   * ...
   * .lt(2)
   * ...
   */
  lt: (value: number) => ArrayAction<X, F, T>,
} & BasicPredicate<X, E, F, T>;

export type StringPredicate<X extends Array<any>, E, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Checks whether the previously selected string property **matches** the supplied regular expression
   * @example
   * ...
   * .matches(/^hello/)
   * ...
   */
  match: (pattern: RegExp) => ArrayAction<X, F, T>,
} & BasicPredicate<X, E, F, T>;

export type Predicate<X extends Array<any>, E, F extends FindOrFilter, T extends Trackability> =
  [E] extends [number] ? NumberPredicate<X, E, F, T>
  : [E] extends [string] ? StringPredicate<X, E, F, T>
  : BasicPredicate<X, E, F, T>;

export type ArrayOfElementsAction<X extends Array<any>, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Append more criteria with which to filter your array
   * @example
   * ...
   * .and(e => e.status).eq('todo')
   * ...
   */
  and: <P>(getProp: (element: DeepReadonly<X[0]>) => P) => Predicate<X, P, F, T>,
  /**
   * Append more criteria with which to filter your array
   * @example
   * ...
   * .or(t => t.status).eq('todo')
   * ...
   */
  or: <P>(getProp: (element: DeepReadonly<X[0]>) => P) => Predicate<X, P, F, T>,
} & ArrayOfElementsFnAction<X, F, T>;

export type ArrayOfObjectsAction<X extends Array<any>, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Partially updates array elements allowing you to omit those properties which should not change
   * @example
   * ...
   * .patch({ done: true })
   */
  patch: (replacement: Partial<X[0]>, tag: Tag<T>) => void;
} & ArrayOfElementsAction<X, F, T>;

export type ArrayOfElementsFnAction<X extends Array<any>, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Replaces any elements that were found in the `filter()` clause
   * @example
   * ...
   * .replace({ id: 1, text: 'bake cookies' })
   */
  replace: (replacement: X[0], tag: Tag<T>) => void;
  /**
   * Removes any elements that were found in the `filter()` clause
   * @example
   * ...
   * .remove()
   */
  remove: (tag: Tag<T>) => void;
  /**
   * Will be called any time this node changes.
   * @example
   * const subscription = 
   * ...
   * onChange(value => console.log(value));
   * 
   * // don't forget to unsubscribe to avoid a memory leak
   * subscription.unsubscribe(); 
   */
  onChange: (listener: (arg: DeepReadonly<X[0]>) => void) => Unsubscribable;

  read: () => DeepReadonly<F extends 'find' ? X[0] : X>;
}

export type ArrayOfObjectsFnAction<X extends Array<any>, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Partially updates array elements allowing you to omit those properties which should not change
   * @example
   * ...
   * .patch({ done: true })
   */
  patch: (replacement: Partial<X[0]>, tag: Tag<T>) => void;
} & ArrayOfElementsFnAction<X, F, T>;

/**
 * An object which is capable of storing and updating state which is in the shape of an array of primitives
 */
export type StoreForAnArray<C extends Array<any>, T extends Trackability> = {
  /**
   * Appends one or more elements onto the end of the array
   * @example
   * ```
   * ...
   * .insert(newTodo);
   * ```
   * @example
   * ```
   * ...
   * .insert(newArrayOfTodos);
   * ```
   */
  insert: <R extends (C[0] | C) >(payload: R, tag: Tag<T>) => void,
  /**
   * Removes all elements from the array
   * @example
   * ```
   * ...
   * .removeAll();
   * ```
   */
  removeAll: (tag: Tag<T>) => void,
  /**
   * Substitutes all elements with a new array of elements
   * @example
   * ```
   * ...
   * .replaceAll(newTodos);
   * ```
   */
  replaceAll: (replacement: C, tag: Tag<T>) => void,
  /**
   * Merges the supplied array into the existing store array.  
   * The `match` function allows you to select a property which will be used to determine whether each incoming element should replace an existing element, or be inserted.
   * @example
   * ```
   * ...
   * .merge(newTodosArray)
   * .match(e => e.id);
   * ```
   */
  merge: (elementOrArray: C | C[0]) => { match: <P>(getProp: (element: DeepReadonly<C[0]>) => P, tag: Tag<T>) => void }
  /**
   * Specify which array element property to filter by
   * Note that it is advisable to choose this over the `filterCustom` function because using `filter()` will allow the library to describe your actions in more detail
   * @example
   * ```
   * ...
   * .filter(t => t.status).eq('done')
   * ...
   * ```
   */
  filter: PredicateFunction<C, 'filter', T>,
  /**
   * Specify which array element property to find by
   * Note that it is advisable to choose this over the `findCustom` function because using `find()` will allow the library to describe your actions in more detail
   * @example
   * ```
   * ...
   * .filter(t => t.id).eq(3)
   * ...
   * ```
   */
  find: PredicateFunction<C, 'find', T>,
  /**
   * Specify a function in order to filter elements.
   * Note that it is advisable to choose the `filter` function over this one because that function will allow the library to describe your actions in more detail.
   * Only use `filterCustom()` when your filter criteria is very complicated.
   * @example
   * ```
   * ...
   * .filter(t => t.id).eq(1)
   * ...
   * ```
   */
  filterCustom: FilterFunction<C, 'filter', T>,
  /**
   * Specify a function in order to filter elements.
   * Note that it is advisable to choose the `filter` function over this one because that function will allow the library to describe your actions in more detail.
   * Only use `filterCustom()` when your filter criteria is very complicated.
   * @example
   * ```
   * ...
   * .filter(t => t.id).eq(1)
   * ...
   * ```
   */
  findCustom: FilterFunction<C, 'find', T>,
}

export type PredicateFunction<C extends Array<any>, F extends FindOrFilter, T extends Trackability> = <X = C[0]>(getProp?: (element: DeepReadonly<C[0]>) => X) => Predicate<C, X, F, T>

export type FilterFunction<C extends Array<any>, F extends FindOrFilter, T extends Trackability> = (fn: (element: C[0]) => boolean) => ArrayFnAction<C, F, T>;

/**
 * An object which is capable of storing and updating state which is in the shape of a primitive
 */
export type StoreForAnObjectOrPrimitive<C extends any, T extends Trackability> = {
  /**
   * Substitutes this primitive value
   * @example
   * ```
   * get(s => s.user.age).replace(33);
   * ```
   * @example
   * ```
   * get(s => s.user.age).replace(age => age + 1);
   * ```
   */
  replace: (replacement: C | FunctionReturning<C>, tag: Tag<T>) => void,
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
  patch: (partial: Partial<C>, tag: Tag<T>) => void,
} & StoreForAnObjectOrPrimitive<C, T>;

export type StoreOrDerivation<C> = {
  /**
   * Listens to any updates on this node
   * @returns a subscription which will need to be unsubscribed from to prevent a memory leak
   * ```
   * ...
   * .onChange(todos => console.log(todos));
   * ```
   */
  onChange: (performAction: (selection: DeepReadonly<C>) => any) => Unsubscribable,
  /**
   * @returns the current state
   */
  read: () => DeepReadonly<C>,
}

/**
 * An object which is capable of resetting its internal state
 */
export type StoreWhichIsResettable<C extends any, T extends Trackability> = {
  /**
   * Reverts the current state to how it was when the store was initialized.
   * Beware that if this store is marked as a `containerForNestedStores`, then all nested stores will also be removed
   */
  reset: (tag: Tag<T>) => void,
} & StoreOrDerivation<C>;

/**
 * An object which is capable of storing nested stores
 */
export type StoreWhichMayContainNestedStores<S, C, T extends Trackability> = StoreForAnObject<C, T> & StoreOrDerivation<C> & {
  renew: (state: S) => void;
  reset: () => void;
};

/**
 * An object which is capable of managing states of various shapes
 */
export type Store<C, T extends Trackability> = ([C] extends undefined ? any :
  [C] extends Array<any[]> ? StoreForAnArray<[C][0], T> :
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

/**
 * A function which selects from the store
 */
export type Selector<S, C, X = C> = X extends C & ReadonlyArray<any> ? (s: S) => X : (s: S) => C;

/**
 * A function which selects from a nested store
 */
export type SelectorFromANestedStore<S> = (<C = S>(selector?: (arg: DeepReadonly<S>) => C) => StoreWhichIsNested<DeepWritable<C>>);

/**
 * A function which selects from a store
 */
export type SelectorFromAStore<S> = (<C = S>(selector?: (arg: DeepReadonly<S>) => C) => StoreWhichDoesntEnforceTags<DeepWritable<C>>);

/**
 * A function which selects from a store which enforces the use of tags when performing a state update
 */
export type SelectorFromAStoreEnforcingTags<S> = (<C = S>(selector?: (arg: DeepReadonly<S>) => C) => StoreWhichEnforcesTags<DeepWritable<C>>);

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

