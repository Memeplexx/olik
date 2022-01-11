---
sidebar_label: 'Nesting stores'
---

# Nesting stores

#### You can nest a component-level store within your application-level store. This allows you to track its state together with your application state. 



🥚 Let's begin with the following store:
```ts
import {
  createStore,
  importOlikNestingModule,
  importOlikReduxDevtoolsModule
} from 'olik'

importOlikNestingModule()
importOlikReduxDevtoolsModule()

const store = createStore({
  name: document.title,
  state: { str: '' },
})
```

### Creating a nested store
To create a nested store, you must provide the name of its container store. If the container store could not found, then your nested store will be registered as a separate store. This allows you to build your component outside your application.
```ts {8}
import { createStore, detachNestedStore } from 'olik'

class MyComponent {

  // Define store to manage component state & attempt to nest it
  const nestedStore = createStore({
    name: 'MyComponent',
    nestStore: { hostStoreName: document.title, instanceId: 1 },
    state: { num: 0 },
  })
  
  // Detach store from container when it is no longer being used
  onComponentDestroyed = () => detachNestedStore(this.nestedStore)
}
```
You should now see that your application state has a new property called `nested` which contains the state for `MyComponent`.

[**Demo 🥚**](https://codesandbox.io/s/attached-component-store-d9xqk?file=/src/index.ts)

## Framework bindings:
* [**React**](react)
* [**Angular**](angular)