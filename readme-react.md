# REACT BINDINGS #
```console
npm install heerlik-react
```
```Typescript
import { useSelector, mapStateToProps } from 'heerlik-react';

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
const fetchTodos = store.createFetcher({
  selector: e => e.todos,
  fetcher: () => fetchTodos(),
  cacheForMillis: 1000 * 60,
});

const [todosLoading, todosError, todosError] = useFetcher(fetchTodos);
```
