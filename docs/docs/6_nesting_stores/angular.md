---
sidebar_label: 'Angular'
sidebar_position: 2
---

# Nesting stores with Angular

🥚 Let's begin with the following store:

```ts
import { createStore } from 'olik-ng'

export const store = createStore({
  name: document.title,
  state: { str: '' }
})

trackWitHReduxDevtools({ store })
```

### **Creating** and nesting a store
```ts 
import { createStore } from 'olik-ng';

@Component({ ... })
export class IncrementorComponent implements OnInit, OnDestroy {

  store = createStore({ name: 'Incrementor', state: { num: 0 } })
  nestStoreRef: NestStoreRef;
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
