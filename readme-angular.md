# OULIK-ANGULAR #

### ***Unambigiuous, in-line state-management*** ###
- **ERGONOMIC -** Entirely typesafe, terse, while providing a standardised set of abstractions for state updates
- **TINY -** 2.4kb minified & gzipped, with zero external runtime dependencies
- **DEBUGGABLE -** via the [Redux Devtools extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
- **ATOMIC OR COMPOSITE -** No limitations on how big, small, or numerous stores can be
- **FAST -** Roughly equivalent to [Immutable](https://github.com/immutable-js/immutable-js) and significantly faster than [Immer](https://github.com/immerjs/immer)

## MOTIVATION ##
The goal of this library is to remove ambiguity and indirection while improving consistency when it comes to managing your state updates.  
So apart from **automatically updating** your state, updates are **described for you** based off your **selector function**, and your use of one of the few **[standard library actions](./readme-actions.md)**.  

## SETUP ##
```console
npm install oulik-angular
```
```Typescript
import { make } from 'oulik';

const getCanvas = make('canvas', {              // This name will register your store with the Redux Devtools Extension
  size: { width: 10, height: 10 },              // This is your initial state. It can be a simple primitive value, or something far more nested. It just needs to be serializable.
  border: { thickness: 1 }                           
}); 

@Module(...)
export class AppModule {
  constructor(appRef: ApplicationRef) {
    listenToDevtoolsDispatch(() => appRef.tick());
  }
}
```

## WRITE ##

```Typescript
getCanvas(s => s.size.width).replaceWith(20);   // The devtools will register the action: `{ type: 'size.width.replaceWith()', payload: 20 }` and your state will be updated.
```
[All write options...](./readme-actions.md)

## READING ##

```Typescript
const w = getCanvas(c => c.size.width).read();
```
[All read options...](./readme-angular-read.md)


