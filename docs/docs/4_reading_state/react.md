---
sidebar_label: 'React'
sidebar_position: 1
---

# Reading state with React

#### Olik-React contains hooks to read state and memoise expensive derivations  

---

🥚 Let's begin with the following store:
```ts
const store = createStore({
  name: document.title,
  state: {
    todos: new Array<{ id: number, title: string, done: boolean }>(),
    showDone: false,
  }
});
```

### Reading state
```tsx
export function App() {
  const todos = store.todos.useState();

  return todos.map(todo => (<div key={todo.id}>{todo.name}</div>));
}
```
[**Demo - no deps 🥚**](https://codesandbox.io/s/olik-react-usestate-hook-d3z0y?file=/src/App.tsx) &nbsp;&nbsp;&nbsp; [**Demo - with deps 🥚**](https://codesandbox.io/s/olik-react-usestate-with-deps-7pf9d?file=/src/App.tsx)

### Deriving computationally expensive state
```tsx
export function App() {
  const todos = derive(store.todos, store.showDone)
    .with((todos, showDone) => todos.filter(todo => todo.done === showDone))
    .useState()

  return todos.map(todo => (<div key={todo.id}>{todo.name}</div>));
}
```

[**Demo - no deps 🥚**](https://codesandbox.io/s/olik-react-derivefrom-jv9dd?file=/src/App.tsx) &nbsp;&nbsp;&nbsp; [**Demo - with deps 🥚**](https://codesandbox.io/s/olik-react-derivefrom-with-deps-z7x4i?file=/src/App.tsx)