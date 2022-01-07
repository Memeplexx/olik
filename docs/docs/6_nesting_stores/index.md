---
sidebar_label: 'Nesting stores'
---

# Nesting stores

#### A component-level store may be 'nested' inside an application-level store so that you can track your component state within your application state. 


## Understanding nesting (without a framework):

#### Application store:
```ts
import { createStore, trackWithReduxDevtools } from 'olik'

const store = createStore({ name: document.title, state: { str: '' } })
trackWithReduxDevtools({ store })
```

#### Component store:
```ts
import { createStore, nestStoreIfPossible, trackWithReduxDevtools } from 'olik'

class MyComponent {

  // Define store to manage component state & attempt to nest it
  const nested = createStore({ name: 'MyComponent', state: { num: 0 } })
  const ref = nestStoreIfPossible(
    { store: nested, containerName: document.title, instanceName: 1 })

  // This will register a new instance within Redux Devtools 
  // if container store could not be not found
  trackWithReduxDevtools({ store: nested })

  // Detach store from container when it is no longer being used
  onComponentDestroyed = () => ref.detach()
}
```

#### The above application store state should now look as follows:
```ts
{
  str: '',
  nested: {
    MyComponent: {
      1: {
        num: ''
      },
    },
  }
}
```
[**Demo 🥚**](https://codesandbox.io/s/attached-component-store-d9xqk?file=/src/index.ts)

## Framework bindings:
* [**React**](react)
* [**Angular**](angular)