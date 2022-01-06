---
layout: default
title: React
nav_order: 1
has_children: false
permalink: /docs/async-state/react
parent: Async state
---

# Nesting stores with React

🥚 Let's begin with the following store:

```ts
import { createApplicationStore } from 'olik-react'

export const select = createApplicationStore({ /* initial application state */ })
```

### **Creating** a component store
The `useNestedStore()` hook returns a store which will exist for the lifetime of your component
```tsx
const TodoComponent = (props: { todoId: number }) => {
  const nested = useNestedStore({
    name: 'TodoComponent',
    instanceName: props.todoId,
    containerStoreName: 'MyApp',
    state: {
      num: 0,
      str: "abc"
    }
  })
}
```
[**Demo 🥚**](https://codesandbox.io/s/olik-react-nested-stores-ve6lj?file=/src/App.tsx)
