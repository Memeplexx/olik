/**
 * Whether updates to the store requires tags or not
 */
export type Trackability = 'tagged' | 'untagged';

/**
 * Whether this predicate is for a filterWhere() or a findWhere()
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
   * Searches for array element(s) where the previously selected property **equals** the supplied value
   * @example
   * ...
   * .eq(1)
   * ...
   */
  eq: (value: P) => PredicateAction<X, F, T>,
  /**
   * Searches for array element(s) where the previously selected property **does not equal** the supplied value
   * @example
   * ...
   * .ne(1)
   * ...
   */
  ne: (value: P) => PredicateAction<X, F, T>,
  /**
   * Searches for array element(s) where the previously selected property **is in** the supplied array
   * @example
   * ...
   * in([1, 2])
   * ...
   */
  in: (value: P[]) => PredicateAction<X, F, T>,
  /**
   * Searches for array element(s) where the previously selected property **is not in** the supplied array
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
   * Searches for array element(s) where the previously selected property **is greater than** the supplied value
   * @example
   * ...
   * .gt(2)
   * ...
   */
  gt: (value: E) => PredicateAction<X, F, T>,
  /**
   * Searches for array element(s) where the previously selected property **is greater than or equal to** the supplied value
   * @example
   * ...
   * .gte(2)
   * ...
   */
  gte: (value: E) => PredicateAction<X, F, T>,
  /**
   * Searches for array element(s) where the previously selected property **is less than** the supplied value
   * @example
   * ...
   * .lt(2)
   * ...
   */
  lt: (value: E) => PredicateAction<X, F, T>,
  /**
   * Searches for array element(s) where the previously selected property **is less than or equal to** the supplied value
   * @example
   * ...
   * .lte(2)
   * ...
   */
  lte: (value: E) => PredicateAction<X, F, T>,
} & PredicateOptionsCommon<X, E, F, T>;

/**
 * Query options for a string
 */
export type PredicateOptionsForString<X extends DeepReadonlyArray<any>, E, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Searches for array element(s) where the previously selected property **matches** the supplied regular expression
   * @param pattern any regular expression
   * @example
   * ...
   * .matches(/^hello/)
   * ...
   */
  matches: (pattern: RegExp) => PredicateAction<X, F, T>,
} & PredicateOptionsForNumber<X, E, F, T>;

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
   * Append more criteria with which to find/filter the array
   * @param getProp a function which selects the array element property to compare
   * @example
   * ...
   * .and(e => e.status).isEqualTo('todo')
   * ...
   */
  andWhere: X[0] extends object ? <P>(getProp: (element: DeepReadonly<X[0]>) => P) => Predicate<X, P, F, T> : () => Predicate<X, X[0], F, T>,
  /**
   * Append more criteria with which to find/filter the array
   * @param getProp a function which selects the array element property to compare
   * @example
   * ...
   * .or(t => t.status).isEqualTo('todo')
   * ...
   */
  orWhere: X[0] extends object ? <P>(getProp: (element: DeepReadonly<X[0]>) => P) => Predicate<X, P, F, T> : () => Predicate<X, X[0], F, T>,
} & ArrayOfElementsCommonAction<X, F, T>;

/**
 * Actions which can be applied to an array of objects
 */
export type ArrayOfObjectsAction<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Partially updates each selected array element allowing you to omit those properties which should not change
   * @param patch the partially filled object to be used as a patch
   * @param updateOptions
   * @example
   * ...
   * .patch({ done: true })
   */
  patch: <H extends Partial<X[0]> | (() => AnyAsync<Partial<X[0]>>) >(patch: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<any>) ? Future<F extends 'find' ? H : H[]> : void,
  // get: <P>(getProp: (element: X[0]) => P) => Store<P, T>,
} & ArrayOfElementsAction<X, F, T>;

export interface ArrayOfElementsCommonAction<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> {
  /**
   * Replaces the selected element(s)
   * @example
   * ...
   * .replace({ id: 1, text: 'bake cookies' })
   */
  replace: <H extends X[0] | (() => AnyAsync<X[0]>) >(replacement: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<X[0]>) ? Future<F extends 'find' ? X[0] : X> : void,
  /**
   * Removes any elements that were found in the search clause
   * @example
   * ...
   * .remove()
   */
  remove(asyncRemover: () => AnyAsync<any>, options: ActionOptions<T>): Future<any>;
  remove(options: ActionOptions<T>): void;
  /**
   * Will be called any time the selected node changes.
   * @example
   * const subscription = 
   * ...
   * onChange(value => console.log(value));
   * 
   * // don't forget to unsubscribe to prevent a memory leak
   * subscription.unsubscribe(); 
   */
  onChange: (listener: (state: DeepReadonly<F extends 'find' ? X[0] : X>) => void) => Unsubscribable;
  /**
   * Returns the current value of the selected node.
   */
  read: () => DeepReadonly<F extends 'find' ? X[0] : X>;
  /**
   * Ensures that fresh data is retrieved the next time any promises are used to populate this node of the state tree (or child nodes of this node of the state tree).
   */
  stopBypassingPromises: () => void,
}

export type ArrayOfObjectsCommonAction<X extends DeepReadonlyArray<any>, F extends FindOrFilter, T extends Trackability> = {
  /**
   * Partially updates array elements allowing you to omit those properties which should not change
   * @example
   * ...
   * .patch({ done: true })
   */
  patch: <H extends Partial<X[0]> | (() => AnyAsync<Partial<X[0]>>) >(replacement: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<any>) ? Future<void> : void,
} & ArrayOfElementsCommonAction<X, F, T>;

export type TaggedUpdate<T extends Trackability> = T extends 'untagged' ? {
  /**
   * Any string which may be used to identify the origin of a state update.    
   * 
   * This tag is optional because your store was initialized using `store()` instead of `storeEnforcingTags()`.
   *   
   * If, when initializing your store, you did **not** pass `tagsToAppearInType: true` inside the options object, then your tag will appear in the action payload as follows:
   * ```
   * {
   *   type: 'some.value.replace()',
   *   tag: 'YourTag'
   *   ...
   * }
   * ```
   * If, when initializing your store, you passed `tagsToAppearInType: true` inside the options object, then your tag will appear as a suffix to the action type, for example:  
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
   * If, when initializing your store, you did **not** pass `tagsToAppearInType: true` inside the options object, then your tag will appear in the action payload as follows:
   * ```
   * {
   *   type: 'some.value.replace()',
   *   tag: 'YourTag'
   *   ...
   * }
   * ```
   * If, when initializing your store, you passed `tagsToAppearInType: true` inside the options object, then your tag will appear as a suffix to the action type, for example:  
   * ```
   * {
   *   type: 'some.value.replace() [YourTag]',
   *   ...
   * }
   * ```
   */
  tag: string
}

export type PromisableUpdate<H> = H extends () => AnyAsync<any> ? {
  /**
   * Avoid unnecessary promise invocations by supplying the number of milliseconds that should elapse before the promise is invoked again.
   * To un-do this, you can call `stopBypassingPromises()` on the node of the state tree, for example
   * @example
   * get(s => s.todos).stopBypassingPromises();
   * @example
   * get(s => s.todos).findWhere(s => s.id).isEqualTo(2).stopBypassingPromises();
   */
  bypassPromiseFor?: number;
  /**
   * Allows you to set an initial value to update the store with.
   * If the promise is rejected, this value will be reverted to what it was before the promise was invoked.
   * @example
   * const newUsername = 'Jeff';
   * get(s => s.username)
   *   .replace(() => updateUsernameOnApi(newUsername), { optimisticallyUpdateWith: newUsername })
   *   .catch(err => notifyUserOfError(err))
   */
  optimisticallyUpdateWith?: H extends () => AnyAsync<infer W> ? W : never,
} : {};

export type UpdateAtIndex = {
  /**
   * The index where new elements should be inserted.  
   * The default insertion behavior is that new elements will be appended to the end of the existing array
   */
  atIndex?: number
};

export type ActionOptions<T extends Trackability> = T extends 'untagged' ? (TaggedUpdate<'untagged'> | void) : TaggedUpdate<'tagged'>;

export type UpdateOptions<T extends Trackability, H> = T extends 'untagged' ? (TaggedUpdate<'untagged'> & PromisableUpdate<H> | void) : TaggedUpdate<'tagged'> & PromisableUpdate<H>;

export type InsertOptions<T extends Trackability, H> = UpdateOptions<T, H> & (UpdateAtIndex | void);

/**
 * An object which is capable of storing and updating state which is in the shape of an array of primitives
 */
export type StoreForAnArrayCommon<X extends DeepReadonlyArray<any>, T extends Trackability> = {
  /**
   * Appends one or more elements onto the the array
   * @example
   * ...
   * .insert(newTodo);
   * @example
   * ...
   * .insert(newArrayOfTodos);
   * @example
   * ...
   * .insert(() => getTodosFromApi())
   * @example
   * ...
   * .insert(newArrayOfTodos, { atIndex: 0 });
   */
  insert: <H extends (X | X[0] | (() => AnyAsync<X | X[0]>)) >(insertion: H, options: InsertOptions<T, H>) => H extends (() => AnyAsync<any>) ? Future<X> : void,
  /**
   * Removes all elements from the array
   * @example
   * ...
   * .removeAll();
   */
  removeAll: (options: ActionOptions<T>) => void,
  /**
   * Substitute all elements with a new array of elements
   * @example
   * ...
   * .replaceAll(newTodos);
   */
  replaceAll: <H extends X | (() => AnyAsync<X>) >(replacement: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<X>) ? Future<X> : void,
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
   * .filterWhere(t => t.status).isEqualTo('done')
   * ...
   * ```
   */
  filterWhere: PredicateFunctionPrimitive<X, 'filter', T>,
  /**
   * Specify a where clause to find one element.  
   * @example
   * ...
   * .findWhere(t => t.id).isEqualTo(3)
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
    with: <H extends X | (X[0] | X | (() => AnyAsync<X | X[0]>)) >(elementOrArray: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<any>) ? Future<X> : void,
  }
  /**
   * Specify a where clause to find many elements.
   * @example
   * ```
   * ...
   * .filterWhere(t => t.status).isEqualTo('done')
   * ...
   * ```
   */
  filterWhere: PredicateFunctionObject<X, 'filter', T>,
  /**
   * Specify a where clause to find one element.  
   * @example
   * ...
   * .findWhere(t => t.id).isEqualTo(3)
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
export type StoreForAnObjectOrPrimitive<C, T extends Trackability> = {
  /**
   * Substitutes this primitive value
   * @example
   * get(s => s.user.age).replace(33);
   */
  replace: <H extends C | (() => AnyAsync<C>) >(replacement: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<any>) ? Future<C> : void,
}

/**
 * An object which is capable of storing and updating state which is in the shape of an object
 */
export type StoreForAnObject<C, T extends Trackability> = {
  /**
   * Partially updates this object
   * @example
   * ...
   *  .patch({ firstName: 'James', age: 33 })
   */
  patch: <H extends (Partial<C> | (() => AnyAsync<Partial<C>>)) >(partial: H, options: UpdateOptions<T, H>) => H extends (() => AnyAsync<Partial<C>>) ? Future<C> : void,
  /**
   * Removes the specified key from this object.  
   * ***WARNING***: invoking this has the potentional to contradict the type-system.
   * Only use this to remove a property from an object of type of `{ [key: string]: any }` and NOT to remove a property from an object with statically defined properties eg `{ str: '', num: 0 }`
   * @example
   * const select = createRootStore({ skillpoints: {} as {[name: string]: number} });
   * 
   * select(s => s.skillpoints)
   *   .remove('archery')
   */
  remove: <H extends (keyof C | (() => AnyAsync<keyof C>)) >(key: H, options: ActionOptions<T>) => H extends (() => AnyAsync<keyof C>) ? Future<C> : void,
  /**
   * Adds one or more key-value-pairs to this object.  
   * ***WARNING***: invoking this has the potentional to contradict the type-system.
   * Only use this to add properties to an object of type of `{ [key: string]: any }` and NOT to add properties with statically defined properties eg `{ str: '', num: 0 }`
   * @example
   * const select = createRootStore({ skillpoints: {} as {[name: string]: number} });
   * 
   * select(s => s.skillpoints)
   *   .insert({ archery: 3, sorcery: 5 })
   */
  insert: <H extends { [key: string]: any } | (() => AnyAsync<{ [key: string]: any }>) >(insertion: H) => H extends (() => AnyAsync<{ [key: string]: any }>) ? Future<{ [key: string]: any }> : void,
} & StoreForAnObjectOrPrimitive<C, T>;

export interface StoreOrDerivation<C> {
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
export type StoreWhichIsResettable<C, T extends Trackability> = {
  /**
   * Reverts the current state to how it was when the store was initialized.
   * Beware that all component stores will also be removed.
   */
  reset: (options: ActionOptions<T>) => void,
  /**
   * Ensures that fresh data is retrieved the next time any promises are used to populate this node (or any descendant nodes) of the state tree.
   */
  stopBypassingPromises: () => void,
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
 * An object which is capable of managing state for a component
 */
export type StoreForAComponent<C> = Store<C, 'untagged'> & { detachFromRootStore: () => void, setInstanceName: (instanceName: string) => void };

/**
 * A function which selects from the store
 */
export type Selector<S, C, X = C> = X extends C & ReadonlyArray<any> ? (s: S) => X : (s: S) => C;

export type SelectorReader<S, U> = { get: U, read: () => DeepReadonly<S> };

export type SelectorReaderComponent<S, U> = SelectorReader<S, U> & { detachFromRootStore: () => void, setInstanceName: (instanceName: string) => void };

/**
 * A function which selects from a component store
 */
export type SelectorFromAComponentStore<S> = [S] extends [Array<any>] | [number] | [string] | [boolean]
  ? () => StoreForAComponent<S>
  : <C = DeepReadonly<S>>(selector?: (arg: DeepReadonly<S>) => C) => StoreForAComponent<C>;

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
export type OptionsForMakingARootStore = {
  /**
   * Specifications for the Redux Devtools Extension. Pass `false` if you do not want your store to be tracked within the Redux Devtools extension.
   * See https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md for more info
   */
  devtools?: OptionsForReduxDevtools | false;
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
  /**
   * If set to true, then tags will appear in the action type as apposed to inside the payload (which is the default)
   */
  tagsToAppearInType?: boolean;
}

export const Deferred = Symbol('deferred');

/**
 * An object representing options which are supplied when creating a component store
 */
export type OptionsForMakingAComponentStore = {
  /**
   * Pass `true` if you do not want your store to be tracked inside the devtools. Default is false.
   */
  dontTrackWithDevtools?: boolean,
  /**
   * The name that will distinguish this component store from others within the state tree
   */
  componentName: string;
  /**
   * The string that will distinguish different instances of the same component store.
   */
  instanceName: string | number | typeof Deferred;
};

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

export type FutureState<C> = {
  isLoading: boolean,
  wasRejected: boolean,
  wasResolved: boolean,
  error: any,
  storeValue: C,
};

export interface Future<C> {
  asPromise: () => Promise<C>;
  onChange: (fn: (state: FutureState<C>) => any) => Unsubscribable;
  read: () => C;
}

export interface Async<C> {
}

export type AnyAsync<C> = Async<C> | Promise<C>;
