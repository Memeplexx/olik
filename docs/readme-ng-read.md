# OULIK-NG: READING STATE #

Let's first assume that a store has been initialized as follows:
```Typescript
import { make } from 'oulik-ng';

const get = make('store', {
  todos: new Array<string>(),
}); 
```
---

## READING STATE SYNCHRONOUSLY ##
```Typescript
const todos = get(s => s.todos).read();
```

## LISTENING TO STATE UPDATES ##
```Typescript
const listener = get(s => s.todos)
  .onChange(todos => console.log(todos));
listener.unsubscribe(); // Please unsubscribe to avoid a memory leak
```  

## CONSUMING STATE IN YOUR TEMPLATE ##
```Typescript
import { make } from 'oulik-ng';

@Component({
  selector: 'app-component',
  template: `<div *ngFor="let todo of todos$ | async">{{todo}}</div>`
})
export class MyComponent {
  todos$ = observe(get(s => s.todos));
}
```

## CONSUMING DERIVED STATE IN YOUR TEMPLATE ##
While this library exposes a `deriveFrom()` function (to memoize a single output from multiple inputs), Angular users enjoy the benefits of RXJS (which can combine, and memoize, multiple data streams into a single output data stream):
```Typescript
import { combineLatest } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export class MyComponent {
  someDataToBeUsedInYourTemplate$ = combineLatest([
    observe(get(s => s.todos)),
    observe(get(s => s.some.other.value)),
  ]).pipe(
    shareReplay(1),
  );
}
```

## FETCHING STATE FROM EXTERNAL SOURCES ##
Using *Fetchers* allows you to track the status of a request (loading / success / error) as well as cache request responses.

### DEFINING A FETCHER ###
```Typescript
import { get } from './my-store';

export class ApiService {

  constructor(private http: HttpClient) { }

  fetchTodos = createFetcher({
    onStore: get(s => s.todos)
    getData: () => this.http.get('https://www.example.com/todos'),
    cacheFor: 1000 * 60,
  });
}
```

### OPTION A: USING OUR FETCHER WITHIN A COMPONENT ###

```Typescript
import { resolve } from 'oulik-ng';

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

  todos$ = resolve(() => this.apiService.fetchTodos());
}
```

### OPTION B: USING OUR FETCHER WITHIN A RESOLVER (IE BEFORE COMPONENT LOADS) ###
[Resolvers](https://angular.io/api/router/Resolve) are a handy way of pre-fetching data so that your components have all their data before they are created.
```Typescript
import { resolve } from 'oulik-ng';

@Injectable()
export class InviteResolver implements Resolve<any> {

  constructor(private apiService: ApiService) { }

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return resolve(() => this.apiService.fetchTodos());
  }
}

```
