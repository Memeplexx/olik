# REACT BINDINGS #
```console
npm install oulik-react
```
```Typescript
import { useSelector, mapStateToProps } from 'oulik-react';

// WITH HOOKS
const todos = useSelector(get(s => s.todos));

// WITHOUT HOOKS
class MyComponent extends React.Component<{ userName: string, propFromParent: number }> {
}

export default mapStateToProps(get, (state, ownProps: { propFromParentComponent: string }) => ({
  userName: state.user.profile.firstName,
  propFromParent: ownProps.propFromParentComponent,
}))(MyComponent);
```


## ASYNC READ ##

```Typescript
const fetchTodos = get(e => e.todos).createFetcher(() => fetchTodos(), { cacheForMillis: 1000 * 60 });

const { isLoading, data, hasError, error } = useFetcher(todosFetcher);
```

## BEST PRACTICES ##

Oulik is absurdly simple to use, and most of the time, the API corrals you into making only 1 decision.  
That said, if you don't already have some experience with Redux or NGRX, it's worth checking this small guide.
