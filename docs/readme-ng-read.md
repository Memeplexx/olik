# OULIK-NG: READING STATE #

> This guide shows how to read state in Angular applications.  
To get started with Oulik-NG, check out the [***Oulik-NG README***](./readme-ng.md).  
To get a high-level overview of what Oulik has to offer, check out the [***Oulik README***](../readme.md).

---

Let's first assume that a store has been initialized as follows:
```Typescript
import { make } from 'oulik-ng';

const store = make('store', {
  todos: new Array<string>(),
}); 
```
---

## READING STATE SYNCHRONOUSLY ##
```Typescript
const todos = store().read().todos;
```

## LISTENING TO STATE UPDATES ##
```Typescript
const listener = store(s => s.todos)
  .onChange(todos => console.log(todos));
listener.unsubscribe(); // Please unsubscribe to avoid a memory leak
```  

## REACTING TO STATE UPDATES IN TEMPLATE ##
```Typescript
import { select } from 'oulik-ng';

@Component({
  selector: 'app-component',
  template: `<div *ngFor="let todo of todos$ | async">{{todo}}</div>`
})
export class MyComponent {
  todos$ = select(store(s => s.todos));
}
```

## REACTING TO STATE UPDATES IN TEMPLATE (USING MULTIPLE INPUTS) ##
While this library exposes a `deriveFrom()` function (to memoise a single output from multiple inputs), Angular users enjoy the benefits of RXJS (which can combine, and memoise, multiple data streams into a single output data stream):
```Typescript
import { combineLatest } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

someCombinedValue$ = combineLatest([
  select(store(s => s.todos)),
  select(store(s => s.some.other.value)),
]).pipe(
  shareReplay(1),
);
```

## FETCHING STATE FROM EXTERNAL SOURCES ##
Using *Fetchers* allows you to track the status of a request (loading / success / error) as well as cache request responses.

### DEFINING A FETCHER ###
```Typescript
import { store } from './my-store';

export class ApiService {

  constructor(private http: HttpClient) { }

  todosFetcher = store(s => s.todos)
    .createFetcher(() => this.http.get('https://www.example.com/todos'), { cacheForMillis: 1000 * 60 });
}
```

### OPTION A: USING OUR FETCHER WITHIN A COMPONENT ###

```Typescript
import { fetch } from 'oulik-ng';

@Component({
  selector: 'app-component',
  template: `
  <ng-container *ngIf="todos$ | async; let todos">
    <div *ngIf="todos.loading">loading...</div>
    <div *ngIf="todos.error">Sorry! Could not fetch todos</div>
    <div *ngFor="let todo of todos.value">{{todo}}</div>
  </ng-container>
  `
})
export class AppComponent {

  constructor(private apiService: ApiService) { }

  todos$ = fetch(apiService.todosFetcher);
}
```

### OPTION B: USING OUR FETCHER WITHIN A RESOLVER (IE BEFORE COMPONENT LOADS) ###
[Resolvers](https://angular.io/api/router/Resolve) are a handy way of pre-fetching data so that your components have all their data before they are created.
```Typescript
import { resolve } from 'oulik-ng';

@Injectable()
export class InviteResolver implements Resolve<any> {

  constructor(private readonly apiService: ApiService) { }

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return resolve(this.apiService.todosFetcher);
  }
}

```