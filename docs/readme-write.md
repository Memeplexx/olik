# OULIK - WRITING STATE #

👉 Let's first assume that your store has been initialized as follows:
```Typescript
import { make } from 'oulik';

const store = make('store', {
  user: { firstName: '', lastName: '', age: 0 },
  todos: new Array<{ id: number, text: string, status: 'todo' | 'done' }>()
});
```
## Updating **non-array** nodes ##
```Typescript
store(s => s.user).replaceWith({ firstName: 'Sam', lastName: 'Jones', age: 25 });

store(s => s.user).patchWith({ firstName: 'Sam', age: 25 });

store(s => s.user.age).replaceWith(25);
```

## Updating **array** nodes ##
```Typescript
store(s => s.todos).addAfter(newTodos);

store(s => s.todos).addBefore(newTodos);

store(s => s.todos).patchWhere(t => t.status === 'done').with({ status: 'todo' });

store(s => s.todos).removeAll();

store(s => s.todos).removeFirst();

store(s => s.todos).removeLast();

store(s => s.todos).removeWhere(t => t.status === 'done');

store(s => s.todos).replaceAll(newTodos);

store(s => s.todos).replaceWhere(t => t.id === 5).with({ id: 5, text: 'bake cookies', status: 'todo' });

store(s => s.todos).upsertWhere(t => t.id === 5).with({ id: 5, text: 'bake cookies', status: 'todo' });

store(s => s.todos.find(t => t.id === 2)!.text).replaceWith('something else');
```

## Enforcing the use of **tags** ##
We can require that all updates are supplemented with a 'tag' which helps to identify the origin of a state update within the devtools.  
```Typescript
const store = makeEnforceTags('my store', { some: { value: '' } });

store(s => s.some.value).replaceWith('hello', 'MyComponent');
```
You could also use the `__filename` node global object as a tag. Angular CLI users will need to check out [this guide](./readme-ng-tags.md)  
