import { SelectorFromANestedStore, Store, Trackability, Unsubscribable } from 'oulik';
import React, { DependencyList } from 'react';
export * from 'oulik';
/**
 * A hook to select a specific part of the state
 * @param store either a normal store, or a derived store
 * @param deps an optional array of dependencies
 *
 * @example 1: NORMAL STORE SELECTION
 * ```
 * const value = useSelector(
 *   get(s => s.some.property)
 * );
 * ```
 *
 * @example 2: DERIVED STORE SELECTION
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
export declare function useSelector<C>(store: {
    read: () => C;
    onChange: (listener: (value: C) => any) => Unsubscribable;
}, deps?: DependencyList): C;
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
 * const { isLoading, hasError, succeeded, error, data, refetch } = useFetcher(() => fetchTodosFromApi(index: number, offset: number));
 * const todos = useSelector(get(s => s.todos));
 * ```
 */
export declare function useFetcher<C>(fetchFn: () => Promise<C>): {
    isLoading: boolean;
    hasError: boolean;
    succeeded: boolean;
    error: any;
    data: C | null;
    refetch: (fetcher: () => Promise<C>) => void;
};
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
export declare function useStore<C>(getStore: () => SelectorFromANestedStore<C>): SelectorFromANestedStore<C>;
/**
 * Similar, in principal to React-Redux's `mapStateToProps()`
 * @param store The store that was previously defined using `make()` or `makeEnforceTags()`
 * @param mapper a function which takes in state from the store, and returns state which will be used
 *
 * The following example component receives props from the store as well as from its parent component
 * ```
 * const get = make({ some: { state: { todos: new Array<string>(), user: { firstName: '' } } } });
 *
 * class Todo extends React.Component<{ todos: ReadonlyArray<string>, userName: string, someProp: number }> {
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
export declare function mapStateToProps<C, P extends {}, M extends {}, B extends Trackability>(store: Store<C, B>, mapper: (state: C, ownProps: P) => M): (Component: React.ComponentType<M>) => {
    new (props: any): {
        sub: Unsubscribable;
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
    contextType?: React.Context<any> | undefined;
};
