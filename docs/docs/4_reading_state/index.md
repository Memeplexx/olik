---
sidebar_label: 'Reading state'
---

# Reading state

#### Olik supports synchonous reads and the ability to listen for updates to a node  

---

### **Synchronous** reads  
The following statements are equivalent to each other:
```ts
const todos = store.todos.state;
```
```ts
const todos = store.state.todos;
```


### **Listening** to state changes
You can receive events when a selected node is updated as follows.  
*(Remember to **always** unsubscribe to avoid a memory leak).*
```ts
const sub = store.user
  .onChange(u => console.log(u));
sub.unsubscribe();
```

### **Framework-specific** APIs:
* [**React**](react)
* [**Angular**](angular)
