---
sidebar_label: 'React'
sidebar_position: 1
---

# Reading state with **React**

#### Olik-React contains hooks to read state and memoise expensive derivations  

🥚 Let's begin with the following store:
```ts
const get = createStore({
  name: document.title,
  state: {
    todos: new Array<{ id: number, title: string, done: boolean }>(),
    showDone: false,
  }
});
```

### **Read** state
```tsx
export function App() {
  const todos = get.todos.useState();

  return todos.map(todo => (<div key={todo.id}>{todo.name}</div>));
}
```
[**Demo - no deps 🥚**](https://codesandbox.io/s/olik-ng-read-iwyd3?file=/src/app/app.component.ts) &nbsp;&nbsp;&nbsp; [**Demo - with deps 🥚**](https://codesandbox.io/s/olik-react-usestate-with-deps-7pf9d?file=/src/App.tsx)

### **Derive** computationally expensive state
```tsx
export function App() {
  const todos = derive(get.todos, get.showDone)
    .with((todos, showDone) => todos.filter(todo => todo.done === showDone))
    .useState()

  return todos.map(todo => (<div key={todo.id}>{todo.name}</div>));
}
```

[**Demo - no deps 🥚**](https://codesandbox.io/s/olik-react-derivefrom-jv9dd?file=/src/App.tsx) &nbsp;&nbsp;&nbsp; [**Demo - with deps 🥚**](https://codesandbox.io/s/olik-react-derivefrom-with-deps-z7x4i?file=/src/App.tsx)