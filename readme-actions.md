# OULIK - WRITING STATE #

*NOTE: it is assumed that the below examples are preceeded with a selection from the store, for example:*

```Typescript
store
  .select(s => s.some.nested.piece.of.state)
```
---

## Non-array updates ##

```Typescript
  // Partially update an object
  .patch({ firstName: 'Sam', age: 25 });

  // Completely replace an object or primitive
  .replace(updatedUser);
```

## Array updates ##

```Typescript
  // Append one or more elements to the end of array
  .insertAfter(...newTodos);

  // Prepend one or more elements to the beginning of array
  .insertBefore(...newTodos);

  // Partially update zero or more elements which match a specific condition
  .patchWhere(t => t.status === 'done').with({ status: 'todo' });

  // Remove all elements from array
  .removeAll();

  // Delete first element from array
  .removeFirst();

  // Delete last element from array
  .removeLast();

  // Delete zero or more elements which match a specific condition
  .removeWhere(t => t.status === 'done')

  // Substitute all elements with a new array
  .replaceAll(newTodos);

  // Substitute zero or more elements which match a specific condition
  .replaceMany(t => t.status === 'todo').with(newTodo);

  // Subtitute one element
  .replaceOne(t => t.id === 5).with({ id: 5, text: 'bake cookies' });

  // Subtitute or appends an element depending on whether or not it can be found.
  .upsertOne(t => t.id === 5).with({ id: 5, text: 'bake cookies' });

  // Filter for element(s) so that an operation can be performed on them
  .filter(e => e.id === 1)
  //...do something
```
