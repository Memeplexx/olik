---
sidebar_label: 'Angular'
sidebar_position: 2
---

# Nesting stores with Angular

🥚 Let's begin with the following store:

```ts {6}
export const store = createStore({
  name: document.title,
  state: { str: '' },
})

enableNesting()
```

### **Creating** a nested a store
```ts {6,11}
@Component({ ... })
export class IncrementorComponent implements OnDestroy {

  nestedStore = createStore({
    name: 'Incrementor',
    tryToNestWithinStore: document.title,
    state: { num: 0 },
  })

  ngOnDestroy() {
    detachNestedStore(this.nestedStore)
  }
}
```
[**Demo 🥚**](https://codesandbox.io/s/olik-ng-nested-stores-gt4bg?file=/src/app/incrementor/incrementor.component.ts)
