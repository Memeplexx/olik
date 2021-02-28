import {
  DeepReadonly,
  Derivation,
  deriveFrom as libDeriveFrom,
  OptionsForMakingANestedStore,
  OptionsForMakingAStore,
  SelectorFromANestedStore,
  SelectorFromAStore,
  set as libSet,
  setEnforceTags as libSetEnforceTags,
  setNested as libSetNested,
  Store,
  StoreOrDerivation,
  Trackability,
} from 'olik';
import React from 'react';
import { mapStateToProps } from './class-components';

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
export const useStore = <C>(
  getStore: () => SelectorFromANestedStore<C>,
  deps?: React.DependencyList,
) => {
  const result = React.useMemo(() => getStore(), deps);
  React.useEffect(() => {
    return () => { setTimeout(() => result().removeFromContainingStore()) }
  }, []);
  return result;
}

type Function<S, R> = (arg: DeepReadonly<S>) => R;
type MappedSelectorsToResults<S, X> = { [K in keyof X]: X[K] extends Function<S, infer E> ? E : never };

export const set = <S>(initialState: S, options?: OptionsForMakingAStore) => {
  const select = libSet(initialState, options);
  return {
    /**
     * Takes a function which selects from the store
     * @example
     * select(s => s.some.state).replace('test')
     */
    select,
    ...getCommonProperties(select),
  }
}

export const setEnforceTags = <S>(initialState: S, options?: OptionsForMakingAStore) => {
  const select = libSetEnforceTags(initialState, options);
  return {
    /**
     * Takes a function which selects from the store
     * @example
     * select(s => s.some.state).replace('test', 'MyComponent');
     * @example
     * select(s => s.some.state).replace('test', __filename);
     */
    select,
    ...getCommonProperties(select as SelectorFromAStore<S>),
  };
}

export const setNested = <S>(initialState: S, options: OptionsForMakingANestedStore) => {
  const select = libSetNested(initialState, options);
  return {
    /**
     * Takes a function which selects from the store
     * @example
     * select(s => s.some.state).replace('test');
     */
    select,
    ...getCommonProperties(select as SelectorFromAStore<S>),
  };
}

const getCommonProperties = <S>(select: SelectorFromAStore<S>) => {
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
    useSelector: <R>(selector: Function<S, R>, deps?: React.DependencyList) => useSelector(select, selector, deps),
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
    useDerivation: <X extends [Function<S, any>] | Function<S, any>[]>(inputs: X, deps?: React.DependencyList) => ({
      usingExpensiveCalc: <R>(calculation: (inputs: MappedSelectorsToResults<S, X>) => R) => {
        const selectors = inputs.map(input => useSelector(select, input));
        const allDeps = [...selectors];
        if (deps) { allDeps.push(...deps); }
        return React.useMemo(() => calculation(selectors as any), allDeps);
      }
    }),
    /**
     * Similar, in principal to React-Redux's `mapStateToProps()`
     * @param store The store that was previously defined using `make()` or `makeEnforceTags()`
     * @param mapper a function which takes in state from the store, and returns state which will be used
     * 
     * The following example component receives props from the store as well as from its parent component
     * ```
     * const select = make({ some: { state: { todos: new Array<string>() } } });
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
    mapStateToProps: <P extends {}, M extends {}>(mapper: (state: DeepReadonly<S>, ownProps: P) => M) => mapStateToProps(select, mapper)
  };
}


const useSelector = <S, R>(select: SelectorFromAStore<S>, selector: Function<S, R>, deps?: React.DependencyList) => {
  const storeOrDerivation = select(selector) as StoreOrDerivation<R>;
  const [selection, setSelection] = React.useState(storeOrDerivation.read());
  const allDeps = [storeOrDerivation.read()];
  if (deps) { allDeps.push(...deps); }
  React.useEffect(() => {
    const subscription = storeOrDerivation.onChange(arg => setSelection(arg));
    return () => subscription.unsubscribe();
  }, allDeps);
  return selection as R;
}