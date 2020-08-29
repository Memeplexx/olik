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

  store: (selector?: (state: S) => C) => AvailableOps<S, C>,

  selector: (state: S) => C,
}

export type AvailableOps<S, C> =
  (C extends undefined ? any : C extends Array<any> ? {
    /**
     * Append one or more elements to the end of array
     * ```
     * getStore(s => s.todos)
     *   .addAfter(...newTodos);
     * ```
     */
    addAfter: (...elements: C) => void,
    /**
     * Prepend one or more elements to the beginning of array
     * ```
     * getStore(s => s.todos)
     *   .addBefore(...newTodos);
     * ```
     */
    addBefore: (...elements: C) => void,
    /**
     * Partially update zero or more elements which match a specific condition
     * ```
     * getStore(s => s.todos)
     *   .patchWhere(t => t.status === 'done')
     *   .with({ status: 'todo' });
     * ```
     */
    patchWhere: (where: (e: C[0]) => boolean) => { with: (element: Partial<C[0]>) => void },
    /**
     * Remove all elements from array
     * ```
     * getStore(s => s.todos)
     *   .removeAll();
     * ```
     */
    removeAll: () => void,
    /**
     * Delete first element from array
     * ```
     * getStore(s => s.todos)
     *   .removeFirst();
     * ```
     */
    removeFirst: () => void,
    /**
     * Delete last element from array
     * ```
     * getStore(s => s.todos)
     *   .removeLast();
     * ```
     */
    removeLast: () => void,
    /**
     * Delete zero or more elements which match a specific condition
     * ```
     * getStore(s => s.todos)
     *   .removeWhere(t => t.status === 'done')
     * ```
     */
    removeWhere: (where: (arg: C[0]) => boolean) => void,
    /**
     * Substitute all elements with a new array
     * ```
     * getStore(s => s.todos)
     *   .replaceAll(newTodos);
     * ```
     */
    replaceAll: (replacement: C, options?: Options) => void,
    /**
     * Substitute zero or more elements which match a specific condition
     * @param where the function which will find the element
     * @param element the element which will replace the old one
     * ```
     * getStore(s => s.todos)
     *   .replaceWhere(t => t.id === 5)
     *   .with({ id: 5, text: 'bake cookies' });
     * ```
     */
    replaceWhere: (where: (e: C[0]) => boolean) => { with: (element: C[0]) => void },
    /**
     * Subtitute or appends an element depending on whether or not it can be found.
     * @param where the function which will attempt to find the element
     * @param element the element will either replace the old one or be inserted
     * ```
     * getStore(s => s.todos)
     *   .upsertWhere(t => t.id === 5)
     *   .with({ id: 5, text: 'bake cookies' });
     * ```
     */
    upsertWhere: (where: (e: C[0]) => boolean) => { with: (element: C[0]) => void },
    /**
     * Filter for element(s) so that an operation can be performed on them
     * @param where the function which will find the element(s)
     * ```
     * getStore(s => s.todos)
     *   .filter(t => t.id === 5)
     *   .patchWith({ text: 'bake cookies' })
     * ```
     */
    filter: (where: (e: C[0]) => boolean) => AvailableOps<S, C[0]>,
  } : C extends object ? {
    /**
     * Partially updates object
     * ```
     * getStore(s => s.user)
     *   .patchWith({ firstName: 'James', age: 33 })
     * ```
     */
    patchWith: (partial: Partial<C>) => void,
    /**
     * Substitutes object
     * ```
     * getStore(s => s.user)
     *   .replaceWith(newUser)
     * ```
     */
    replaceWith: (replacement: C, options?: Options) => void,
  } : C extends boolean ? {
    /**
     * Subtitutes primitive
     * ```
     * getStore(s => s.user.age)
     *   .replaceWith(33)
     * ```
     */
    replaceWith: (replacement: boolean) => void,
  } : {
    /**
     * Subtitutes primitive
     * ```
     * getStore(s => s.user.age)
     *   .replaceWith(33)
     * ```
     */
    replaceWith: (replacement: C) => void,
  }) & {
    /**
     * *Fetchers* are an standardized mechanism for:  
     * * fetching data from external resources,
     * * indicating the status of a request (loading / success / error), and 
     * * caching request responses (optional).  
     * 
     * ```
     * const todosFetcher = getStore(s => s.todos)
     *   .createFetcher(() => fetchTodos(), { cacheForMillis: 1000 * 60 });
     * ```
     */
    createFetcher: (promise: () => Promise<C>, specs?: { cacheForMillis?: number }) => Fetcher<S, C>,
  } & {
    /**
     * Listens to any updates on this node
     * @returns a subscription which may need to be unsubscribed from
     * ```
     * getStore(s => s.todos)
     *   .onChange(todos => console.log(todos)) ;
     * ```
     */
    onChange: (performAction: (selection: C) => any) => { unsubscribe: () => any },
    /**
     * @returns the current state
     */
    read: () => C,
    /**
     * Reverts the current state to how it was when the store was initialized
     */
    reset: () => void,
  };
