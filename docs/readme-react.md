# REACT BINDINGS #
```console
npm install oulik-react
```
```Typescript
import { useSelector, mapStateToProps } from 'oulik-react';

// WITH HOOKS
const todos = useSelector(store, s => s.todos);

// WITHOUT HOOKS
class MyComponent extends React.Component<{ userName: string, propFromParent: number }> {
}

export default mapStateToProps(store, (state, ownProps: { propFromParentComponent: string }) => ({
  userName: state.user.profile.firstName,
  propFromParent: ownProps.propFromParentComponent,
}))(MyComponent);
```


## ASYNC READ ##

```Typescript
const fetchTodos = store(e => e.todos).createFetcher(() => fetchTodos(), { cacheForMillis: 1000 * 60 });

const { isLoading, data, hasError, error } = useFetcher(todosFetcher);
```
