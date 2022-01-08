---
sidebar_label: 'React'
sidebar_position: 1
---

# Nesting stores with React

🥚 Let's begin with the following store:

```ts {6}
export const store = createStore({
  name: document.title,
  state: { str: '' }
})

enableNesting()
```

### **Creating** a nested a store
The `useNestedStore()` hook returns a store which will exist for the lifetime of your component
```tsx {5}
const IncrementorComponent = (props: { id: number }) => {
  const nestedStore = useNestedStore({
    name: 'Incrementor',
    tryToNestWithinStore: document.title,
    state: { num: 0 },
  })

  return (/* rendered content */)
}
```
[**Demo 🥚**](https://codesandbox.io/s/olik-react-nested-stores-ve6lj?file=/src/App.tsx)
