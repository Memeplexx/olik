---
sidebar_label: 'Reading state'
---

# Reading state

#### Olik supports synchonous reads and the ability to listen for updates to a node  

---

### **Synchronous** reads  
The following statements are equivalent to each other:
```ts
const todos = get.todos.state;
```
```ts
const todos = get.state.todos;
```


