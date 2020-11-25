export interface Action<T = any> {
  type: T
}

export type FetcherStatus = 'pristine' | 'rejected' | 'resolved' | 'resolving';
export type Tag<B> = B extends true ? string : void;
export type Params<T> = T extends infer T ? T : void;
export interface Unsubscribable {
  unsubscribe: () => any,
}

export type DeepReadonly<T> =
  T extends (infer R)[] ? DeepReadonlyArray<R> :
  T extends Function ? T :
  T extends object ? DeepReadonlyObject<T> :
  T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> { }

export type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

export interface Fetch<S, C, P, B extends boolean> {
  /**
   * The current resolved data, if any.
   */
  data: C;
  /**
   * The current rejection, if any.
   */
  error: any;
  /**
   * The current status. Can be observed using onChange() and onChangeOnce().
   */
  status: FetcherStatus;
  /**
   * The store associated with this fetch
   */
  store: Store<S, C, B>;
  /**
   * The argument that was used in the request (if any)
   */
  fetchArg: Params<P>;
  /**
   * Clears data from the cache (not the store) so that the next time data it requested, it is also re-fetched
   */
  invalidateCache: () => any;
  /**
   * Takes a function that will be invoked whenever the status changes
   */
  onChange: (listener: (fetch: Fetch<S, C, P, B>) => any) => Unsubscribable;
  /**
   * Takes a function that will be invoked only once, when the status next changes
   */
  onChangeOnce: (listener: (fetch: Fetch<S, C, P, B>) => any) => Unsubscribable;
  /**
   * Takes a function that will be invoked whenever the cache expires
   */
  onCacheExpired: (listener: (fetch: Fetch<S, C, P, B>) => any) => Unsubscribable;
  /**
   * Takes a function that will only be invoked only once, when the cache next expires
   */
  onCacheExpiredOnce: (listener: (fetch: Fetch<S, C, P, B>) => any) => Unsubscribable;
  /**
   * Invalidates the cache and re-fetches
   */
  refetch: Fetcher<S, C, P, B>;
};

export interface FetcherSpecs<S, C, B extends boolean, P> {
  /**
   * A no-arg function returning a promise to fetch asynchronous data, for example:
   * ```
   * getData: () => fetchThingsFromApi(),
   * ```
   */
  getData: P extends void ? (() => Promise<C>) : ((params: P) => Promise<C>),
  /**
   * By default, fetchers will simply replace all data associated with part of the store they are bound to.
   * However, this behavior can be overriden here. For example, maybe you want to append resolved data to existing data as follows:
   * ```
   * setData: arg => arg.store.addAfter(arg.data)
   * ```
   */
  setData?: (arg: { store: Store<S, C, B>, data: C, params: Params<P>, tag: Tag<B> }) => any,
  /**
   * Specify for how long, in milliseconds, you want the library to cache fetch responses.
   */
  cacheFor?: number,
};

export type Fetcher<S, C, P, B extends boolean> = P extends void ? ((tag: Tag<B>) => Fetch<S, C, P, B>) : ((params: Params<P>, tag: Tag<B>) => Fetch<S, C, P, B>);

type ArrayOfPrimitivesStore<S, C extends DeepReadonlyArray<any>, B extends boolean> = {
  /**
   * Append elements to the end of array
   * ```
   * store(s => s.todos)
   *   .addAfter(newTodos);
   * ```
   */
  addAfter: (elements: C[0] | C[0][], tag: Tag<B>) => void,
  /**
   * Prepend elements to the beginning of array
   * ```
   * store(s => s.todos)
   *   .addBefore(newTodos);
   * ```
   */
  addBefore: (elements: C[0] | C[0][], tag: Tag<B>) => void,
  /**
   * Remove all elements from array
   * ```
   * store(s => s.todos)
   *   .removeAll();
   * ```
   */
  removeAll: (tag: Tag<B>) => void,
  /**
   * Delete first element from array
   * ```
   * store(s => s.todos)
   *   .removeFirst();
   * ```
   */
  removeFirst: (tag: Tag<B>) => void,
  /**
   * Delete last element from array
   * ```
   * store(s => s.todos)
   *   .removeLast();
   * ```
   */
  removeLast: (tag: Tag<B>) => void,
  /**
   * Delete elements which match a specific condition
   * ```
   * store(s => s.todos)
   *   .removeWhere(t => t.status === 'done')
   * ```
   */
  removeWhere: (where: (arg: C[0]) => boolean, tag: Tag<B>) => void,
  /**
   * Substitute all elements with a new array
   * ```
   * store(s => s.todos)
   *   .replaceAll(newTodos);
   * ```
   */
  replaceAll: (replacement: C, tag: Tag<B>) => void,
  /**
   * Substitute elements which match a specific condition
   * @param where the function which will find the element
   * @param element the element which will replace the old one
   * ```
   * store(s => s.todos)
   *   .replaceWhere(t => t.id === 5)
   *   .with({ id: 5, text: 'bake cookies' });
   * ```
   */
  replaceWhere: (where: (e: C[0]) => boolean) => { with: (element: C[0], tag: Tag<B>) => void },
  /**
   * Subtitutes or appends an element depending on whether or not it can be found.
   * @param where the function which will attempt to find the element
   * @param element the element will either replace the old one or be inserted
   * ```
   * store(s => s.todos)
   *   .upsertWhere(t => t.id === 5)
   *   .with({ id: 5, text: 'bake cookies' });
   * ```
   */
  upsertWhere: (where: (e: C[0]) => boolean) => { with: (element: C[0], tag: Tag<B>) => void },
}

export type ArrayStore<S, C extends DeepReadonlyArray<any>, B extends boolean> = {
  /**
   * Partially update elements which match a specific condition
   * ```
   * store(s => s.todos)
   *   .patchWhere(t => t.status === 'done')
   *   .with({ status: 'todo' });
   * ```
   */
  patchWhere: (where: (e: C[0]) => boolean) => { with: (element: Partial<C[0]>, tag: Tag<B>) => void },
} & ArrayOfPrimitivesStore<S, C, B>;

export type PrimitiveStore<S, C extends any, B extends boolean> = {
  /**
   * Subtitutes primitive
   * ```
   * store(s => s.user.age)
   *   .replaceWith(33)
   * ```
   */
  replaceWith: (replacement: C, tag: Tag<B>) => void,
}

export type ObjectStore<S, C extends any, B extends boolean> = {
  /**
   * Partially updates object
   * ```
   * store(s => s.user)
   *   .patchWith({ firstName: 'James', age: 33 })
   * ```
   */
  patchWith: (partial: Partial<C>, tag: Tag<B>) => void,
} & PrimitiveStore<S, C, B>;

export type CommonReadable<S, C extends any, B extends boolean> = {
  /**
   * Listens to any updates on this node
   * @returns a subscription which may need to be unsubscribed from
   * ```
   * store(s => s.todos)
   *   .onChange(todos => console.log(todos)) ;
   * ```
   */
  onChange: (performAction: (selection: C) => any) => Unsubscribable,
  /**
   * @returns the current state
   */
  read: () => C,
}

export type CommonStore<S, C extends any, B extends boolean> = {
  /**
   * Reverts the current state to how it was when the store was initialized
   */
  reset: (tag: Tag<B>) => void,
} & CommonReadable<S, C, B>;

export type Store<S, C, B extends boolean> = ([C] extends undefined ? any :
    [C] extends DeepReadonlyArray<object[]> ? ArrayStore<S, [C][0], B> :
    [C] extends DeepReadonlyArray<any[]> ? ArrayOfPrimitivesStore<S, [C][0], B> :
    [C] extends [object] ? ObjectStore<S, C, B> : PrimitiveStore<S, C, B>) & CommonStore<S, C, B>;

export type LibStore<S, C, B extends boolean> = Store<S, C, B> & {
  /**
   * Removes this nested store from the store which was marked as a `containerForNestedStores`.
   */
  removeFromContainingStore: () => void
};

type ReadType<E> = E extends CommonReadable<any, infer W, false> ? W : E extends CommonReadable<any, infer W, true> ? W : never;

export type MappedDataTuple<T extends Array<CommonReadable<any, any, any>>> = {
  [K in keyof T]: ReadType<T[K]>;
}

export interface EnhancerOptions {
  /**
   * the instance name to be showed on the monitor page. Default value is `document.title`.
   * If not specified and there's no document title, it will consist of `tabId` and `instanceId`.
   */
  name?: string;
  /**
   * if more than one action is dispatched in the indicated interval, all new actions will be collected and sent at once.
   * It is the joint between performance and speed. When set to `0`, all actions will be sent instantly.
   * Set it to a higher value when experiencing perf issues (also `maxAge` to a lower value).
   *
   * @default 500 ms.
   */
  latency?: number;
  /**
   * (> 1) - maximum allowed actions to be stored in the history tree. The oldest actions are removed once maxAge is reached. It's critical for performance.
   *
   * @default 50
   */
  maxAge?: number;
  /**
   * - `undefined` - will use regular `JSON.stringify` to send data (it's the fast mode).
   * - `false` - will handle also circular references.
   * - `true` - will handle also date, regex, undefined, error objects, symbols, maps, sets and functions.
   * - object, which contains `date`, `regex`, `undefined`, `error`, `symbol`, `map`, `set` and `function` keys.
   *   For each of them you can indicate if to include (by setting as `true`).
   *   For `function` key you can also specify a custom function which handles serialization.
   *   See [`jsan`](https://github.com/kolodny/jsan) for more details.
   */
  serialize?: boolean | {
    date?: boolean;
    regex?: boolean;
    undefined?: boolean;
    error?: boolean;
    symbol?: boolean;
    map?: boolean;
    set?: boolean;
    function?: boolean | Function;
  };
  /**
   * function which takes `action` object and id number as arguments, and should return `action` object back.
   */
  actionSanitizer?: <A extends Action>(action: A, id: number) => A;
  /**
   * function which takes `state` object and index as arguments, and should return `state` object back.
   */
  stateSanitizer?: <S>(state: S, index: number) => S;
  /**
   * *string or array of strings as regex* - actions types to be hidden / shown in the monitors (while passed to the reducers).
   * If `actionsWhitelist` specified, `actionsBlacklist` is ignored.
   */
  actionsBlacklist?: string | string[];
  /**
   * *string or array of strings as regex* - actions types to be hidden / shown in the monitors (while passed to the reducers).
   * If `actionsWhitelist` specified, `actionsBlacklist` is ignored.
   */
  actionsWhitelist?: string | string[];
  /**
   * called for every action before sending, takes `state` and `action` object, and returns `true` in case it allows sending the current data to the monitor.
   * Use it as a more advanced version of `actionsBlacklist`/`actionsWhitelist` parameters.
   */
  predicate?: <S, A extends Action>(state: S, action: A) => boolean;
  /**
   * if specified as `false`, it will not record the changes till clicking on `Start recording` button.
   * Available only for Redux enhancer, for others use `autoPause`.
   *
   * @default true
   */
  shouldRecordChanges?: boolean;
  /**
   * if specified, whenever clicking on `Pause recording` button and there are actions in the history log, will add this action type.
   * If not specified, will commit when paused. Available only for Redux enhancer.
   *
   * @default "@@PAUSED""
   */
  pauseActionType?: string;
  /**
   * auto pauses when the extension’s window is not opened, and so has zero impact on your app when not in use.
   * Not available for Redux enhancer (as it already does it but storing the data to be sent).
   *
   * @default false
   */
  autoPause?: boolean;
  /**
   * if specified as `true`, it will not allow any non-monitor actions to be dispatched till clicking on `Unlock changes` button.
   * Available only for Redux enhancer.
   *
   * @default false
   */
  shouldStartLocked?: boolean;
  /**
   * if set to `false`, will not recompute the states on hot reloading (or on replacing the reducers). Available only for Redux enhancer.
   *
   * @default true
   */
  shouldHotReload?: boolean;
  /**
   * if specified as `true`, whenever there's an exception in reducers, the monitors will show the error message, and next actions will not be dispatched.
   *
   * @default false
   */
  shouldCatchErrors?: boolean;
  /**
   * If you want to restrict the extension, specify the features you allow.
   * If not specified, all of the features are enabled. When set as an object, only those included as `true` will be allowed.
   * Note that except `true`/`false`, `import` and `export` can be set as `custom` (which is by default for Redux enhancer), meaning that the importing/exporting occurs on the client side.
   * Otherwise, you'll get/set the data right from the monitor part.
   */
  features?: {
    /**
     * start/pause recording of dispatched actions
     */
    pause?: boolean;
    /**
     * lock/unlock dispatching actions and side effects
     */
    lock?: boolean;
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
     * jump back and forth (time travelling)
     */
    jump?: boolean;
    /**
     * skip (cancel) actions
     */
    skip?: boolean;
    /**
     * drag and drop actions in the history list
     */
    reorder?: boolean;
    /**
     * dispatch custom actions or action creators
     */
    dispatch?: boolean;
    /**
     * generate tests for the selected actions
     */
    test?: boolean;
  };
  /**
   * Set to true or a stacktrace-returning function to record call stack traces for dispatched actions.
   * Defaults to false.
   */
  trace?: boolean | (<A extends Action>(action: A) => string);
  /**
   * The maximum number of stack trace entries to record per action. Defaults to 10.
   */
  traceLimit?: number;
}

export interface Derivation<R> {
  read: () => R,
  onChange: (listener: (value: R) => any) => Unsubscribable,
};

export interface WindowAugmentedWithReduxDevtools {
  __REDUX_DEVTOOLS_EXTENSION__: {
    connect: (options: EnhancerOptions) => {
      init: (state: any) => any,
      subscribe: (listener: (message: { type: string, payload: any, state?: any, source: string }) => any) => any,
      unsubscribe: () => any,
      send: (action: Action, state: any) => any
    };
    disconnect: () => any;
    send: (action: { type: string, payload?: any }, state: any, options: EnhancerOptions) => any;
    _mockInvokeSubscription: (message: { type: string, payload: any, state?: any, source: any }) => any,
    _subscribers: Array<(message: { type: string, payload: any, state?: any, source: any }) => any>,
  }
}

