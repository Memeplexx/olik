---
sidebar_label: 'Nesting stores'
---

# Nesting stores

#### A component-level store may be 'nested' inside an application-level store so that you can track your component state within your application state. 


## Nesting without a framework:

#### Application store:
```ts
import { createStore, trackWithReduxDevtools } from 'olik'

const store = createStore({ name: document.title, state: { string: '' } })
trackWithReduxDevtools({ store })
```

#### Component store:
```ts {7-8}
import { createStore, nestStoreIfPossible, trackWithReduxDevtools } from 'olik'

class MyComponent {

  // Define store to manage component state & attempt to nest it
  const nested = createStore({ name: 'MyComponent', state: { number: 0 } })
  const ref = nestStoreIfPossible(
    { store: nested, containerStoreName: document.title, instanceName: 1 })

  // Track store within Redux Devtools if container store cannot found
  trackWithReduxDevtools({ store: nested })

  // Optionally detach store from container when it is no longer being used
  onComponentDestroyed = () => ref.detach()
}
```

#### The above application store state should now look as follows:
```ts
{
  string: '',
  nested: {
    MyComponent: {
      1: {
        number: ''
      },
    },
  }
}
```
[**Demo 🥚**](https://codesandbox.io/s/attached-component-store-d9xqk?file=/src/index.ts)

## Nesting without a framework:
* [**React**](react)