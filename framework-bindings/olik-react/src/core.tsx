/* eslint-disable react-hooks/rules-of-hooks */
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
      const [result, setResult] = React.useState({
        isLoading: true,
        wasRejected: false,
        wasResolved: false,
        error: null as any | null,
        storeValue: core.getSelectedStateFromOperationWithoutUpdatingStore(select, operation) as C,
      });
      React.useEffect(() => {
        let isSubscribed = false;
        isSubscribed = true;
        setResult(res => ({ ...res, isLoading: true }));
        operation()
          .then(storeValue => {
            if (isSubscribed) {
              setResult({ wasRejected: false, isLoading: false, error: null, wasResolved: true, storeValue })
            }
          })
          .catch(error => {
            if (isSubscribed) {
              setResult(res => ({ ...res, wasRejected: true, isLoading: false, error, wasResolved: false }))
            }
          });
        return () => { isSubscribed = false; }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const initState = React.useRef(initialState);
  const opts = React.useRef(options);
  const store = React.useMemo(() => {
    return core.createNestedStore(initState.current, opts.current);
  }, []);
  React.useEffect(() => {
    return () => {
      const devMode = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
      // In dev mode, React.StrictMode is enabled. We cannot allow the store to be detached in this instance because an 
      // error will be thrown the next time a developer saves a code update and then attempts to update the nested store state.
      if (!devMode) {
        store.detachFromGlobalStore();
      } else { // Reset the state. Note for future: It may be safest that this is the ONLY correct behavior (rather than detaching)
        store.reset();
      }
    }
  }, [store]);
  return {
    ...store,
    ...getUseSelector(store.get as core.SelectorFromAStore<C>),
    ...getUseDerivation(store.get as core.SelectorFromAStore<C>),
    ...getMapStateToProps(store.get as core.SelectorFromAStore<C>),
    ...getUseFetcher(store.get as core.SelectorFromAStore<C>),
  };
}

type Function<S, R> = (arg: core.DeepReadonly<S>) => R;
type MappedSelectorsToResults<S, X> = { [K in keyof X]: X[K] extends Function<S, infer E> ? E : never };

export function createGlobalStore<S>(initialState: S, options?: core.OptionsForMakingAGlobalStore) {
  const store = core.createGlobalStore(initialState, options);
  return {
    /**
     * Takes a function which selects from the store
     * @example
     * select(s => s.some.state).replace('test')
     */
    ...store,
    ...getUseSelector(store.get),
    ...getUseDerivation(store.get),
    ...getMapStateToProps(store.get),
    ...getUseFetcher(store.get),
  }
}

export function createGlobalStoreEnforcingTags<S>(initialState: S, options?: core.OptionsForMakingAGlobalStore) {
  const store = core.createGlobalStoreEnforcingTags(initialState, options);
  return {
    /**
     * Takes a function which selects from the store
     * @example
     * select(s => s.some.state).replace('test', 'MyComponent');
     * @example
     * select(s => s.some.state).replace('test', __filename);
     */
    ...store,
    ...getUseSelector(store.get as any as core.SelectorFromAStore<S>),
    ...getUseDerivation(store.get as any as core.SelectorFromAStore<S>),
    ...getMapStateToProps(store.get as any as core.SelectorFromAStore<S>),
    ...getUseFetcher(store.get as any as core.SelectorFromAStore<S>),
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
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const calc = React.useRef(calculation);
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const selectors = inputs.map(input => useSelector(select, input));
          const allDeps = [...selectors];
          if (deps) { allDeps.push(...deps); }
          // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps 
          return React.useMemo(() => calc.current(selectors as any), [calc, ...allDeps]);
        }
      }
    },
  };
}

type MappedStoresToResults<X> = { [K in keyof X]: X[K] extends core.Store<infer E, any> ? E : never };
export const useDerivationAcrossStores = <X extends [core.StoreOrDerivation<any>] | core.StoreOrDerivation<any>[]>(args: X, deps?: React.DependencyList) => {
  return {
    usingExpensiveCalc: function <R>(calculation: (inputs: MappedStoresToResults<X>) => R) {
      const selectors = args.map(arg => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [selection, setSelection] = React.useState(arg.read() as core.DeepReadonly<R>);
        const allDeps = [arg.read()];
        if (deps) { allDeps.push(...deps); }
        // eslint-disable-next-line react-hooks/rules-of-hooks
        React.useEffect(() => {
          const subscription = arg.onChange(arg => {
            setSelection(arg);
          });
          return () => subscription.unsubscribe();
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, allDeps);
        return selection as R;
      });
      const allDeps = [...selectors];
      if (deps) { allDeps.push(...deps); }
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return React.useMemo(() => calculation(selectors as any), [calculation, selectors]);
    }
  }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, allDeps);
  return selection as R;
}

// NOTES the following linting rules have been disabled in certain places:
// react-hooks/exhaustive-deps: We cannot forward deps from the enclosing function without receiving this linting error https://stackoverflow.com/questions/56262515/how-to-handle-dependencies-array-for-custom-hooks-in-react
// react-hooks/rules-of-hooks: We can guarantee the execution order of hooks in the context of the useDerivation() hook https://stackoverflow.com/questions/53906843/why-cant-react-hooks-be-called-inside-loops-or-nested-function
