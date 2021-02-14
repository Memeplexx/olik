import { SelectorFromANestedStore, Store, Trackability, Unsubscribable } from 'oulik';
import React, { DependencyList } from 'react';

export * from 'oulik';

/**
 * A hook to select a specific part of the state
 * @param store either a normal store, or a derived store
 * @param deps an optional array of dependencies
 * 
 * @example: NORMAL STORE SELECTION
 * ```
 * const value = useSelector(
 *   get(s => s.some.property)
 * );
 * ```
 * 
 * @example: DERIVED STORE SELECTION
 * ```typescript
 * const value = useSelector(
 *   deriveFrom(
 *     get(s => s.some.property),
 *     get(s => s.some.other.property),
 *   ).usingExpensiveCalc((someProperty, someOtherProperty) => {
 *     return someProperty * someOtherProperty;
 *   })
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
 * @param fetchFn A no-args function returning a promise
 * 
 * @example
 * ```
 * const fetchTodosFromApi = (index: number, offset: number) => {
 *   return fetch(`https://www.example.com/api/todos?index=${index}&offset=${offset}`)
 * }
 * 
 * const { isLoading, hasError, succeeded, error, data, refetch } =
 *   useFetcher(() => fetchTodosFromApi(index: number, offset: number).then(res => get(s => s.todos).replaceAll(res)));
 * const todos = useSelector(get(s => s.todos));
 * ```
 */
export function useFetcher<C>(
  fetchFn: () => Promise<C>
) {
  const [result, setResult] = React.useState({
    isLoading: true,
    hasError: false,
    succeeded: false,
    error: null as any | null,
    data: null as null | C,
    refetch: (() => null) as unknown as ((fetcher: () => Promise<C>) => void),
  });
  React.useEffect(() => {
    const refetch = (fetcher: () => Promise<C>) => {
      setResult({ data: null, hasError: false, isLoading: true, error: null, succeeded: false, refetch });
      fetcher()
        .then(data => setResult({ data, hasError: false, isLoading: false, error: null, succeeded: true, refetch }))
        .catch(error => setResult({ data: null, hasError: true, isLoading: false, error, succeeded: false, refetch }));
    };
    refetch(fetchFn);
  });
  return result;
}

/**
 * A hook for creating a store which is capable of being nested inside your application store
 * @param getStore a no-args function which returns a new store
 * 
 * Note that in order for your store to be nested in the application store, you will need to
 * mark it as follows:
 * ```
 * const get = make({...}, { containerForNestedStores: true });
 * ```
 * Then, in your component, you can use this function as follows:
 * ```
 * const get = useStore(() => makeNested({...}, { name: 'MyComponent' }));
 * ```
 * Finally, note that if your application store is not marked with `containerForNestedStores`,
 * then your component will register a new store within the devtools with the name your provided,
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
 * The following example component receives props from the store as well as from its parent component
 * ```
 * const get = make({ some: { state: { todos: new Array<string>(), user: { firstName: '' } } } });
 * 
 * class Todo extends React.Component<{ todos: Array<string>, userName: string, someProp: number }> {
 *   // ...
 * }
 *
 * export default mapStateToProps(get(s => s.some.state), (state, ownProps: { someProp: number }) => ({
 *   todos: state.todos,
 *   userName: state.user.firstName,
 *   someProp: ownProps.someProp,
 * }))(Todo);
 * ```
 */
export function mapStateToProps<C, P extends {}, M extends {}, B extends Trackability>(
  store: Store<C, B>,
  mapper: (state: C, ownProps: P) => M,
) {
  return (Component: React.ComponentType<M>) => {
    return class TodoWrapper extends React.PureComponent<P, M> {
      sub = store.onChange(s => this.setState(mapper(s as C, this.props)));
      constructor(props: any) {
        super(props);
        this.state = mapper(store.read() as any, this.props);
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
