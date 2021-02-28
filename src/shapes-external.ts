/**
 * A tag which may need to be supplied when performing a state update
 */
export type Tag<B> = B extends 'tagged' ? string : (string | void);

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

/**
 * A function passing in the current value and returning a new value
 */
export type FunctionReturning<C> = (currentValue: DeepReadonly<C>) => C;

export type PredicateAction<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = X[0] extends object
  ? ArrayOfObjectsAction<X, F, T>
  : ArrayOfElementsAction<X, F, T>;

export type PredicateCustom<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = X[0] extends object
  ? ArrayOfObjectsCommonAction<X, F, T>
  : ArrayOfElementsCommonAction<X, F, T>;

/**
 * Query options common to all datatypes
 */
export type PredicateOptionsCommon<X extends DeepReadonlyArray<any>, E, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Checks whether the previously selected property **equals** the supplied value
   * @example
   * ...
   * .eq(1)
   * ...
   */
  eq: (value: E) => PredicateAction<X, F, T>,
  /**
   * Checks whether the previously selected property does **not equal** the supplied value
   * @example
   * ...
   * .ne(1)
   * ...
   */
  ne: (value: E) => PredicateAction<X, F, T>,
  /**
   * Checks whether the previously selected property **is in** the supplied array
   * @example
   * ...
   * .filter(e => e.id).in([1, 2])
   * ...
   */
  in: (value: E[]) => PredicateAction<X, F, T>,
  /**
   * Checks whether the previously selected property **is not in** the supplied array
   * @example
   * ...
   * .ni([1, 2])
   * ...
   */
  ni: (value: E[]) => PredicateAction<X, F, T>,
}

/**
 * Query options for number
 */
export type PredicateOptionsForNumber<X extends DeepReadonlyArray<any>, E, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Checks whether the previously selected number property **is greater than** the supplied number
   * @example
   * ...
   * .gt(2)
   * ...
   */
  gt: (value: number) => PredicateAction<X, F, T>,
  /**
   * Checks whether the previously selected number property **is greater than or equal to** the supplied number
   * @example
   * ...
   * .gte(2)
   * ...
   */
  gte: (value: number) => PredicateAction<X, F, T>,
  /**
   * Checks whether the previously selected number property **is less than** the supplied number
   * @example
   * ...
   * .lt(2)
   * ...
   */
  lt: (value: number) => PredicateAction<X, F, T>,
  /**
   * Checks whether the previously selected number property **is less than or equal to** the supplied number
   * @example
   * ...
   * .lte(2)
   * ...
   */
  lte: (value: number) => PredicateAction<X, F, T>,
} & PredicateOptionsCommon<X, E, F, T>;

/**
 * Query options for a string
 */
export type PredicateOptionsForString<X extends DeepReadonlyArray<any>, E, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Checks whether the previously selected string property **matches** the supplied regular expression
   * @example
   * ...
   * .match(/^hello/)
   * ...
   */
  match: (pattern: RegExp) => PredicateAction<X, F, T>,
} & PredicateOptionsCommon<X, E, F, T>;

/**
 * Query options
 */
export type Predicate<X extends DeepReadonlyArray<any>, P, F extends FindOrFilter, T extends Trackability> =
  [P] extends [number] ? PredicateOptionsForNumber<X, P, F, T>
  : [P] extends [string] ? PredicateOptionsForString<X, P, F, T>
  : PredicateOptionsCommon<X, P, F, T>;

/**
 * Actions which can be applied to any array
 */
export type ArrayOfElementsAction<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = {
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
} & ArrayOfElementsCommonAction<X, F, T>;

/**
 * Actions which can be applied to an array of objects
 */
export type ArrayOfObjectsAction<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Partially updates array elements allowing you to omit those properties which should not change
   * @example
   * ...
   * .patch({ done: true })
   */
  patch: (replacement: Partial<X[0]>, tag: Tag<T>) => void;
} & ArrayOfElementsAction<X, F, T>;

export type ArrayOfElementsCommonAction<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Replaces the selected element(s)
   * @example
   * ...
   * .replace({ id: 1, text: 'bake cookies' })
   */
  replace: (replacement: X[0], tag: Tag<T>) => void;
  /**
   * Removes any elements that were found in the search clause
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
  onChange: (listener: (state: DeepReadonly<F extends 'find' ? X[0] : X>) => void) => Unsubscribable;
  /**
   * Returns the current value of the selected node.
   */
  read: () => DeepReadonly<F extends 'find' ? X[0] : X>;
}

export type ArrayOfObjectsCommonAction<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Partially updates array elements allowing you to omit those properties which should not change
   * @example
   * ...
   * .patch({ done: true })
   */
  patch: (replacement: Partial<X[0]>, tag: Tag<T>) => void;
} & ArrayOfElementsCommonAction<X, F, T>;

/**
 * An object which is capable of storing and updating state which is in the shape of an array of primitives
 */
export type StoreForAnArray<X extends DeepReadonlyArray<any>, T extends Trackability> = {
  /**
   * Appends one or more elements onto the end of the array
   * @example
   * ...
   * .insert(newTodo);
   * @example
   * ...
   * .insert(newArrayOfTodos);
   */
  insert: <R extends (X[0] | X) >(payload: R, tag: Tag<T>) => void,
  /**
   * Removes all elements from the array
   * @example
   * ...
   * .removeAll();
   */
  removeAll: (tag: Tag<T>) => void,
  /**
   * Substitutes all elements with a new array of elements
   * @example
   * ...
   * .replaceAll(newTodos);
   */
  replaceAll: (replacement: X, tag: Tag<T>) => void,
  /**
   * Get a property which will be used to compare existing array elements wth incoming array elements.
   * We can then chain `replaceElseInsert()` to either replace existing array element(s) or insert new element(s) if they cannot be matched
   * @example
   * ...
   * .match(s => s.id)
   * .replaceElseInsert(elementOrArray)
   * ...
   */
  match: <P>(getProp?: (element: DeepReadonly<X[0]>) => P) => {
    /**
     * Use the previous `match()` function to either replace existing array element(s) or insert new element(s) if they cannot be matched
     * @example
     * ...
     * .replaceElseInsert(elementOrArray)
     */
    replaceElseInsert: (elementOrArray: X[0] | X, tag: Tag<T>) => void,
  }
  /**
   * Specify a where clause to find many elements.
   * @example
   * ```
   * ...
   * .whereMany(t => t.status).eq('done')
   * ...
   * ```
   */
  whereMany: PredicateFunction<X, 'filter', T>,
  /**
   * Specify a where clause to find one element.  
   * @example
   * ...
   * .whereOne(t => t.id).eq(3)
   * ...
   */
  whereOne: PredicateFunction<X, 'find', T>,
  /**
   * Specify a function in order to filter elements. 
   * NOTE: It is advisable to choose the `whereMany()` function over this one because that function will allow the library to describe your actions in more detail.
   * Only use `filter()` when your search criteria is very complicated.
   * @example
   * ...
   * .filter(t => ...some complex criteria returning a boolean...).eq(1)
   * ...
   */
  filter: PredicateFunctionCustom<X, 'filter', T>,
  /**
   * Specify a function in order to filter elements.  
   * NOTE: It is advisable to choose the `whereOne()` function over this one because that function will allow the library to describe your actions in more detail.
   * Only use `find()` when your search criteria is very complicated.
   * @example
   * ...
   * .find(t => ...some complex criteria returning a boolean...).eq(1)
   * ...
   */
  find: PredicateFunctionCustom<X, 'find', T>,
}

/**
 * A function which accepts another function to select a property from an array element
 */
export type PredicateFunction<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = <P = X[0]>(getProp?: (element: DeepReadonly<X[0]>) => P) => Predicate<X, P, F, T>

/**
 * A function which accepts another function to test an array element based on some condition
 */
export type PredicateFunctionCustom<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = (fn: (element: DeepReadonly<X[0]>) => boolean) => PredicateCustom<X, F, T>;

/**
 * An object which is capable of storing and updating state which is in the shape of a primitive
 */
export type StoreForAnObjectOrPrimitive<C extends any, T extends Trackability> = {
  /**
   * Substitutes this primitive value
   * @example
   * select(s => s.user.age).replace(33);
   * @example
   * select(s => s.user.age).replace(age => age + 1);
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
   * ...
   *  .patch({ firstName: 'James', age: 33 })
   */
  patch: (partial: Partial<C>, tag: Tag<T>) => void,
} & StoreForAnObjectOrPrimitive<C, T>;

export type StoreOrDerivation<C> = {
  /**
   * Listens to any updates on this node
   * @returns a subscription which will need to be unsubscribed from to prevent a memory leak
   * 
   * @example
   * const subscription =
   * ...
   * .onChange(todos => console.log(todos));
   * 
   * onComponentDestroyed() {
   *   subscription.unSubscribe();
   * }
   */
  onChange: (callbackFn: (node: DeepReadonly<C>) => any) => Unsubscribable,
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
   * Beware that if this store is marked with `isContainerForNestedStores: true`, then all nested stores will also be removed
   */
  reset: (tag: Tag<T>) => void,
} & StoreOrDerivation<C>;

/**
 * An object which is capable of managing states of various shapes
 */
export type Store<C, T extends Trackability> = ([C] extends undefined ? any :
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
   * Removes this nested store from the store which was marked with `isContainerForNestedStores = true`.
   */
  removeFromContainingStore: () => void;
};

/**
 * A function which selects from the store
 */
export type Selector<S, C, X = C> = X extends C & ReadonlyArray<any> ? (s: S) => X : (s: S) => C;

/**
 * A function which selects from a nested store
 */
export type SelectorFromANestedStore<S> = [S] extends [Array<any>] | [number] | [string] | [boolean]
  ? () => StoreWhichIsNested<S>
  : <C = S>(selector?: (arg: DeepReadonly<S>) => C) => StoreWhichIsNested<C>;

/**
 * A function which selects from a store
 */
export type SelectorFromAStore<S> = [S] extends [Array<any>] | [number] | [string] | [boolean]
  ? () => StoreWhichDoesntEnforceTags<S>
  : <C = S>(selector?: (arg: DeepReadonly<S>) => C) => StoreWhichDoesntEnforceTags<C>;

/**
 * A function which selects from a store which enforces the use of tags when performing a state update
 */
export type SelectorFromAStoreEnforcingTags<S> = [S] extends [Array<any>] | [number] | [string] | [boolean]
  ? () => StoreWhichEnforcesTags<S>
  : <C = S>(selector?: (arg: DeepReadonly<S>) => C) => StoreWhichEnforcesTags<C>;

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
  isContainerForNestedStores?: boolean;
  /**
   * If supplied, this function can transform all tags passed in when updating state.
   * This is of use if, for example, you are using the `__filename` node variable as a tag, and you would like the abbreviate the file path to something more readable.
   * The following example does just that:
   * @example
   * tagSanitizer: tag
   *  .replace(/^.*[\\\/]/, '')   // convert full path to file name
   *  .replace(/.ts/, '')         // remove extension
   */
  tagSanitizer?: (tag: string) => string;
}

/**
 * An object representing options which are supplied when creating a nested store
 */
export type OptionsForMakingANestedStore = {
  /**
   * The name that will distinguish this nested store from others within the state tree
   */
  storeName: string;
  /**
   * The string (or a function returning a string) that will distinguish different instances of the same nested store.
   * If this value isn't supplied, the library will use an auto-incrementing integer as the storeKey
   */
  instanceName?: string | ((previousName?: string) => string);
}

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
   * @example
   * deriveFrom(...)
   *   .onChange(derivation => console.log(derivation)) ;
   */
  onChange: (listener: (value: R) => any) => Unsubscribable,
};
