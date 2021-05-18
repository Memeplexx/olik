import * as core from 'olik';
import React from 'react';

function getUseFetcher<S>(select: core.SelectorFromAStore<S>) {
  return {
    /**
     * A hook to track the status of an asynchronouse operation
     * 
     * @param fetchFn A no-args function returning a promise
     * 
     * @example
     * const {
     *   isLoading,
     *   wasRejected,
     *   wasResolved,
     *   error,
     *   storeValue,
     * } = useFetcher(() => select(s => s.todos).replaceAll(() => fetchTodosFromAPI()));
     */
    useFetcher: function useFetcher<C>(
      operation: () => Promise<C>,
      deps: React.DependencyList = [],
    ) {
      const initialValue = {
        isLoading: true,
        wasRejected: false,
        wasResolved: false,
        error: null as any | null,
        storeValue: core.getSelectedStateFromOperationWithoutUpdatingStore(select, operation) as C,
      };
      const [result, setResult] = React.useState(initialValue);
      React.useEffect(() => {
        let isSubscribed = false;
        isSubscribed = true;
        setResult(initialValue);
        operation()
          .then(storeValue => {
            if (isSubscribed) {
              setResult({ wasRejected: false, isLoading: false, error: null, wasResolved: true, storeValue })
            }
          })
          .catch(error => {
            if (isSubscribed) {
              setResult({ wasRejected: true, isLoading: false, error, wasResolved: false, storeValue: result.storeValue })
            }
          });
        return () => { isSubscribed = false; }
      }, deps);
      return result;
    },
  };
}

/**
 * A hook for creating a store which is capable of being nested inside your application store
 * @param initialState the initial state of the nested store you want to create
 * @param options additional options for creating a nested store which, at minimum, must specify the `name` of the store
 */
export function useNestedStore<C>(
  initialState: C,
  options: core.OptionsForMakingANestedStore,
) {
  const { select, read, detachFromAppStore } = React.useMemo(() => {
    return core.creatNestedStore(initialState, options);
  }, []);
  React.useEffect(() => {
    return () => {
      detachFromAppStore();
    }
  }, []);
  return {
    select,
    read,
    ...getUseSelector(select as core.SelectorFromAStore<C>),
    ...getUseDerivation(select as core.SelectorFromAStore<C>),
    ...getMapStateToProps(select as core.SelectorFromAStore<C>),
    ...getUseFetcher(select as core.SelectorFromAStore<C>),
  };
}

type Function<S, R> = (arg: core.DeepReadonly<S>) => R;
type MappedSelectorsToResults<S, X> = { [K in keyof X]: X[K] extends Function<S, infer E> ? E : never };

export function createAppStore<S>(initialState: S, options?: core.OptionsForMakingAStore) {
  const { select, read } = core.createAppStore(initialState, options);
  return {
    /**
     * Takes a function which selects from the store
     * @example
     * select(s => s.some.state).replace('test')
     */
    select,
    read,
    ...getUseSelector(select),
    ...getUseDerivation(select),
    ...getMapStateToProps(select),
    ...getUseFetcher(select),
  }
}

export function createAppStoreEnforcingTags<S>(initialState: S, options?: core.OptionsForMakingAStore) {
  const { select, read } = core.createAppStoreEnforcingTags(initialState, options);
  return {
    /**
     * Takes a function which selects from the store
     * @example
     * select(s => s.some.state).replace('test', 'MyComponent');
     * @example
     * select(s => s.some.state).replace('test', __filename);
     */
    select,
    read,
    ...getUseSelector(select as any as core.SelectorFromAStore<S>),
    ...getUseDerivation(select as any as core.SelectorFromAStore<S>),
    ...getMapStateToProps(select as any as core.SelectorFromAStore<S>),
    ...getUseFetcher(select as any as core.SelectorFromAStore<S>),
  };
}

function getMapStateToProps<S>(select: core.SelectorFromAStore<S>) {
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
    mapStateToProps: function <P extends {}, M extends {}>(mapper: (state: core.DeepReadonly<S>, ownProps: P) => M) {
      return (Component: React.ComponentType<M>) => {
        return class TodoWrapper extends React.PureComponent<P, M> {
          sub = (select() as core.Store<S, any>).onChange(s => this.setState(mapper(s, this.props)));
          constructor(props: any) {
            super(props);
            this.state = mapper(select().read() as core.DeepReadonly<S>, this.props);
          }
          static getDerivedStateFromProps(props: P) {
            return mapper(select().read() as core.DeepReadonly<S>, props);
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

function getUseSelector<S>(select: core.SelectorFromAStore<S>) {
  return {
    /**
     * A hook to select a specific part of the state tree
     * @param selector a selection from the store
     * @param deps an optional array of values upon which the calculation depends
     * @example
     * const str = useSelector(s => s.some.state);
     * @example
     * const [id, setId] = React.useState(0);
     * const todo = useSelector(s => s.some.todos.findWhere(t => t.id === id), [id]);
     */
    useSelector: function <R>(selector: Function<S, R>, deps: React.DependencyList = []) {
      return useSelector(select, selector, deps);
    },
  };
}

function getUseDerivation<S>(select: core.SelectorFromAStore<S>) {
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
    useDerivation: function <X extends [Function<S, any>] | Function<S, any>[]>(inputs: X, deps?: React.DependencyList) {
      return {
        usingExpensiveCalc: function <R>(calculation: (inputs: MappedSelectorsToResults<S, X>) => R) {
          const selectors = inputs.map(input => useSelector(select, input));
          const allDeps = [...selectors];
          if (deps) { allDeps.push(...deps); }
          return React.useMemo(() => calculation(selectors as any), allDeps);
        }
      }
    },
  };
}

function useSelector<S, R>(select: core.SelectorFromAStore<S>, selector: Function<S, R>, deps?: React.DependencyList) {
  const storeOrDerivation = select(selector) as core.StoreOrDerivation<R>;
  const [selection, setSelection] = React.useState(storeOrDerivation.read() as core.DeepReadonly<R>);
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

