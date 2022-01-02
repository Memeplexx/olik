---
sidebar_label: 'Writing state'
sidebar_position: 3
---

# Writing state

#### Olik exposes a standardized set of state-update primitives to make the developer experience as transparent, consistent, and debuggable as possible.

🥚 Let's begin with the following store:
```ts
const get = createAppStore({
  user: {
    firstName: '',
    lastName: '',
    job: { title: '', contractor: false },
  },
  todos: new Array<{ id: number, name: string, done: boolean, urgency: number }>(),
});
```
### Writing **object and primitive** nodes
```ts
// Replace user's age with 29
get.user.age.replace(29)
```
```ts
// Increment user's age by 1
get.user.age.increment(1)
```
```ts
// Update some, but not all, user's details
get.user.patch({ firstName: 'Jeff', lastName: 'Anderson' })
```
```ts
// Deep-merge user object
get.user.deepMerge({ age: 21, job: { contractor: true } } )
```

### Writing **array** nodes

```ts
// Replace all elements in an array
get.todos.replaceAll(arrayOfTodos)
```
```ts
// Remove all elements from an array
get.todos.removeAll()
```
```ts
// Insert one element into the existing array
get.todos.insertOne(todo)
```
```ts
// Insert an array of elements into the existing array
get.todos.insertMany(arrayOfTodos)
```
```ts
// Insert an element (if it does not already exist) or update it (if it does)
get.todos.upsertMatching.id.withOne(todo)
```
```ts
// Insert elements (if they do not already exist) or update them (if they do)
get.todos.upsertMatching.id.withMany(arrayOfTodos)
```

### Writing **array element** nodes
In order for the library to generate highly descriptive action types, searching for array elements looks a little different from what you might expect.<br/>
Note: in the following examples `find()` is interchangeable with `filter()`.  

```ts
// Replace an array element
get.todos.find.id.eq(3).replace(todo)
```
```ts
// Remove an array element
get.todos.find.id.eq(3).remove()
```
```ts
// Partially update an array element
get.todos.find.id.eq(3).patch({ done: true })
```
```ts
// Apply multiple search clauses and comparators
get.todos.filter.done.eq(true).or.urgency.lt(3).remove()
```

---

### Performing **many writes** at once
Avoid unnecessary render cycles by performing many updates at once.
```ts
import { transact } from /* whichever version of olik you've installed */

transact(
  () => get.user.patch({ firstName: 'James', lastName: 'White' }),
  () => get.todos.removeAll(),
)
```