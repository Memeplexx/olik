---
sidebar_label: 'Angular'
sidebar_position: 2
---

# Reading state with Angular

#### Olik-NG contains functions to read state and memoise expensive derivations  

---

🥚 Let's begin with the following store:
```ts
const store = createStore({
  name: document.title,
  state: {
    todos: new Array<{ id: number, title: string, done: boolean }>(),
    showDone: false,
  }
});
```

### Observing state
You can observe a selected node of your state tree using the `observe()` function
```html
<div *ngFor="let todo of todos$ | async">
  {{todo.title}}
</div>
```
```ts {4}
@Component({...})
class MyComponent {
  todos$ = store.todos
    .observe();
}
```
[**Demo 🥚**](https://codesandbox.io/s/olik-ng-read-iwyd3?file=/src/app/app.component.ts)

### Deriving computationally expensive state
The `derive()` function allows you to derive computationally expensive state.
```ts {5-7}
import { derive } from 'olik-ng';

@Component({...})
class MyComponent {
  completedTodos$ = derive(store.todos, store.showDone)
    .with((todos, showDone) => todos.filter(todo => todo.done === showDone))
    .observe();
}
```
[**Demo 🥚**](https://codesandbox.io/s/olik-ng-memoise-supgo?file=/src/app/app.component.ts)

### Consuming observables more easily
The `combineComponentObservables()` is a *convenience* function that:
* Removes the need to declare an `async` pipe for *every* observable in your template. This can make writing conditional logic way less verbose.
* Allows you to read your component observables, synchronously, without subscribing to them.  

```html {1}
<ng-container *ngIf="obs$ | async; let obs;">
  <div>Todos for user: {{obs.username$}}</div>
  <div *ngFor="let todo of obs.todos$"> {{todo.title}} </div>
</ng-container>
```
```ts {8,11}
import { combineComponentObservables } from 'olik-ng';

@Component({...})
class AppComponent {

  username$ = store.username.observe()
  todos$ = store.todos.observe()
  obs$ = combineComponentObservables<AppComponent>(this)

  ngAfterViewInit() {
    console.log({ todos: this.obs$.todos$ }) // synchronous read
  }
}
```
[**Demo 🥚**](https://codesandbox.io/s/olik-ng-combinecomponentobservables-trh42?file=/src/app/app.component.ts)

> Note that the `obs$` variable:
* must **not** be renamed.
* must be the **last** observable variable you declare.