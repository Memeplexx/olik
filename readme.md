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
import { make } from 'oulik';

const getCanvas = make('canvas', { width: 10, height: 10 });       // State can be as nested as you like, as long as it is serializable. You should immediately see this in the Redux Devtools Exension.
```

## WRITE ##
```Typescript
getCanvas(s => s.width).replace(20);                               // The devtools will register the action: `{ type: 'width.replace()', payload: 20 }` and your state will be updated.
```
[More write options...](./readme-actions.md)

## READ ##

```Typescript
const canvas = getCanvas().read();
                       
const listener = getCanvas(b => b.width).onChange(width => ...);    
```
[More read options...](./readme-read.md)