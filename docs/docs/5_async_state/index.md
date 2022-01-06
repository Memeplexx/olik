---
sidebar_label: 'Async state'
---

# Async state

#### Instead of updating state with a **value**, you can update it with a **promise**:

🥚 Let's begin with the following store:
```ts
import {
  createStore, enableAsyncActionPayloads
} from 'olik' // or 'olik-ng' or 'olik-react'

// 1. create store
type Todo = { id: number, title: string };
const get = createStore({
  name: document.title,
  state: {
    todos: new Array<Todo>(),
  }
});

// 2. import the ability to dispatch promises as payloads
enableAsyncActionPayloads();
```

### **Listening** to state changes
You can receive events when a selected node is updated as follows.  
*(Remember to **always** unsubscribe to avoid a memory leak).*
```ts
const subscription = get.user.onChange(u => console.log(u));
subscription.unsubscribe();
```

### **Fetching** state
```ts
const fetchTodos = () => fetch('http://api/todos')
  .then(res => res.json());

get.todos.replaceAll(fetchTodos)
```
[**Demo 🥚**](https://codesandbox.io/s/reading-async-state-3x6xh?file=/src/index.ts)

### **Writing** state
```ts
const updateTodo = (todo: Todo) => () => fetch(`http://api/todo/${todo.id}`, {
  method: 'POST',
  body: JSON.stringify(todo),
}).then(res => res.json());

get.todos
  .find.id.eq(3)
  .replace(updateTodo(todo))
```
[**Demo 🥚**](https://codesandbox.io/s/writing-async-state-r8rs6?file=/src/index.ts)

---

### **Framework-specific** APIs:
* [**React**](react)
* [**Angular**](angular)

---

### **Caching** data
The library uses your store as a cache and can avoid re-fetching for a specified period.
```ts
const fetchTodosFromAPI = () => fetch('http://api/todos');
get.todos.replaceAll(fetchTodosFromAPI, { cacheFor: 1000 * 60 })
```
[**Demo 🥚**](https://codesandbox.io/s/olik-demo-caching-data-no-framework-3rvz9?file=/src/index.ts)

### **Cache invalidation**
The following code will un-do the above.
```ts
get.todos.invalidateCache();
```
[**Demo 🥚**](https://codesandbox.io/s/olik-demo-cache-invalidation-no-framework-efore?file=/src/index.ts)

### **Optimistic** updates
You can make immediate updates, which will be rolled back if an error is thrown.
```ts
const setUserAsAdminOnAPI = (isAdmin: boolean) =>
  () => fetch('http://api/todos');
get.user.isAdmin
  .replace(setUserAsAdminOnAPI(true), { optimisticallyUpdateWith: true })
```
