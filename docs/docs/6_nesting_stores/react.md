---
sidebar_label: 'React'
sidebar_position: 1
---

# Nesting stores with React

🥚 Let's begin with the following store:

```ts
import { createStore } from 'olik-react'

export const store = createStore({
  name: document.title,
  state: { str: '' }
})

trackWitHReduxDevtools({ store })
```

### **Creating** and nesting a store
The `useNestedStore()` hook returns a store which will exist for the lifetime of your component
```tsx
const IncrementorComponent = (props: { id: number }) => {

  const nested = useNestedStore({
    name: 'Incrementor',
    instanceName: props.id,
    containerName: document.title,
    state: { num: 0 }
  })
  React.useMemo(() => trackWithReduxDevtools({ store: nested }), []);

  const num = nested.num.useState();

  return (
    <button onClick={() => nested.num.increment(1)}>+</button>
    <div>Result: {num}</div>
  )
}
```
[**Demo 🥚**](https://codesandbox.io/s/olik-react-nested-stores-ve6lj?file=/src/App.tsx)
