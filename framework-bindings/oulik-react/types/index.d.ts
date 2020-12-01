import { Store, FetchState, Unsubscribable, SelectorFromANestedStore } from 'oulik';
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
export declare function useSelector<C>(store: {
    read: () => C;
    onChange: (listener: (value: C) => any) => Unsubscribable;
}, deps?: DependencyList): C;
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
export declare function useFetcher<S, C, P, B extends boolean>(getFetch: () => FetchState<S, C, P, B>, deps?: DependencyList): {
    isLoading: boolean;
    hasError: boolean;
    error: any;
    data: C;
    storeData: C;
    refetch: import("oulik").FetchFunction<S, C, P, B>;
};
/**
 * A hook for creating a store which is capable of being nested inside your application store
 * @param getStore a no-args function which returns a new store
 *
 * EXAMPLE
 * ```typescript
 * const store = useStore(() => makeNested({ someString: '', someNumber: 0 }));
 * ```
 */
export declare function useStore<C>(getStore: () => SelectorFromANestedStore<C>): SelectorFromANestedStore<C>;
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
export declare function mapStateToProps<C, P extends {}, M extends {}, B extends boolean>(store: Store<C, B>, mapper: (state: C, ownProps: P) => M): (Component: React.ComponentType<M>) => {
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
