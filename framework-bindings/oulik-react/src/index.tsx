import { Store, FetchState, Unsubscribable, StoreWhichIsNested, makeNested, SelectorFromANestedStore, } from 'oulik';
import React, { DependencyList } from 'react';

export * from 'oulik';

/**
 * A hook to select a specific part of the state
 * @param store either a normal store, or a derived store
 * @param deps an optional array of dependencies
 * 
 * EXAMPLE 1: NORMAL STORE SELECTION
 * ```typescript
 * const value = useSelector(
 *   select(s => s.some.property)
 * );
 * ```
 * 
 * EXAMPLE 2: DERIVED STORE SELECTION
 * ```typescript
 * const value = useSelector(
 *   deriveFrom(
 *     select(s => s.some.property),
 *     select(s => s.some.other.property),
 *   ).usingExpensiveCalc((someProperty, someOtherProperty) => someProperty * someOtherProperty)
 * ));
 * ```
 */
export function useSelector<C>(
  store: {
    read: () => C,
    onChange: (listener: (value: C) => any) => Unsubscribable,
  },
  deps?: DependencyList,
) {
  const [selection, setSelection] = React.useState(store.read());
  const allDeps = [store.read()];
  if (deps) { allDeps.push(...deps); }
  React.useEffect(() => {
    const subscription = store.onChange(arg => setSelection(arg));
    return () => subscription.unsubscribe();
  }, allDeps);
  return selection;
}

/**
 * A hook to track the status of a request
 * 
 * @param fetcher A fetcher which you have previously defined
 * @param tag required only if you have defined your store using `makeEnforceTags()`
 * 
 * EXAMPLE
 * ```typescript
 * // outside your functional component
 * const todosFetcher = createFetcher({
 *   onStore: select(s => s.todos),
 *   getData: () => fetchTodosFromApi(),
 *   cacheFor: 1000 * 60,
 * });
 * 
 * // inside your functional component
 * const { isLoading, hasError, error, data, storeData, refetch } = useFetcher(todosFetcher);
 * ```
 */
export function useFetcher<S, C, P, B extends boolean>(
  getFetch: () => FetchState<S, C, P, B>,
  deps?: DependencyList,
) {
  const allDeps = [];
  if (deps) { allDeps.push(...deps); }
  const fetch = React.useMemo(() => getFetch(), allDeps);
  const [result, setResult] = React.useState({ isLoading: fetch.status === 'resolving', hasError: fetch.status === 'rejected', error: fetch.error, data: fetch.data, storeData: fetch.store.read(), refetch: fetch.refetch });
  React.useEffect(() => {
    setResult(result => ({ ...result, storeData: fetch.store.read() }));
    let storeSubscription: Unsubscribable | undefined;
    const subscription = fetch.onChange(() => {
      setResult(result => ({ ...result, isLoading: status === 'resolving', hasError: fetch.status === 'rejected', error: fetch.error, data: fetch.data, storeData: fetch.store.read() }));
      storeSubscription = fetch.store.onChange(state => setResult(r => ({ ...r, storeData: state })))
    })
    return () => {
      subscription.unsubscribe();
      if (storeSubscription) { storeSubscription.unsubscribe(); }
    }
  }, allDeps);
  return result;
}

/**
 * A hook for creating a store which is capable of being nested inside your application store
 * @param getStore a no-args function which returns a new store
 * 
 * EXAMPLE
 * ```typescript
 * const store = useStore(() => makeNested({ someString: '', someNumber: 0 }));
 * ```
 */
export function useStore<C>(
  getStore: () => SelectorFromANestedStore<C>,
) {
  const result = React.useMemo(() => getStore(), []);
  React.useEffect(() => {
    return () => { setTimeout(() => result().removeFromContainingStore()) }
  }, []);
  return result;
}

/**
 * Similar, in principal to React-Redux's `mapStateToProps()`
 * @param store The store that was previously defined using `make()` or `makeEnforceTags()`
 * @param mapper a function which takes in state from the store, and returns state which will be used
 * 
 * EXAMPLE
 * ```typescript
 * class Todo extends React.Component<{ todos: Todo[], userName: string, someProp: number }> {
 *   // ...
 * }
 *
 * export default mapStateToProps(select(), (state, ownProps: { someProp: string }) => ({
 *   todos: state.todos,
 *   userName: state.user.firstName,
 *   someProp: ownProps.someProp,
 * }))(Todo);
 * ```
 */
export function mapStateToProps<C, P extends {}, M extends {}, B extends boolean>(
  store: Store<C, B>,
  mapper: (state: C, ownProps: P) => M,
) {
  return (Component: React.ComponentType<M>) => {
    return class TodoWrapper extends React.PureComponent<P, M> {
      sub = store.onChange(s => this.setState(mapper(s, this.props)));
      constructor(props: any) {
        super(props);
        this.state = mapper(store.read(), this.props);
      }
      render() {
        return (
          <Component {...this.state} />
        )
      }
      componentWillUnmount() {
        this.sub.unsubscribe();
      }
    }
  }
}
