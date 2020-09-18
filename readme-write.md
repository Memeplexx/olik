# OULIK - WRITING STATE #

👉 Let's first assume that a store has been initialized as follows:
```Typescript
import { make } from 'oulik';

const getStore = make('store', {
  user: { firstName: '', lastName: '', age: 0 },
  todos: new Array<{ id: number, text: string, status: 'todo' | 'done' }>()
});
```
## Updating **non-array** nodes ##
```Typescript
// Completely replace an object or primitive
getStore(s => s.user).replaceWith(updatedUser);

// Partially update an object
getStore(s => s.user).patchWith({ firstName: 'Sam', age: 25 });

// Completely replace a primitive
getStore(s => s.user.age).replaceWith(25);
```

## Updating **array** nodes ##
```Typescript
// Append one or more elements to the end of array
getStore(s => s.todos).addAfter(...newTodos);

// Prepend one or more elements to the beginning of array
getStore(s => s.todos).addBefore(...newTodos);

// Partially update zero or more elements which match a specific condition
getStore(s => s.todos).patchWhere(t => t.status === 'done').with({ status: 'todo' });

// Remove all elements from array
getStore(s => s.todos).removeAll();

// Delete first element from array
getStore(s => s.todos).removeFirst();

// Delete last element from array
getStore(s => s.todos).removeLast();

// Delete zero or more elements which match a specific condition
getStore(s => s.todos).removeWhere(t => t.status === 'done');

// Substitute all elements with a new array
getStore(s => s.todos).replaceAll(newTodos);

// Substitute zero or more elements which match a specific condition
getStore(s => s.todos).replaceMany(t => t.status === 'todo').with(newTodo);

// Subtitute one element
getStore(s => s.todos).replaceWhere(t => t.id === 5).with({ id: 5, text: 'bake cookies', status: 'todo' });

// Subtitute or append an element depending on whether or not it can be found.
getStore(s => s.todos).upsertWhere(t => t.id === 5).with({ id: 5, text: 'bake cookies', status: 'todo' });

// Nested update (note: '!' is included below only to comply with Typescript's 'strictNullChecks')
getStore(s => s.array.find(e => e.id === 2)!.text).replaceWith('something');
```
