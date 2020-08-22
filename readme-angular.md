# OULIK-ANGULAR #

### ***Unambigiuous, in-line state-management*** ###
- **ERGONOMIC -** Entirely typesafe, terse, while providing a standardised set of abstractions for state updates
- **SMALL -** 2.2kb minified & gzipped, with zero external runtime dependencies
- **DEBUGGABLE -** via the [Redux Devtools extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
- **ATOMIC OR COMPOSITE -** No limitations on the size and quantity of stores

## SETUP ##
```console
npm install heerlik-angular
```
```Typescript
import { makeStore, listenToDevtoolsDispatch } from 'oulik-angular';

const box = makeState('box',                              // Your state will be registered with the devtools extension under this name.
  { width: 0, height: 0 });                               // State can be much more complex and nested than this, as long as it is serializable.

@Module(...)
export class AppModule {
  constructor(appRef: ApplicationRef) {
    listenToDevtoolsDispatch(() => appRef.tick());
  }
}
```

## WRITE ##

```Typescript
box
  .select(s => s.width)                                   // Almost all state operations start with a `select()` which selects the piece of state to act upon.
  .replace(50);                                           // The devtools will register `{ type: 'width.replace()', payload: 50 }` and your state will be updated.
```
[More write options...](./readme-actions.md)

## READ ##

```Typescript
const myState = box.read();                               // Synchronous read.
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
