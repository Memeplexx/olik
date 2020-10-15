# OULIK #

![Version](https://img.shields.io/npm/v/oulik.svg)
[![Build Status](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)
![Coverage Status](https://coveralls.io/repos/github/Memeplexx/oulik/badge.svg?branch=master)
![Package Size](https://badgen.net/bundlephobia/minzip/oulik)
![Dependency count](https://badgen.net/bundlephobia/dependency-count/oulik)

### ***Lean & transparent state-management*** ###
---
## WHAT PROBLEM DOES THIS LIBRARY SOLVE? ##
State operations are typically hidden behind an opaque facade of user-defined abstractions. Some abstractions fail to describe a state update accurately while others needlessly re-describe very simple updates. Furthermore, as your code evolves, there can be a 'drift' between these abstractions, and the state thay purport to operate on.  

This library's unique API not only **makes immutable state updates a breeze**, it also leverages the type system so that state updates become **transparent** and **consistent**. Setup is easy and integration with [Redux Devtools extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en) is automatic

---

> **NOTE:** The rest of this guide illustrates how to use Oulik **without a framework.** It may be more appropriate for you to check out the docs for the following framework bindings:  

![](assets/react.ico) <u>[OULIK-REACT](./docs/readme-react.md)</u>  
![](assets/angular.png) <u>[OULIK-NG](./docs/readme-ng.md)</u>  

## GETTING STARTED ##

```console
npm install oulik
```
```Typescript
import { make } from 'oulik';

const store = make('my store', {         // <- Auto-registers with the Redux Devtools Extension.
  user: { firstname: '', lastname: '' }, // <- Initial state must be serializable. It can be a
  hobbies: new Array<string>(),          //    simple primitive, or something far more nested.
});       
```

## WRITING STATE ##
```Typescript
store(s => s.user.firstname)             // <- Your state will be replaced using the action:
  .replaceWith('James');                 //    { type: 'user.firstname.replaceWith()', payload: 'James' }
```
[All write options...](./docs/readme-write.md)

## READING STATE ##

```Typescript
const username = store(s => s.user.firstname)
  .read();
```
[All read options...](./docs/readme-read.md)