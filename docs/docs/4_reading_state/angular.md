---
sidebar_label: 'Angular'
sidebar_position: 2
---

# Reading state with **Angular**

#### Olik-NG contains functions to read state and memoise expensive derivations  

🥚 Let's begin with the following store:
```ts
const get = createStore({
  todos: new Array<{ id: number, title: string, done: boolean }>(),
  showDone: false,
});
```

### **Observe** state
You can observe a selected node of your state tree using the `observe()` function
```html
<div *ngFor="let todo of todos$ | async">
  {{todo.title}}
</div>
```
```ts
@Component({...})
class MyComponent {
  todos$ = get.todos.observe();
}
```
<a href="https://codesandbox.io/s/olik-ng-read-iwyd3?file=/src/app/app.component.ts" target="_blank">Demo <img/></a>

### **Derive** computationally expensive state
The `derive()` function allows you to derive computationally expensive state.
```ts
import { deriveFrom } from 'olik-ng';

@Component({...})
class MyComponent {
  completedTodos$ = derive((get.todos, get.showDone)
    .with((todos, showDone) => todos.filter(todo => todo.done === showDone))
    .observe();
}
```
<a href="https://codesandbox.io/s/olik-ng-memoise-supgo?file=/src/app/app.component.ts" target="_blank">Demo <img/></a>

### Minimize **async pipes** & read observables **synchronously**
The `combineComponentObservables()` is a *convenience* function that:
* Removes the need to declare an `async` pipe for *every* observable in your template.
* Allows you to read your observables, synchronously, without subscribing to them.  

```html
<ng-container *ngIf="observables$ | async; let observe;">
  <div>Todos for user: {{observe.username$}}</div>
  <div *ngFor="let todo of observe.todos$">
    {{todo.title}}
  </div>
</ng-container>
```
```ts
import { combineComponentObservables } from 'olik-ng';

@Component({...})
class AppComponent {

  username$ = get.username.observe();
  todos$ = get.todos.observe()
  observables$ = combineComponentObservables<AppComponent>(this);

  ngAfterViewInit() {
    // synchronous read
    console.log({ todos: this.observables$.value.todos$ }); 
  }
}
```
<a href="https://codesandbox.io/s/olik-ng-combinecomponentobservables-trh42?file=/src/app/app.component.ts" target="_blank">Demo <img/></a>
Note that:
* the `observables$` variable must **not** be renamed.
* must be the **last** variable you declare.