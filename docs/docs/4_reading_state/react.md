---
sidebar_label: 'React'
sidebar_position: 1
---

# Reading state with **React**

#### Olik-React contains hooks to read state and memoise expensive derivations  

🥚 Let's begin with the following store:
```ts
const get = createStore({
  todos: new Array<{ id: number, title: string, done: boolean }>(),
  showDone: false,
});
```

### **Read** state
```tsx
export function App() {
  const todos = get.todos.useState();

  return todos.map(todo => (<div key={todo.id}>{todo.name}</div>));
}
```
<div>
  <a class="code-sandbox-demo" href="https://codesandbox.io/s/olik-react-usestate-hook-d3z0y?file=/src/App.tsx" target="_blank" title="Basic demo">Demo 1<img/></a>
  <a class="code-sandbox-demo" href="https://codesandbox.io/s/olik-react-usestate-with-deps-7pf9d?file=/src/App.tsx" target="_blank" title="Demo showing hook with dependencies">Demo 2<img/></a>
</div>

### **Derive** computationally expensive state
```tsx
export function App() {
  const todos = derive(get.todos, get.showDone)
    .with((todos, showDone) => todos.filter(todo => todo.done === showDone))
    .useState()

  return todos.map(todo => (<div key={todo.id}>{todo.name}</div>));
}
```
<div>
  <a class="code-sandbox-demo" href="https://codesandbox.io/s/olik-react-derivefrom-jv9dd?file=/src/App.tsx" target="_blank" title="Basic demo">Demo 1<img/></a>
  <a class="code-sandbox-demo" href="https://codesandbox.io/s/olik-react-derivefrom-with-deps-z7x4i?file=/src/App.tsx" target="_blank" title="Demo showing hook with dependencies">Demo 2<img/></a>
</div>