---
sidebar_label: 'Angular'
sidebar_position: 2
---

# Handling async state with Angular

🥚 Let's begin with the following store and service:

```ts
import { createStore } from 'olik-ng'

const get = createStore({
  name: document.title,
  state: {
    todos: new Array<{ id: number, title: string }>(),
  },
})
```

## **Tracking** the status of **async data fetches**
You can track the status of a request by using the `asObservableFuture()` function
```html
<ng-container *ngIf="todos$ | async; let todos;">
  <div *ngIf="todos.isLoading">
    Fetching todos...
  </div>
  <div *ngIf="todos.wasRejected">
    Failed to fetch todos with error {{todos.error}}
  </div>
  <ul *ngIf="todos.wasResolved">
    <li *ngFor="let todo of todos.storeValue">
      {{todo.title}}
    </li>
  </ul>
</ng-container>
```
```ts {8}
@Component({...})
class MyComponent {

  constructor(private httpClient: HttpClient) { }

  todos$ = get.todos
    .replaceAll(this.httpClient.get('http://example.com/todos'))
    .asObservableFuture();
  );
}
```
[**Demo 🥚**](https://codesandbox.io/s/olik-ng-async-5y3hd?file=/src/app/app.component.ts)

## **Resolving data** in a route resolver
It may be better to pre-fetch all component data using an [Angular route resolver](https://angular.io/api/router/Resolve).
```ts {9}
@Injectable()
export class MyRouteResolver implements Resolve<Observable<any>> {

  constructor(private httpClient: HttpClient) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return get.todos
      .replaceAll(this.httpClient.get('http://example.com/todos'))
      .asObservable();
  }
}
```
[**Demo 🥚**](https://codesandbox.io/s/olik-ng-route-resolver-6mmbk?file=/src/app/child.resolver.ts)
