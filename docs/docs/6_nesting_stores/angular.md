---
sidebar_label: 'Angular'
sidebar_position: 2
---

# Nesting stores with Angular

🥚 Let's begin with the following store:

```ts
export const store = createStore({
  name: document.title,
  state: { str: '' }
})

trackWithReduxDevtools({ store })
```

### **Creating** and nesting a store
```ts 
@Component({ ... })
export class IncrementorComponent implements OnInit, OnDestroy {

  store = createStore({ name: 'Incrementor', state: { num: 0 } })
  nestStoreRef?: NestStoreRef;
  @Input() id: number;

  ngOnInit() {
    this.nestStoreRef = nestStoreIfPossible({
      store: this.store,
      containerName: document.title,
      instanceName: this.id,
    })
    trackWithReduxDevtools({ store: this.store });
  }

  ngOnDestroy() {
    this.nestStoreRef?.detach();
  }
}
```
[**Demo 🥚**](https://codesandbox.io/s/olik-ng-nested-stores-gt4bg?file=/src/app/incrementor/incrementor.component.ts]
