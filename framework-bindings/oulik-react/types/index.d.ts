import { AvailableOps, Fetcher, Tag, Unsubscribable } from 'oulik';
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
 * const todosFetcher = store(s => s.todos).createFetcher(
 *   () => new Promise(resolve => fetchTodosFromApi()), { cacheForMillis: 1000 * 60 });
 *
 * // inside your functional component
 * const [loading, error, todos] = useFetcher(todosFetcher);
 * ```
 */
export declare function useFetcher<S, C, B extends boolean>(fetcher: Fetcher<S, C, B>, tag: Tag<B>): {
    isLoading: boolean;
    data: C;
    hasError: boolean;
    error: null;
};
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
export declare function mapStateToProps<C, P extends {}, M extends {}, B extends boolean>(store: AvailableOps<any, C, B>, mapper: (state: C, ownProps: P) => M): (Component: React.ComponentType<M>) => {
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
