import {
  DeepReadonly,
  OptionsForMakingANestedStore,
  OptionsForMakingAStore,
  SelectorFromAStore,
  set as libSet,
  setEnforceTags as libSetEnforceTags,
  setNested as libSetNested,
  StoreOrDerivation,
} from 'olik';
import React from 'react';

/**
 * A hook to track the status of a request
 * 
 * @param fetchFn A no-args function returning a promise
 * 
 * @example
 * const { isLoading, hasError, succeeded, error, data, refetch } =
 *   useFetcher(() => fetch('https://www.example.com/api/todos')
 *     .then(res => get(s => s.todos).replaceAll(res)));
 * const todos = useSelector(get(s => s.todos));
 */
export function useFetcher<C>(
  fetchFn: () => Promise<C>,
  deps?: React.DependencyList,
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
  }, deps);
  return result;
}

/**
 * A hook for creating a store which is capable of being nested inside your application store
 * @param initialState the initial state of the nested store you want to create
 * @param options additional options for creating a nested store, which at minimum, must specify the `name` of the store
 * @param deps optional list of dependencies under which a store should be re-created
 */
export function useNestedStore<C>(
  initialState: C,
  options: OptionsForMakingANestedStore,
  deps: React.DependencyList = [],
) {
  const select = React.useMemo(() => {
    return libSetNested(initialState, options);
  }, deps);
  React.useEffect(() => {
    return () => { 
      setTimeout(() => select().removeFromContainingStore());
    }
  }, deps);
  return {
    select,
    ...getUseSelector(select),
    ...getUseDerivation(select),
  };
}

type Function<S, R> = (arg: DeepReadonly<S>) => R;
type MappedSelectorsToResults<S, X> = { [K in keyof X]: X[K] extends Function<S, infer E> ? E : never };

export function set<S>(initialState: S, options?: OptionsForMakingAStore) {
  const select = libSet(initialState, options);
  return {
    /**
     * Takes a function which selects from the store
     * @example
     * select(s => s.some.state).replace('test')
     */
    select,
    ...getUseSelector(select),
    ...getUseDerivation(select),
    ...getMapStateToProps(select),
  }
}

export function setEnforceTags<S>(initialState: S, options?: OptionsForMakingAStore) {
  const select = libSetEnforceTags(initialState, options) as SelectorFromAStore<S>;
  return {
    /**
     * Takes a function which selects from the store
     * @example
     * select(s => s.some.state).replace('test', 'MyComponent');
     * @example
     * select(s => s.some.state).replace('test', __filename);
     */
    select,
    ...getUseSelector(select),
    ...getUseDerivation(select),
    ...getMapStateToProps(select),
  };
}

function getMapStateToProps<S>(select: SelectorFromAStore<S>) {
  return {
    /**
     * Similar, in principal, to React-Redux's `mapStateToProps()`
     * @param mapper a function which takes in state from the store (as 1st arg) and own props (as 2nd arg), and returns state which will be used
     * 
     * The following example component receives props from the store as well as from its parent component
     * ```
     * const { mapStateToProps } = set({ some: { state: { todos: new Array<string>() } } });
     * 
     * class TodosComponent extends React.Component<{ todos: Array<{ id: number, text: string }>, title: string }> {
     *   render() {
     *     return (
     *        <>
     *          <div>{this.props.title}</div>
     *          { this.props.todos.map(todo => ( <div key={todo.id}>{todo.text}</div> )) }
     *        </>
     *     )
     *   }
     * }
     *
     * export default mapStateToProps((storeState, componentProps: { title: string }) => ({
     *   todos: storeState.todos,
     *   title: componentProps.title,
     * }))(TodosComponent);
     * ```
     */
    mapStateToProps: function<P extends {}, M extends {}>(mapper: (state: DeepReadonly<S>, ownProps: P) => M) {
      return (Component: React.ComponentType<M>) => {
        return class TodoWrapper extends React.PureComponent<P, M> {
          sub = select().onChange(s => this.setState(mapper(s, this.props)));
          constructor(props: any) {
            super(props);
            this.state = mapper(select().read(), this.props);
          }
          static getDerivedStateFromProps(props: P) {
            return mapper(select().read(), props);
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
  };
}

function getUseSelector<S>(select: SelectorFromAStore<S>) {
  return {
    /**
     * A hook to select a specific part of the state tree
     * @param selector a selection from the store
     * @param deps an optional array of values upon which the calculation depends
     * @example
     * const str = useSelector(s => s.some.state);
     * @example
     * const [id, setId] = React.useState(0);
     * const todo = useSelector(s => s.some.todos.find(t => t.id === id), [id]);
     */
    useSelector: function<R>(selector: Function<S, R>, deps: React.DependencyList = []) {
      return useSelector(select, selector, deps);
    },
  };
}

function getUseDerivation<S>(select: SelectorFromAStore<S>) {
  return {
    /**
     * A hook to derive state and memoise the result of a complex calculation
     * @param inputs an array of functions which select from the store
     * @param deps an optional array of values upon which the calculation depends
     * @example
     * const derivation = useDerivation([
     *   s => s.some.number,
     *   s => s.some.string,
     * ]).usingExpensiveCalc(([num, str]) => ...some complex calc we dont want to repeat unnecessarily... );
     * @example
     * const [id, setId] = React.useState(0);
     * const derivation = useDerivation([
     *   s => s.some.number,
     *   s => s.some.todos.find(t => t.id === id)
     * ], [id]).usingExpensiveCalc(([num, todo]) => ...some complex calc we dont want to repeat unnecessarily... )
     */
    useDerivation: function<X extends [Function<S, any>] | Function<S, any>[]>(inputs: X, deps?: React.DependencyList) {
      return {
        usingExpensiveCalc: function<R>(calculation: (inputs: MappedSelectorsToResults<S, X>) => R) {
          const selectors = inputs.map(input => useSelector(select, input));
          const allDeps = [...selectors];
          if (deps) { allDeps.push(...deps); }
          return React.useMemo(() => calculation(selectors as any), allDeps);
        }
      }
    },
  };
}

function useSelector<S, R>(select: SelectorFromAStore<S>, selector: Function<S, R>, deps?: React.DependencyList) {
  const storeOrDerivation = select(selector) as StoreOrDerivation<R>;
  const [selection, setSelection] = React.useState(storeOrDerivation.read());
  const allDeps = [storeOrDerivation.read()];
  if (deps) { allDeps.push(...deps); }
  React.useEffect(() => {
    const subscription = storeOrDerivation.onChange(arg => {
      setSelection(arg);
    });
    return () => subscription.unsubscribe();
  }, allDeps);
  return selection as R;
}

