# OULIK - WRITING STATE #

## BEFORE WE BEGIN... ##
Let's first assume that a store has been initialized as follows:
```Typescript
import { make } from 'oulik';

const select = make({
  user: { firstName: '', lastName: '', age: 0 },
  todos: new Array<{ id: number, text: string, status: 'todo' | 'done' }>()
});
```
---
## UPDATING **NON-ARRAY** NODES ##
```Typescript
select(s => s.user).replaceWith({ firstName: 'Sam', lastName: 'Jones', age: 25 });

select(s => s.user).patchWith({ firstName: 'Sam', age: 25 });

select(s => s.user.age).replaceWith(25);
```

## UPDATING **ARRAY** NODES ##
```Typescript
select(s => s.todos).addAfter(arrayOfNewTodos);

select(s => s.todos).addBefore(arrayOfNewTodos);

select(s => s.todos).patchWhere(t => t.status === 'done').with({ status: 'todo' });

select(s => s.todos).removeAll();

select(s => s.todos).removeFirst();

select(s => s.todos).removeLast();

select(s => s.todos).removeWhere(t => t.status === 'done');

select(s => s.todos).replaceAll(arrayOfNewTodos);

select(s => s.todos).replaceWhere(t => t.id === 5).with({ id: 5, text: 'bake cookies', status: 'todo' });

select(s => s.todos).upsertWhere(t => t.id === 5).with({ id: 5, text: 'bake cookies', status: 'todo' });

select(s => s.todos).mergeWhere((currentTodo, newTodo) => currentTodo.id === newTodo.id).with(arrayOfNewTodos);

select(s => s.todos.find(t => t.id === 2)!.text).replaceWith('something else');
```

## ENFORCING THE USE OF **TAGS** ##
We can require that all updates are supplemented with a 'tag' which helps to identify the origin of a state update within the Devtools.  
```Typescript
const select = makeEnforceTags({ some: { value: '' } });

select(s => s.some.value).replaceWith('new value', 'MyComponent');
```
In the above example, we've used 'MyComponent' as the tag but any user-defined string is acceptable.  
For Webpack users, it may be more convenient to use the `__filename` node global object as a tag.  
For Angular-CLI users, you will need to refer to ***[this guide](./readme-ng-tags.md)*** to make use of the `__filename` variable.
