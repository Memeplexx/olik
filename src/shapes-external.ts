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

export type PredicateAction<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = X[0] extends object
  ? ArrayOfObjectsAction<X, F, T>
  : ArrayOfElementsAction<X, F, T>;

export type PredicateCustom<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = X[0] extends object
  ? ArrayOfObjectsCommonAction<X, F, T>
  : ArrayOfElementsCommonAction<X, F, T>;

/**
 * Query options common to all datatypes
 */
export type PredicateOptionsCommon<X extends DeepReadonlyArray<any>, P, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Checks whether the previously selected property **equals** the supplied value
   * @example
   * ...
   * .eq(1)
   * ...
   */
  eq: (value: P) => PredicateAction<X, F, T>,
  /**
   * Checks whether the previously selected property does **not equal** the supplied value
   * @example
   * ...
   * .ne(1)
   * ...
   */
  ne: (value: P) => PredicateAction<X, F, T>,
  /**
   * Checks whether the previously selected property **is in** the supplied array
   * @example
   * ...
   * .filter(e => e.id).in([1, 2])
   * ...
   */
  in: (value: P[]) => PredicateAction<X, F, T>,
  /**
   * Checks whether the previously selected property **is not in** the supplied array
   * @example
   * ...
   * .ni([1, 2])
   * ...
   */
  ni: (value: P[]) => PredicateAction<X, F, T>,
}

/**
 * Query options for boolean
 */
export type PredicateOptionsForBoolean<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Checks whether the previously supplied function returns true.
   * It is advised to only use this if your filtering criteria is too complicated to express using the operators supplied by this library.
   * Using this function will mean that useful information will not show up in the devtools
   * @example
   * ...
   * .returnsTrue()
   * ...
   */
  returnsTrue: () => PredicateCustom<X, F, T>,
} & PredicateOptionsCommon<X, boolean, F, T>;

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
  [P] extends [boolean] ? PredicateOptionsForBoolean<X, F, T>
  : [P] extends [number] ? PredicateOptionsForNumber<X, P, F, T>
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
  and: X[0] extends object ? <P>(getProp: (element: DeepReadonly<X[0]>) => P) => Predicate<X, P, F, T> : () => Predicate<X, X[0], F, T>,
  /**
   * Append more criteria with which to filter your array
   * @example
   * ...
   * .or(t => t.status).eq('todo')
   * ...
   */
  or: X[0] extends object ? <P>(getProp: (element: DeepReadonly<X[0]>) => P) => Predicate<X, P, F, T> : () => Predicate<X, X[0], F, T>,

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
  patch: <H extends Partial<X[0]> | (() => Promise<Partial<X[0]>>) >(replacement: H, tag: UpdateOptions<T, X[0], H>) => H extends (() => Promise<any>) ? Promise<void> : void,
} & ArrayOfElementsAction<X, F, T>;

export type ArrayOfElementsCommonAction<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Replaces the selected element(s)
   * @example
   * ...
   * .replace({ id: 1, text: 'bake cookies' })
   */
  replace: <H extends X[0] | (() => Promise<X[0]>) >(replacement: H, tag: UpdateOptions<T, X[0], H>) => H extends (() => Promise<X[0]>) ? Promise<void> : void,
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
  /**
   * Ensures that all promiseBypassTTLs related to this node of the state tree are marked with the current time.
   * This will guarantee that fresh data is retrieved the next time promises are called to populate this node of the state tree.
   */
  invalidateCache: () => void,
}

export type ArrayOfObjectsCommonAction<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Partially updates array elements allowing you to omit those properties which should not change
   * @example
   * ...
   * .patch({ done: true })
   */
  patch: <H extends Partial<X[0]> | (() => Promise<Partial<X[0]>>) >(replacement: H, tag: UpdateOptions<T, X[0], H>) => H extends (() => Promise<any>) ? Promise<void> : void,
} & ArrayOfElementsCommonAction<X, F, T>;

export type UpdateOptionsInternal = {
  /**
   * Avoid unnecessary promise invocations by supplying this object
   */
  bypassPromise?: {
    /**
     * How many milliseconds should elapse before the promise is invoked again.
     */
    for: number,
    /**
     * An additional set of keys to uniquely identify a promise
     */
    keys?: (string | number | boolean)[],
  },
}

export type UpdateOptions<T extends Trackability, P, A> = (Tag<T> | (A extends P ? Tag<T> : UpdateOptionsInternal & (T extends 'untagged' ? { tag?: Tag<T> } : { tag: Tag<T> })))

/**
 * An object which is capable of storing and updating state which is in the shape of an array of primitives
 */
export type StoreForAnArrayCommon<X extends DeepReadonlyArray<any>, T extends Trackability> = {
  /**
   * Appends one or more elements onto the end of the array
   * @example
   * ...
   * .insert(newTodo);
   * @example
   * ...
   * .insert(newArrayOfTodos);
   * @example
   * ...
   * .insert(() => getTodosFromApi())
   */
  insert: <H extends (X | X[0] | (() => Promise<X | X[0]>)) >(insertion: H, options: UpdateOptions<T, X[0] | X, H>) => H extends (() => Promise<any>) ? Promise<void> : void,
  /**
   * Removes all elements from the array
   * @example
   * ...
   * .removeAll();
   */
  removeAll: (tag: Tag<T>) => void,
  /**
   * Substitute all elements with a new array of elements
   * @example
   * ...
   * .replaceAll(newTodos);
   */
  replaceAll: <H extends X | (() => Promise<X>) >(replacement: H, options: UpdateOptions<T, X, H>) => H extends (() => Promise<X>) ? Promise<void> : void,
}

/**
 * An object which is capable of storing and updating state which is in the shape of an array of primitives
 */
export type StoreForAnArrayOfPrimitives<X extends DeepReadonlyArray<any>, T extends Trackability> = {
  /**
   * Specify a where clause to find many elements.
   * @example
   * ```
   * ...
   * .filterWhere(t => t.status).eq('done')
   * ...
   * ```
   */
  filterWhere: PredicateFunctionPrimitive<X, 'filter', T>,
  /**
   * Specify a where clause to find one element.  
   * @example
   * ...
   * .findWhere(t => t.id).eq(3)
   * ...
   */
  findWhere: PredicateFunctionPrimitive<X, 'find', T>,
} & StoreForAnArrayCommon<X, T>;

export type StoreForAnArrayOfObjects<X extends DeepReadonlyArray<any>, T extends Trackability> = {
  /**
   * Insert element(s) into the store array (if they do not already exist) or update them (if they do)
   * @example
   * ...
   * .upsertMatching(s => s.id) // get the property that uniquely identifies each array element
   * .with(elementOrArrayOfElements) // pass in an element or array of elements to be upserted
   * ...
   */
  upsertMatching: <P>(getProp: (element: DeepReadonly<X[0]>) => P) => {
    with: <H extends X | (X[0] | X | (() => Promise<X | X[0]>)) >(elementOrArray: H, options: UpdateOptions<T, X[0] | X, H>) => H extends (() => Promise<any>) ? Promise<void> : void,
  }
  /**
   * Specify a where clause to find many elements.
   * @example
   * ```
   * ...
   * .filterWhere(t => t.status).eq('done')
   * ...
   * ```
   */
  filterWhere: PredicateFunctionObject<X, 'filter', T>,
  /**
   * Specify a where clause to find one element.  
   * @example
   * ...
   * .findWhere(t => t.id).eq(3)
   * ...
   */
  findWhere: PredicateFunctionObject<X, 'find', T>,
} & StoreForAnArrayCommon<X, T>;

/**
 * A function which accepts another function to select a property from an array element
 */
export type PredicateFunctionObject<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = <P>(getProp: (element: DeepReadonly<X[0]>) => P) => Predicate<X, P, F, T>;

/**
 * A function which accepts another function to select a property from an array element
 */
export type PredicateFunctionPrimitive<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = () => Predicate<X, X[0], F, T>;

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
  replace: <H extends C | (() => Promise<C>) >(replacement: H, tag: UpdateOptions<T, C, H>) => H extends (() => Promise<any>) ? Promise<void> : void,
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
  patch: <H extends (Partial<C> | (() => Promise<Partial<C>>)) >(partial: H, tag: UpdateOptions<T, C, H>) => H extends (() => Promise<Partial<C>>) ? Promise<void> : void,
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
  read: () => C,
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
  /**
   * Ensures that all promiseBypassTTLs related to this node of the state tree are marked with the current time.
   * This will guarantee that fresh data is retrieved the next time promises are called to populate this node of the state tree.
   */
  invalidateCache: () => void,
} & StoreOrDerivation<C>;

/**
 * An object which is capable of managing states of various shapes
 */
export type Store<C, T extends Trackability> = ([C] extends undefined ? any :
  [C] extends [DeepReadonlyArray<object>] ? StoreForAnArrayOfObjects<[C][0], T> :
  [C] extends [DeepReadonlyArray<any>] ? StoreForAnArrayOfPrimitives<[C][0], T> :
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
  : <C = DeepReadonly<S>>(selector?: (arg: DeepReadonly<S>) => C) => StoreWhichIsNested<C>;

/**
 * A function which selects from a store
 */
export type SelectorFromAStore<S> = [S] extends [Array<any>] | [number] | [string] | [boolean]
  ? () => StoreWhichDoesntEnforceTags<S>
  : <C = DeepReadonly<S>>(selector?: (arg: DeepReadonly<S>) => C) => StoreWhichDoesntEnforceTags<C>;

/**
 * A function which selects from a store which enforces the use of tags when performing a state update
 */
export type SelectorFromAStoreEnforcingTags<S> = [S] extends [Array<any>] | [number] | [string] | [boolean]
  ? () => StoreWhichEnforcesTags<S>
  : <C = DeepReadonly<S>>(selector?: (arg: DeepReadonly<S>) => C) => StoreWhichEnforcesTags<C>;

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
   * Specifications for the Redux Devtools Extension. Pass `false` if you do not want your store to be tracked within the Redux Devtools extension.
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
   * Pass `true` if you do not want your store to be tracked inside the devtools. Default is false.
   */
  dontTrackWithDevtools?: boolean,
  /**
   * The name that will distinguish this nested store from others within the state tree
   */
  storeName: string;
  /**
   * The string that will distinguish different instances of the same nested store.
   * If this value isn't supplied, the library will use an auto-incrementing integer as the storeKey
   */
  instanceName?: string;
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
