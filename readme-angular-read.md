# OULIK ANGULAR - READING STATE #

## SYNCHRONOUS READS ##
```Typescript
const todos = getCanvas(c => c.todos).read();
```

## SUBSCRIPTIONS ##

```Typescript
const listener = getCanvas(c => c.todos).onChange(todos => console.log(todos));
listener.unsubscribe(); // don't forget to do this to avoid a leak!
```  

## REACT TO STATE UPDATES IN TEMPLATE ##

```Typescript
import { select } from 'oulik-angular';

@Component({
  selector: 'app-component',
  template: `<div *ngFor="let todo of todos$ | async">{{todo}}</div>`
})
export class MyComponent {
  todos$ = select(getStore(s => s.todos));
}
```

## FETCHERS ##
*Fetchers* are an **optional** standardized mechanism for
* fetching data from external resources,
* indicating the status of a request (loading / success / error), and 
* caching request responses (optional).

### DEFINING A FETCHER ###
```Typescript
import { store } from './my-store';
// ... other imports

export class ApiService {

  constructor(private http: HttpClient) { }

  fetchTodos = store.createFetcher({
    selector: e => e.todos,
    fetcher: () => this.http.get('http://localhost:8080/todos').toPromise(),
    cacheForMillis: 1000 * 60,
  });
}
```

### USING OUR FETCHER WITHIN A COMPONENT ###

```Typescript
import { fetch } from 'heerlik-angular';
// ... other imports

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

  todos$ = fetch(apiService.fetchTodos);
}
```

### USING OUR FETCHER WITHIN A RESOLVER (BEFORE COMPONENT LOADS) ###
```Typescript
import { resolve } from 'heerlik-angular';
// ... other imports

@Injectable()
export class InviteResolver implements Resolve<any> {

  constructor(private readonly apiService: ApiService) { }

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return resolve(this.apiService.fetchTodos);
  }
}

```