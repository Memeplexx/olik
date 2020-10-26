# OULIK #

![Version](https://img.shields.io/npm/v/oulik.svg)
[![Build Status](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)
![Coverage Status](https://coveralls.io/repos/github/Memeplexx/oulik/badge.svg?branch=master)
![Package Size](https://badgen.net/bundlephobia/minzip/oulik)
![Dependency count](https://badgen.net/bundlephobia/dependency-count/oulik)

## ***Effortless, transparent state management*** ##  

Oulik is designed to make reading, writing, and debugging your application state as **transparent** as possible.  
It's unique API ensures that all updates are **in-line**, **typesafe**, and **desribed for you** inside the **[Redux Devtools extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)**

> This guide illustrates Oulik without a framework. You may prefer ***[OULIK-REACT](./docs/readme-react.md)***, or ***[OULIK-NG](./docs/readme-ng.md)***.  

## SETUP ##

```console
npm install oulik
```
```Typescript
import { make } from 'oulik';

const store = make('my store', {
  user: { firstname: '', lastname: '' },
  hobbies: new Array<string>(),
});       
```
## WRITE ##
```Typescript
store(s => s.user.firstname).replaceWith('James');
```
***[All write options...](./docs/readme-write.md)***

## READ ##

```Typescript
const username = store(s => s.user.firstname).read();
```
***[All read options...](./docs/readme-read.md)***

## BEST PRACTICES ##

Oulik is absurdly simple to use, and most of the time, the API corrals you into making only 1 decision.  
That said, if you don't already have some experience with Redux or NGRX, it's worth checking this small guide.  
***[State-management best practices](./docs/best-practices.md)***