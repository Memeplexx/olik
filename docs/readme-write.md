# OULIK - WRITING STATE #

👉 Let's first assume that a store has been initialized as follows:
```Typescript
import { make } from 'oulik';

const store = make('store', {
  user: { firstName: '', lastName: '', age: 0 },
  todos: new Array<{ id: number, text: string, status: 'todo' | 'done' }>()
});
```
## Updating **non-array** nodes ##
```Typescript
// Completely replace an object or primitive
store(s => s.user).replaceWith({ firstName: 'Sam', lastName: 'Jones', age: 25 });

// Partially update an object
store(s => s.user).patchWith({ firstName: 'Sam', age: 25 });

// Update a primitive
store(s => s.user.age).replaceWith(25);
```

## Updating **array** nodes ##
```Typescript
// Append elements to the end of array
store(s => s.todos).addAfter(newTodos);

// Prepend elements to the beginning of array
store(s => s.todos).addBefore(newTodos);

// Partially update elements which match a specific condition
store(s => s.todos).patchWhere(t => t.status === 'done').with({ status: 'todo' });

// Remove all elements from array
store(s => s.todos).removeAll();

// Delete first element from array
store(s => s.todos).removeFirst();

// Delete last element from array
store(s => s.todos).removeLast();

// Delete elements which match a specific condition
store(s => s.todos).removeWhere(t => t.status === 'done');

// Substitute all elements with a new array
store(s => s.todos).replaceAll(newTodos);

// Subtitute one element
store(s => s.todos).replaceWhere(t => t.id === 5).with({ id: 5, text: 'bake cookies', status: 'todo' });

// Subtitute or append an element depending on whether or not it can be found.
store(s => s.todos).upsertWhere(t => t.id === 5).with({ id: 5, text: 'bake cookies', status: 'todo' });

// Nested update (note: '!' is included below only to comply with Typescript's 'strictNullChecks')
store(s => s.todos.find(t => t.id === 2)!.text).replaceWith('something else');
```

## Enforcing the use of **tags** ##
The debugging experience can be improved by supplying extra information describing the source of an action
```Typescript
// Note the use of 'makeEnforeTags()' instead of the usual 'make()'
const store = makeEnforceTags('store', { some: { value: '' } });

// Here, 'MyComponent' is the tag which is made obligatory due to the fact that we
// initialized the store using 'makeEnforeTags()' instead of the usual 'make()'.
store(s => s.some.value).replaceWith('hello', 'MyComponent');
```
Instead of always typing a user-defined string (such as 'MyComponent') you could make use of the `__filename` node variable which will automatically return the directory path of the current file.  
For Angular-CLI users, there is a little work to set this up, but still well worth the time. Check out this [guide on using the `__filename` variable within the Angular CLI](./readme-ng-tags.md)  
