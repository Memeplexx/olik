import { DeepReadonly, SelectorFromAStore, Store, Trackability } from "olik";
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
// export function mapStateToProps<C, P extends {}, M extends {}, T extends Trackability>(
//   store: Store<C, T>,
//   mapper: (state: DeepReadonly<C>, ownProps: P) => M,
// ) {
//   return (Component: React.ComponentType<M>) => {
//     return class TodoWrapper extends React.PureComponent<P, M> {
//       sub = store.onChange(s => this.setState(mapper(s, this.props)));
//       constructor(props: any) {
//         super(props);
//         this.state = mapper(store.read(), this.props);
//       }
//       static getDerivedStateFromProps(props: P) {
//         return mapper(store.read(), props);
//       }
//       render() {
//         return (
//           <Component {...this.state} />
//         )
//       }
//       componentWillUnmount() {
//         this.sub.unsubscribe();
//       }
//     }
//   }
// }

export function mapStateToProps<C, P extends {}, M extends {}>(
  select: SelectorFromAStore<C>,
  mapper: (state: DeepReadonly<C>, ownProps: P) => M,
) {
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