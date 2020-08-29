# OULIK #
### ***Unambigiuous, in-line state-management*** ###
- **ERGONOMIC -** Provides Entirely typesafe & compact API while providing a standardised set of abstractions for state updates
- **TINY -** 2.4kb minified & gzipped, with zero external runtime dependencies
- **DEBUGGABLE -** via the [Redux Devtools extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
- **ATOMIC OR COMPOSITE -** Use small stores (AKA 'atoms') where performance is paramount, and a monolythic store everywhere else
- **FAST -** Roughly equivalent to [Immutable](https://github.com/immutable-js/immutable-js) and significantly faster than [Immer](https://github.com/immerjs/immer)
- **IMMUTABLE -** Obviously
- **PORTABLE -** Designed to be framework-agnostic. Currently supports bindings for:
  - [React](./readme-react.md)
  - [Angular](./readme-angular.md)

## MOTIVATION ##
State-management solutions typically suffer from a weak association between user-defined 'action types' (to use Redux terminology) and the actual state update.  
Actions are usually either given overly abstract names (which don't sufficiently describe the state update precisely) or very specific names (which add a lot of redundancy to code-bases).  
Furthermore, as your code evolves, there can be a 'drift' between action types, and the state thay purport to operate on.  
This library aims to reduce ambiguity by **creating actions for you** based off a **selector function**, and your use of one of the **standard library actions**.  

## SETUP ##

```console
npm install oulik
```
```Typescript
import { make } from 'oulik';

const getCanvas = make('canvas', {              // This name will register your store with the Redux Devtools Extension
  size: { width: 10, height: 10 },              // This is your initial state. It can be a simple primitive value, or something far more nested. It just needs to be serializable.
  border: { thickness: 1 }                           
});       
```

## WRITE ##
```Typescript
getCanvas(s => s.size.width)
  .replaceWith(20);                             // The devtools will register the action: `{ type: 'size.width.replaceWith()', payload: 20 }` and your state will be updated.
```
[More write options...](./readme-actions.md)

## READ ##

```Typescript
const canvasWidth = getCanvas(c => c.size.width)
  .read();
                       
const listener = getCanvas(c => c.size.width)
  .onChange(console.log);    
```
[More read options...](./readme-read.md)