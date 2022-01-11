---
sidebar_label: 'Getting started'
sidebar_position: 1
---

# Getting started

#### Olik is designed to be framework-agnostic, however wrapper libs exist for a growing number of frameworks.

---

### Installing

If you're **not using a framework**:

```bash
npm install olik
```

If you're using **React**:

```bash
npm install olik olik-react
```
```ts
import { augmentOlikForReact } from 'olik-react'

augmentOlikForReact() // invoke before initializing store
```

If you're using **Angular**:

```bash
npm install olik olik-ng
```
```ts
import { OlikNgModule } from 'olik-ng'

@NgModule({ imports: [OlikNgModule] })
export class AppModule {}
```
---

### Creating a store
```ts
import { createStore, importOlikReduxDevtoolsModule } from 'olik'

importOlikReduxDevtoolsModule()    // optional

export const store = createStore({
  name: document.title,            // can be any user-defined string
  state: { hello: 'world' }        // can be any plain Javascript object
})
```

Although Olik works with arbitrarily deep state-trees, normalizing your state is still advised.
[**This guide**](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape), from the Redux docs, explains the benefits of normalizing your state tree.

