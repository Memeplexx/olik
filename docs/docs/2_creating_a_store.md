---
sidebar_label: 'Creating a Store'
sidebar_position: 2
---

# Creating a store

### A store can be defined as follows
```ts
import { createStore } from 'olik' /* or 'olik-react' or 'olik-ng' */

export const get = createStore({
  name: document.title,     // can be any user-defined string
  state: { hello: 'world' } // can be any serializable, plain Javascript object
})
```

### Structuring your initial state
Keep your state tree as flat as possible.  
[**This guide**](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape), from the Redux docs, explains the benefits of normalizing your state tree.

### Nesting stores
If you have already covered writing, reading, & async state, you may be interested in Nesting Stores to manage your component state.

### Lazily-loaded modules
Code modules, which are lazily loaded, may create their own AppStore. When downloaded, their store will be automatically merged in using the `deepMerge()` utility.