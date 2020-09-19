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
// Append elements to the end of array
getStore(s => s.todos).addAfter(newTodos);

// Prepend elements to the beginning of array
getStore(s => s.todos).addBefore(newTodos);

// Partially elements which match a specific condition
getStore(s => s.todos).patchWhere(t => t.status === 'done').with({ status: 'todo' });

// Remove all elements from array
getStore(s => s.todos).removeAll();

// Delete first element from array
getStore(s => s.todos).removeFirst();

// Delete last element from array
getStore(s => s.todos).removeLast();

// Delete elements which match a specific condition
getStore(s => s.todos).removeWhere(t => t.status === 'done');

// Substitute all elements with a new array
getStore(s => s.todos).replaceAll(newTodos);

// Substitute elements which match a specific condition
getStore(s => s.todos).replaceMany(t => t.status === 'todo').with(newTodo);

// Subtitute one element
getStore(s => s.todos).replaceWhere(t => t.id === 5).with({ id: 5, text: 'bake cookies', status: 'todo' });

// Subtitute or append an element depending on whether or not it can be found.
getStore(s => s.todos).upsertWhere(t => t.id === 5).with({ id: 5, text: 'bake cookies', status: 'todo' });

// Nested update (note: '!' is included below only to comply with Typescript's 'strictNullChecks')
getStore(s => s.array.find(e => e.id === 2)!.text).replaceWith('something');
```

## Enforcing the use of **tags** ##
The debugging experience can be improved by supplying extra information describing the source of an action
```Typescript
import { make } from 'oulik';

// Note the use of 'makeEnforeTags()' instead of the usual 'make()'
const getStore = makeEnforceTags('store', { some: { value: '' } });

// Here, 'MyComponent' is the tag which is made obligatory due to the fact that we
// initialized the store using 'makeEnforeTags()' instead of the usual 'make()'.
getStore(s => s.some.value).replaceWith('hello', 'MyComponent');
```
Instead of always typing a user-defined string (such as 'MyComponent') you could make use of the `__filename` node variable which will automatically return the directory path of the current file.  
For Angular-CLI users, there is a little work to set this up, but still well worth the time. Check out this [guide on using the `__filename` variable within the Angular CLI](./readme-ng-tags.md)  
