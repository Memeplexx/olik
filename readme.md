# OULIK #

![Version](https://img.shields.io/npm/v/oulik.svg)
[![Build Status](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)
![Coverage Status](https://coveralls.io/repos/github/Memeplexx/oulik/badge.svg?branch=master)
![Package Size](https://badgen.net/bundlephobia/minzip/oulik)
![Dependency count](https://badgen.net/bundlephobia/dependency-count/oulik)

## ***Effortless state-management with an incurable magic-string allergy*** ##  

Oulik enables **inline**, **type-safe** state updates, and **accurately describes them for you** inside the **[Redux Devtools extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)**
without requiring actions, reducers, dispatches, middleware, de-duping requests, custom caching code, or manually tracking loading / error / result states.

> This guide introduces Oulik without a framework. You may prefer to use ***![](./docs/assets/react.png)[<u>OULIK-REACT</u>](./docs/readme-react.md)***, or ***![](./docs/assets/angular.png)[<u>OULIK-NG</u>](./docs/readme-ng.md)***.  

## SETUP ##

```console
npm i oulik
```
```Typescript
import { make } from 'oulik';

const store = make('my store', { user: { name: '', email: '' }, hobbies: new Array<string>() });       
```
## WRITE ##
```Typescript
store(s => s.user.name).replaceWith('James');
// dispatches ({ type: 'user.name', payload: 'James' }) and performs an immutable update for you
```
***[All write options...](./docs/readme-write.md)***

## READ ##

```Typescript
const username = store(s => s.user.name).read();
```
***[All read options...](./docs/readme-read.md)***

## BEST PRACTICES ##
If you don't already have some experience with Redux or NGRX, it's worth checking this small guide.  
***[State-management best practices](./docs/best-practices.md)***
