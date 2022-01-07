---
sidebar_label: 'Angular'
sidebar_position: 2
---

# Nesting stores with Angular

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
      containerStoreName: document.title,
      instanceName: this.id,
    })
    trackWithReduxDevtools({ store: this.store });
  }

  ngOnDestroy() {
    this.nestStoreRef?.detach();
  }
}
```
