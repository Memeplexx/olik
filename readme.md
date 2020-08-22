# OULIK #
### ***Unambigiuous, in-line state-management*** ###
- **ERGONOMIC -** Entirely typesafe, terse, while providing a standardised set of abstractions for state updates
- **SMALL -** 2.2kb minified & gzipped, with zero external runtime dependencies
- **DEBUGGABLE -** via the [Redux Devtools extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
- **ATOMIC OR COMPOSITE -** No limitations on the size and quantity of stores
- **PORTABLE -** Designed to be framework-agnostic. Currently supports bindings for:
  - [React](./readme-react.md)
  - [Angular](./readme-angular.md)

## SETUP ##

```console
npm install oulik
```
```Typescript
import { makeState } from 'oulik';

const box = makeState('box',                              // Your state will be registered with the devtools extension under this name.
  { width: 0, height: 0 });                               // State can be much more complex and nested than this, as long as it is serializable.
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

const subscription = box                                  // Asynchronous read.
  .select(b => b.width)                       
  .onChange(width => ...);
```
[More read options...](./readme-read.md)