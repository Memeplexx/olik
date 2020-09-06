# OULIK #
### ***Unambigiuous, in-line state-management*** ###
- **ERGONOMIC -** Completely typesafe & compact API with a standardised set of abstractions for state updates
- **TINY -** 2.4kb minified & gzipped, with zero external runtime dependencies
- **DEBUGGABLE -** via the [Redux Devtools extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
- **ATOMIC OR COMPOSITE -** Use small stores (AKA 'atoms') where performance is critical, and a monolythic store everywhere else
- **FAST -** Roughly equivalent to [Immutable](https://github.com/immutable-js/immutable-js) and significantly faster than [Immer](https://github.com/immerjs/immer)
- **IMMUTABLE -** Obviously
- **PORTABLE -** Designed to be framework-agnostic. Currently supports bindings for:
  - [React](./readme-react.md)
  - [Angular](./readme-angular.md)

## MOTIVATION ##
The goal of this library is to minimize verbosity, ambiguity and indirection when it comes to managing your state.  
Apart from **handling immutable state updates** for you, updates are also **described for you** based off a your **selector function**, and your use of one of the few **[standard library actions](./readme-actions.md)**.  
You can think of this library as a type-safe, self-documenting ORM for your client-side state.


## SETTING UP ##

```console
npm install oulik
```
```Typescript
import { make } from 'oulik';

const getCanvas = make('canvas', {              // <- Your store will be be registered with the Redux Devtools Extension using this name.
  size: { width: 10, height: 10 },              // <- Your initial state must be serializable, but can be a simple primitive value, or something far more nested.
  border: { thickness: 1 }
});       
```

## WRITING STATE ##
```Typescript
getCanvas(s => s.size.width)
  .replaceWith(20);                             // Devtools will update your state using the action: `{ type: 'size.width.replaceWith()', payload: 20 }`.
```
[All write options...](./readme-write.md)

## READING STATE ##

```Typescript
const canvasWidth = getCanvas().read().size.width;
```
[All read options...](./readme-read.md)