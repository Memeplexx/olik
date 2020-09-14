# OULIK #

[![Build Status](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/Memeplexx/oulik/badge.svg?branch=master)](https://coveralls.io/repos/github/Memeplexx/oulik/badge.svg?branch=master)
![Package Size](https://badgen.net/bundlephobia/minzip/heerlik)
![Dependency count](https://badgen.net/bundlephobia/dependency-count/heerlik)

### ***Unambigiuous, in-line state-management*** ###
- **ERGONOMIC -** Completely typesafe & compact API with a standardised set of abstractions for state updates
- **DEBUGGABLE -** Via the [Redux Devtools extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
- **ATOMIC OR COMPOSITE -** Use small stores where performance is critical, and a single store everywhere else
- **FAST -** Roughly equivalent to [Immutable](https://github.com/immutable-js/immutable-js) and significantly faster than [Immer](https://github.com/immerjs/immer)
- **IMMUTABLE -** Every state update will result in a new immutable state tree
- **PORTABLE -** Designed to be framework-agnostic. Currently supports bindings for:
  - [React](./readme-react.md)
  - [Angular](./readme-angular.md)

## MOTIVATION ##
State operations are typically hidden behind an opaque facade of user-defined 'actions'. Some actions fail to describe a state update accurately while other actions needlessly re-describe very simple operations. Furthermore, as your code evolves, there can be a 'drift' between action types, and the state thay purport to operate on.  

This library's unique API makes the precise nature of state updates extremely obvious by exploiting the type system and removing user-defined abstractions. As a result, your state-management becomes far more **direct**, **typesafe**, **legible**, **compact**, **refactorable**, and **debuggable**.  


## GETTING STARTED ##

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
getCanvas(s => s.size.width).replaceWith(20);   // Devtools will update your state using the action: `{ type: 'size.width.replaceWith()', payload: 20 }`.
```
[All write options...](./readme-write.md)

## READING STATE ##

```Typescript
const canvasWidth = getCanvas(s => s.size.width).read();
```
[All read options...](./readme-read.md)