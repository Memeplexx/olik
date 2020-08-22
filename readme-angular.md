# OULIK-ANGULAR #

### ***Unambigiuous, in-line state-management*** ###
- **ERGONOMIC -** Entirely typesafe, terse, while providing a standardised set of abstractions for state updates
- **SMALL -** 2.2kb minified & gzipped, with zero external runtime dependencies
- **DEBUGGABLE -** via the [Redux Devtools extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
- **ATOMIC OR COMPOSITE -** No limitations on the size and quantity of stores

## SETUP ##
```console
npm install oulik-angular
```
```Typescript
import { make } from 'oulik-angular';

const getCanvas = make('box', { width: 10, height: 10 });           // State can be as nested as you like, as long as it is serializable. This will be auto-registered with the devtools extension

@Module(...)
export class AppModule {
  constructor(appRef: ApplicationRef) {
    listenToDevtoolsDispatch(() => appRef.tick());
  }
}
```

## WRITE ##

```Typescript
getCanvas(s => s.width).replace(20);                                // The devtools will register the action: `{ type: 'width.replace()', payload: 20 }` and your state will be updated.
```
[More write options...](./readme-actions.md)

## READ ##

```Typescript
const canvas = getCanvas().read();

const listener = getCanvas(b => b.width).onChange(width => ...);
```

## OBSERVE ##

```Typescript
import { select } from 'oulik-angular';

@Component({
  selector: 'app-component',
  template: `
  <ul><li *ngFor="let todo of todos$ | async">{{todo}}<li></ul>
  `
})
export class MyComponent {
  todos$ = select(store, s => s.todos);
}
```
[More read options...](./readme-angular-fetchers.md)
