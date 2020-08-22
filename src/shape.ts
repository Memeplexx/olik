export interface Options {
  dontTrackWithDevtools?: boolean;
  addSuffix?: string;
  addPrefix?: string;
}

export interface Fetcher<S, C> {
  /**
   * The current status of the fetch
   */
  status: 'pristine' | 'error' | 'resolved' | 'resolving';
  /**
   * Can be called to manually bust a cache before invoking 'fetch()' again
   */
  invalidateCache: () => any,
  /**
   * Can be called to fetch the results and automatically add them to the store
   */
  fetch: () => Promise<C>,

  store: { select: (state: S) => { onChange: (performAction: (selection: C) => any) => any }, read: () => S }
}

export type AvailableOps<S, C> =
  (C extends undefined ? any : C extends Array<any> ? {
    /**
     * Append one or more elements to the end of array
     * ```
     * store
     *   .select(s => s.todos)
     *   .insertAfter(...newTodos);
     * ```
     */
    insertAfter: (...elements: C) => void,
    /**
     * Prepend one or more elements to the beginning of array
     * ```
     * store
     *   .select(s => s.todos)
     *   .insertBefore(...newTodos);
     * ```
     */
    insertBefore: (...elements: C) => void,
    /**
     * Partially update zero or more elements which match a specific condition
     * ```
     * store
     *   .select(s => s.todos)
     *   .patchWhere(t => t.status === 'done')
     *   .with({ status: 'todo' });
     * ```
     */
    patchWhere: (where: (e: C[0]) => boolean) => { with: (element: Partial<C[0]>) => void },
    /**
     * Remove all elements from array
     * ```
     * store
     *   .select(s => s.todos)
     *   .removeAll();
     * ```
     */
    removeAll: () => void,
    /**
     * Delete first element from array
     * ```
     * store
     *   .select(s => s.todos)
     *   .removeFirst();
     * ```
     */
    removeFirst: () => void,
    /**
     * Delete last element from array
     * ```
     * store
     *   .select(s => s.todos)
     *   .removeLast();
     * ```
     */
    removeLast: () => void,
    /**
     * Delete zero or more elements which match a specific condition
     * ```
     * store
     *   .select(s => s.todos)
     *   .removeWhere(t => t.status === 'done')
     * ```
     */
    removeWhere: (where: (arg: C[0]) => boolean) => void,
    /**
     * Substitute all elements with a new array
     * ```
     * store
     *   .select(s => s.todos)
     *   .replaceAll(newTodos);
     * ```
     */
    replaceAll: (replacement: C, options?: Options) => void,
    /**
     * Substitute zero or more elements which match a specific condition
     * ```
     * store
     *   .select(s => s.todos)
     *   .replaceMany(t => t.status === 'todo')
     *   .with(newTodo)
     * ```
     */
    replaceMany: (where: (element: C[0]) => boolean) => { with: (element: C[0]) => void },
    /**
     * Subtitute one element
     * @param where the function which will find the element
     * @param element the element which will replace the old one
     * ```
     * store
     *   .select(s => s.todos)
     *   .replaceOne(t => t.id === 5)
     *   .with({ id: 5, text: 'bake cookies' });
     * ```
     */
    replaceOne: (where: (e: C[0]) => boolean) => { with: (element: C[0]) => void },
    /**
     * Subtitute or appends an element depending on whether or not it can be found.
     * @param where the function which will attempt to find the element
     * @param element the element will either replace the old one or be inserted
     * ```
     * store
     *   .select(s => s.todos)
     *   .upsertOne(t => t.id === 5)
     *   .with({ id: 5, text: 'bake cookies' });
     * ```
     */
    upsertOne: (where: (e: C[0]) => boolean) => { with: (element: C[0]) => void },
    /**
     * Filter for element(s) so that an operation can be performed on them
     * @param where the function which will find the element(s)
     * ```
     * store
     *   .select(s => s.todos)
     *   .filter(t => t.id === 5)
     *   .patch({ text: 'bake cookies' })
     * ```
     */
    filter: (where: (e: C[0]) => boolean) => AvailableOps<S, C[0]>,
  } : C extends object ? {
    /**
     * Partially updates object
     * ```
     * store
     *   .select(s => s.user)
     *   .patch({ firstName: 'James', age: 33 })
     * ```
     */
    patch: (partial: Partial<C>) => void,
    /**
     * Substitutes object
     * ```
     * store
     *   .select(s => s.user)
     *   .replace(newUser)
     * ```
     */
    replace: (replacement: C, options?: Options) => void,
  } : C extends boolean ? {
    /**
     * Subtitutes primitive
     * ```
     * store
     *   .select(s => s.user.age)
     *   .replace(33)
     * ```
     */
    replace: (replacement: boolean) => void,
  } : {
    /**
     * Subtitutes primitive
     * ```
     * store
     *   .select(s => s.user.age)
     *   .replace(33)
     * ```
     */
    replace: (replacement: C) => void,
  }) & {
    /**
     * *Fetchers* are an standardized mechanism for:  
     * * fetching data from external resources,
     * * indicating the status of a request (loading / success / error), and 
     * * caching request responses (optional).  
     * 
     * ```
     * const todosFetcher = store
     *   .select(s => s.todos)
     *   .createFetcher(() => fetchTodos(), { cacheForMillis: 1000 * 60 });
     * ```
     */
    createFetcher: (promise: () => Promise<C>, specs?: { cacheForMillis?: number }) => Fetcher<S, C>,
  } & {
    onChange: (performAction: (selection: C) => any) => { unsubscribe: () => any },
  };


export interface StoreResult<S> {
  /**
   * @returns the current state
   */
  read: () => S;
  /**
    * Select a piece of state in order to perform some operation on it
    * ```
    * select(s => s.todos)...
    * ```
    */
  select: <C = S>(selector?: ((s: S) => C)) => AvailableOps<S, C>;
}
