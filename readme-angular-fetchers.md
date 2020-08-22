# OULIK-ANGULAR - 'FETCHERS' #
*Fetchers* are an **optional** standardized mechanism for
* fetching data from external resources,
* indicating the status of a request (loading / success / error), and 
* caching data (optional).

## **DEFINING** A FETCHER ##
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

## USING OUR FETCHER WITHIN A **COMPONENT** ##

Below we can display the loading / error / success statuses as follows:
```Typescript
import { fetch } from 'heerlik-angular';
// ... other imports

@Component({
  selector: 'app-component',
  template: `
  <ng-container *ngIf="todos$ | async; let todos">
    <div *ngIf="todos.loading">loading...</div>
    <div *ngIf="todos.error">Sorry! Could not fetch todos</div>
    <ul><li *ngFor="let todo of todos.value">{{todo}}<li></ul>
  </ng-container>
  `
})
export class AppComponent {

  constructor(private apiService: ApiService) { }

  todos$ = fetch(apiService.fetchTodos);
}
```

## USING OUR FETCHER WITHIN A **RESOLVER** ##
If you prefer to fetch your data **before** you component loads, you can use the `resolve()` function within an Angular [RouteResolver](https://angular.io/api/router/Resolve).  
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