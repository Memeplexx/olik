---
sidebar_label: 'Writing state'
sidebar_position: 3
---

# Writing state

#### Olik exposes a standardized set of state-update primitives to make the developer experience as transparent, consistent, and debuggable as possible.

🥚 Let's begin with the following store:
```ts
const store = createStore({
  name: 'MyStore',
  state: {
    user: {
      firstName: '',
      lastName: '',
      job: { title: '', contractor: false },
    },
    todos: new Array<{ id: number, name: string, done: boolean, urgency: number }>(),
  }
});
```
### Writing **object and primitive** nodes
```ts
// REPLACE USERS AGE WITH 29
store.user.age
  .replace(29)

// INCREMENT USERS AGE BY 1
store.user.age
  .increment(1)

// UPDATE SOME, BUT NOT ALL, USERS DETAILS
store.user
  .patch({ firstName: 'Jeff', lastName: 'Anderson' })

// DEEP-MERGE USER OBJECT
store.user
  .deepMerge({ age: 21, job: { contractor: true } } )
```

### Writing **array** nodes

```ts
// REPLACE ALL TODOS
store.todos
  .replaceAll(arrayOfTodos)

// REMOVE ALL TODOS
store.todos
  .removeAll()

// INSERT ONE TODO
store.todos
  .insertOne(todo)

// INSERT MANY TODOS
store.todos
  .insertMany(arrayOfTodos)

// INSERT ONE TODO (IF IT DOES NOT ALREADY EXIST) OR UPDATE IT (IF IT DOES)
store.todos
  .upsertMatching.id
  .withOne(todo)

// INSERT MANY TODOS (IF THEY DO NOT ALREADY EXIST) OR UPDATE THEM (IF THEY DO)
store.todos
  .upsertMatching.id
  .withMany(arrayOfTodos)

// MARK ALL TODOS AS DONE
store.todos.done
  .replaceAll(true)

// INCREMENT URGENCY OF ALL TODOS BY 1
store.todos.done
  .incrementAll(1)  
```

### Writing **array element** nodes
In order for the library to generate highly descriptive action types, searching for array elements looks a little different from what you might expect.<br/>
Note: in the following examples `find()` is interchangeable with `filter()`.  

```ts
// FIND A TODO BY ITS ID AND REPLACE IT
store.todos
  .find.id.eq(3)
  .replace(todo)

// FIND A TODO BY ITS ID AND REMOVE IT
store.todos
  .find.id.eq(3)
  .remove()

// FIND A TODO BY ITS ID AND PARTIALLY UPDATE AN IT
store.todos
  .find.id.eq(3)
  .patch({ done: true, urgency: 1 })

// FIND A TODO BY ITS ID AND REPLACE ITS URGENCY
store.todos
  .find.id.eq(3)
  .urgency
  .replace(5)

// APPLY MULTIPLE SEARCH CLAUSES WITH DIFFERENT COMPARATORS
store.todos
  .filter.done.eq(true).or.urgency.lt(3)
  .remove()
```

---

### Performing **many writes** at once
Avoid unnecessary render cycles by performing many updates at once.
```ts
import { transact } from /* whichever version of olik you've installed */

transact(
  () => store.user.patch({ firstName: 'James', lastName: 'White' }),
  () => store.todos.removeAll(),
)
```