import { Store, Fetch, Unsubscribable } from 'oulik';
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
 *   store(s => s.some.property)
 * );
 * ```
 * 
 * EXAMPLE 2: DERIVED STORE SELECTION
 * ```typescript
 * const value = useSelector(
 *   deriveFrom(
 *     store(s => s.some.property),
 *     store(s => s.some.other.property),
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
 * const todosFetcher = store(s => s.todos).createFetcher({
 *   getData: () => fetchTodosFromApi(),
 *   cacheForMillis: 1000 * 60,
 * });
 * 
 * // inside your functional component
 * const { isLoading, data, hasError, error } = useFetcher(todosFetcher);
 * ```
 */
export function useFetcher<S, C, P>(
  getFetch: () => Fetch<S, C, P>,
  deps?: DependencyList,
) {
  const allDeps = [];
  if (deps) { allDeps.push(...deps); }
  const fetch = React.useMemo(() => getFetch(), allDeps);
  const [result, setResult] = React.useState({ isLoading: fetch.status === 'resolving', hasError: fetch.status === 'rejected', error: fetch.error, data: fetch.data, storeData: fetch.store.read() });
  React.useEffect(() => {
    setResult(result => ({...result, storeData: fetch.store.read() }));
    let storeSubscription: Unsubscribable | undefined;
    const subscription = fetch.onChange(() => {
      setResult(result => ({...result, isLoading: status === 'resolving', hasError: fetch.status === 'rejected', data: fetch.data, error: fetch.error, storeData: fetch.store.read() }));
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
 * export default mapStateToProps(store(), (state, ownProps: { someProp: string }) => ({
 *   todos: state.todos,
 *   userName: state.user.firstName,
 *   someProp: ownProps.someProp,
 * }))(Todo);
 * ```
 */
export function mapStateToProps<C, P extends {}, M extends {}, B extends boolean>(
  store: Store<any, C, B>,
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
