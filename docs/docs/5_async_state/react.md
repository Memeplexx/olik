---
layout: default
title: React
nav_order: 1
has_children: false
permalink: /docs/async-state/react
parent: Async state
---

# Handling async state with React

## **Observing** fetches
We can track the status and results of a request via the `useFuture()` hook
```tsx {7}
export const fetchTodos = () =>
  fetch('http://example.com/todos').then(res => res.json());

const Component = () => {
  const future = get.todos
    .replaceAll(fetchTodos)
    .useFuture();
  return (
    <>
      {future.isLoading && <div>loading todos...</div>}
      {future.wasRejected && <div>error loading todos: {future.error}</div>}
      {future.wasResolved && future.storeValue.map(todo =>
        <div key={todo.id}>{todo.title}</div>
      )}
    </>
  )
}
```
[**Demo 🥚 **](https://codesandbox.io/s/olik-react-fetch-nj702)
