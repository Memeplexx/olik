import { DeepReadonly, OptionsForMakingANestedStore, OptionsForMakingAStore, SelectorFromAStore } from 'olik';
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
export declare function useFetcher<C>(fetchFn: () => Promise<C>, deps?: React.DependencyList): {
    isLoading: boolean;
    hasError: boolean;
    succeeded: boolean;
    error: any;
    data: C | null;
    refetch: (fetcher: () => Promise<C>) => void;
};
/**
 * A hook for creating a store which is capable of being nested inside your application store
 * @param initialState the initial state of the nested store you want to create
 * @param options additional options for creating a nested store, which at minimum, must specify the `name` of the store
 * @param deps optional list of dependencies under which a store should be re-created
 */
export declare function useNestedStore<C>(initialState: C, options: OptionsForMakingANestedStore, deps?: React.DependencyList): {
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
    useDerivation: <X extends [Function<C, any>] | Function<C, any>[]>(inputs: X, deps?: React.DependencyList | undefined) => {
        usingExpensiveCalc: <R>(calculation: (inputs: MappedSelectorsToResults<C, X>) => R) => R;
    };
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
    useSelector: <R_1>(selector: Function<C, R_1>, deps?: React.DependencyList) => R_1;
    select: import("olik").SelectorFromANestedStore<C>;
};
declare type Function<S, R> = (arg: DeepReadonly<S>) => R;
declare type MappedSelectorsToResults<S, X> = {
    [K in keyof X]: X[K] extends Function<S, infer E> ? E : never;
};
export declare function set<S>(initialState: S, options?: OptionsForMakingAStore): {
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
    mapStateToProps: <P extends {}, M extends {}>(mapper: (state: DeepReadonly<S>, ownProps: P) => M) => (Component: React.ComponentType<M>) => {
        new (props: any): {
            sub: import("olik").Unsubscribable;
            render(): JSX.Element;
            componentWillUnmount(): void;
            context: any;
            setState<K extends keyof M>(state: M | ((prevState: Readonly<M>, props: Readonly<P>) => M | Pick<M, K> | null) | Pick<M, K> | null, callback?: (() => void) | undefined): void;
            forceUpdate(callback?: (() => void) | undefined): void;
            readonly props: Readonly<P> & Readonly<{
                children?: React.ReactNode;
            }>;
            state: Readonly<M>;
            refs: {
                [key: string]: React.ReactInstance;
            };
            componentDidMount?(): void;
            shouldComponentUpdate?(nextProps: Readonly<P>, nextState: Readonly<M>, nextContext: any): boolean;
            componentDidCatch?(error: Error, errorInfo: React.ErrorInfo): void;
            getSnapshotBeforeUpdate?(prevProps: Readonly<P>, prevState: Readonly<M>): any;
            componentDidUpdate?(prevProps: Readonly<P>, prevState: Readonly<M>, snapshot?: any): void;
            componentWillMount?(): void;
            UNSAFE_componentWillMount?(): void;
            componentWillReceiveProps?(nextProps: Readonly<P>, nextContext: any): void;
            UNSAFE_componentWillReceiveProps?(nextProps: Readonly<P>, nextContext: any): void;
            componentWillUpdate?(nextProps: Readonly<P>, nextState: Readonly<M>, nextContext: any): void;
            UNSAFE_componentWillUpdate?(nextProps: Readonly<P>, nextState: Readonly<M>, nextContext: any): void;
        };
        getDerivedStateFromProps(props: P): M;
        contextType?: React.Context<any> | undefined;
    };
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
    useDerivation: <X extends [Function<S, any>] | Function<S, any>[]>(inputs: X, deps?: React.DependencyList | undefined) => {
        usingExpensiveCalc: <R>(calculation: (inputs: MappedSelectorsToResults<S, X>) => R) => R;
    };
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
    useSelector: <R_1>(selector: Function<S, R_1>, deps?: React.DependencyList) => R_1;
    /**
     * Takes a function which selects from the store
     * @example
     * select(s => s.some.state).replace('test')
     */
    select: SelectorFromAStore<S>;
};
export declare function setEnforceTags<S>(initialState: S, options?: OptionsForMakingAStore): {
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
    mapStateToProps: <P extends {}, M extends {}>(mapper: (state: DeepReadonly<S>, ownProps: P) => M) => (Component: React.ComponentType<M>) => {
        new (props: any): {
            sub: import("olik").Unsubscribable;
            render(): JSX.Element;
            componentWillUnmount(): void;
            context: any;
            setState<K extends keyof M>(state: M | ((prevState: Readonly<M>, props: Readonly<P>) => M | Pick<M, K> | null) | Pick<M, K> | null, callback?: (() => void) | undefined): void;
            forceUpdate(callback?: (() => void) | undefined): void;
            readonly props: Readonly<P> & Readonly<{
                children?: React.ReactNode;
            }>;
            state: Readonly<M>;
            refs: {
                [key: string]: React.ReactInstance;
            };
            componentDidMount?(): void;
            shouldComponentUpdate?(nextProps: Readonly<P>, nextState: Readonly<M>, nextContext: any): boolean;
            componentDidCatch?(error: Error, errorInfo: React.ErrorInfo): void;
            getSnapshotBeforeUpdate?(prevProps: Readonly<P>, prevState: Readonly<M>): any;
            componentDidUpdate?(prevProps: Readonly<P>, prevState: Readonly<M>, snapshot?: any): void;
            componentWillMount?(): void;
            UNSAFE_componentWillMount?(): void;
            componentWillReceiveProps?(nextProps: Readonly<P>, nextContext: any): void;
            UNSAFE_componentWillReceiveProps?(nextProps: Readonly<P>, nextContext: any): void;
            componentWillUpdate?(nextProps: Readonly<P>, nextState: Readonly<M>, nextContext: any): void;
            UNSAFE_componentWillUpdate?(nextProps: Readonly<P>, nextState: Readonly<M>, nextContext: any): void;
        };
        getDerivedStateFromProps(props: P): M;
        contextType?: React.Context<any> | undefined;
    };
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
    useDerivation: <X extends [Function<S, any>] | Function<S, any>[]>(inputs: X, deps?: React.DependencyList | undefined) => {
        usingExpensiveCalc: <R>(calculation: (inputs: MappedSelectorsToResults<S, X>) => R) => R;
    };
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
    useSelector: <R_1>(selector: Function<S, R_1>, deps?: React.DependencyList) => R_1;
    /**
     * Takes a function which selects from the store
     * @example
     * select(s => s.some.state).replace('test', 'MyComponent');
     * @example
     * select(s => s.some.state).replace('test', __filename);
     */
    select: SelectorFromAStore<S>;
};
export {};
