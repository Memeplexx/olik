# OULIK - WRITING STATE #

## BEFORE WE BEGIN... ##
Let's first assume that a store has been initialized as follows:
```Typescript
import { make } from 'oulik';

const get = make({
  user: { firstName: '', lastName: '', age: 0 },
  todos: new Array<{ id: number, text: string, status: 'todo' | 'done' }>()
});
```
---
## UPDATING **NON-ARRAY** NODES ##
```Typescript
get(s => s.user).replaceWith({ firstName: 'Sam', lastName: 'Jones', age: 25 });

get(s => s.user).patchWith({ firstName: 'Sam', age: 25 });

get(s => s.user.age).replaceWith(25);
```

## UPDATING **ARRAY** NODES ##
```Typescript
get(s => s.todos).addAfter(arrayOfNewTodos);

get(s => s.todos).addBefore(arrayOfNewTodos);

get(s => s.todos).patchWhere(t => t.status === 'done').with({ status: 'todo' });

get(s => s.todos).removeAll();

get(s => s.todos).removeFirst();

get(s => s.todos).removeLast();

get(s => s.todos).removeWhere(t => t.status === 'done');

get(s => s.todos).replaceAll(arrayOfNewTodos);

get(s => s.todos).replaceWhere(t => t.id === 5).with({ id: 5, text: 'bake cookies', status: 'todo' });

get(s => s.todos).upsertWhere(t => t.id === 5).with({ id: 5, text: 'bake cookies', status: 'todo' });

get(s => s.todos).mergeWhere((currentTodo, newTodo) => currentTodo.id === newTodo.id).with(arrayOfNewTodos);

get(s => s.todos.find(t => t.id === 2)!.text).replaceWith('something else');
```

## ENFORCING THE USE OF **TAGS** ##
We can require that all updates are supplemented with a 'tag' which helps to identify the origin of a state update within the Devtools.  
```Typescript
const get = makeEnforceTags({ some: { value: '' } });

get(s => s.some.value).replaceWith('new value', 'MyComponent');
```
In the above example, we've used 'MyComponent' as the tag but any user-defined string is acceptable.  
For Webpack users, it may be more convenient to use the `__filename` node global object as a tag.  
For Angular-CLI users, you will need to refer to ***[this guide](./readme-ng-tags.md)*** to make use of the `__filename` variable.
