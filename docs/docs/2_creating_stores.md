---
sidebar_label: 'Creating stores'
sidebar_position: 2
---

# Creating stores

### A store can be defined as follows
```ts
import { createStore } from 'olik'

export const store = createStore({
  name: document.title,     // can be any user-defined string
  state: { hello: 'world' } // can be any serializable, plain Javascript object
})
```

> 💡 Although Olik works with arbitrarily deep state-trees, normalizing your state is still advised.
[**This guide**](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape), from the Redux docs, explains the benefits of normalizing your state tree.

### Integrating with the Redux Devtools Extension
```ts
import { enableReduxDevtools } from 'olik'

enableReduxDevtools()

export const store = createStore({
  /* other properties */
  trackWithReduxDevtools: true,
})
```