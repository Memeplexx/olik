import { DeepReadonly, SelectorFromAStore } from "olik";
import React from "react";
/**
 * Similar, in principal to React-Redux's `mapStateToProps()`
 * @param store The store that was previously defined using `make()` or `makeEnforceTags()`
 * @param mapper a function which takes in state from the store, and returns state which will be used
 *
 * The following example component receives props from the store as well as from its parent component
 * ```
 * const select = make({ some: { state: { todos: new Array<string>(), user: { firstName: '' } } } });
 *
 * class Todo extends React.Component<{ todos: Array<string>, userName: string, someProp: number }> {
 *   // ...
 * }
 *
 * export default mapStateToProps(select(s => s.some.state), (state, ownProps: { someProp: number }) => ({
 *   todos: state.todos,
 *   userName: state.user.firstName,
 *   someProp: ownProps.someProp,
 * }))(Todo);
 * ```
 */
export declare function mapStateToProps<C, P extends {}, M extends {}>(select: SelectorFromAStore<C>, mapper: (state: DeepReadonly<C>, ownProps: P) => M): (Component: React.ComponentType<M>) => {
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
