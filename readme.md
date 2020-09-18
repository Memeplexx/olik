# OULIK #

![Version](https://img.shields.io/npm/v/oulik.svg)
[![Build Status](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/Memeplexx/oulik/badge.svg?branch=master)](https://coveralls.io/github/Memeplexx/oulik?branch=master)
![Package Size](https://badgen.net/bundlephobia/minzip/oulik)
![Dependency count](https://badgen.net/bundlephobia/dependency-count/oulik)

### ***Unambigiuous, in-line state-management*** ###
---
## MOTIVATION ##
State operations are typically hidden behind an opaque facade of user-defined 'actions'. Some actions fail to describe a state update accurately while other actions needlessly re-describe very simple operations. Furthermore, as your code evolves, there can be a 'drift' between action types, and the state thay purport to operate on.  

This library's unique API not only makes immutable state updates a breeze, it also leverages the type system so that state updates become **self-documenting** and **consistent**. That said, this library has several goals:  
- **ERGONOMIC -** Completely typesafe & compact API with a standardised set of abstractions for state updates
- **FLEXIBLE SIZE & QUANTITY OF STORES -** Use small stores where performance is critical, and a single store everywhere else
- **FAST -** Roughly equivalent to [Immutable](https://github.com/immutable-js/immutable-js) and significantly faster than [Immer](https://github.com/immerjs/immer)
- **IMMUTABLE -** Every state update will result in a new immutable state tree
- **PORTABLE -** Designed to be framework-agnostic. Currently supports bindings for React and Angular (read a tiny bit further for links to those guides)
- **DEBUGGABLE -** Via the [Redux Devtools extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)

---

**NOTE:** The rest of this guide illustrates how to use Oulik **without a framework.** It may be more appropriate for you to check out the docs for the following framework bindings:  

![](assets/react.ico) <u>[OULIK-REACT](./readme-react.md)</u>  
![](assets/angular.png) <u>[OULIK-NG](./readme-ng.md)</u>  

## GETTING STARTED ##

```console
npm install oulik
```
```Typescript
import { make } from 'oulik';

const getCanvas = make('canvas', {          // <- Auto-registers with the Redux Devtools Extension.
  size: { width: 10, height: 10 },          // <- Initial state must be serializable. It can be a
  border: { thickness: 1 }                  //    simple primitive, or something far more nested.
});       
```

## WRITING STATE ##
```Typescript
getCanvas(s => s.size.width)                // <- Your state will be replaced using the action:
  .replaceWith(20);                         //    { type: 'size.width.replaceWith()', payload: 20 }
```
[All write options...](./readme-write.md)

## READING STATE ##

```Typescript
const canvasWidth = getCanvas()
  .read().size.width;
```
[All read options...](./readme-read.md)