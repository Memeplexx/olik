# OULIK #

![Version](https://img.shields.io/npm/v/oulik.svg)
[![Build Status](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/Memeplexx/oulik/badge.svg?branch=master)](https://coveralls.io/github/Memeplexx/oulik?branch=master)
![Package Size](https://badgen.net/bundlephobia/minzip/oulik)
![Dependency count](https://badgen.net/bundlephobia/dependency-count/oulik)

## ***Effortless state-management with an incurable magic-string allergy*** ##  

Oulik is designed to make your state updates as **compact**, **type-safe**, **transparent**, and **debuggable** as possible.  
It has many **opt-in**, **tree-shakable** features including **memoization**, **de-duping async requests**, and **caching responses**.
You can even create **component-level stores** which are loosely coupled from your application store.

> This guide introduces Oulik without a framework. You may prefer to use ***[![](./docs/assets/react.png)&nbsp;OULIK-REACT](./docs/readme-react.md)***, or ***[![](./docs/assets/angular.png)&nbsp;OULIK-NG](./docs/readme-ng.md)***.  

```console
npm i oulik
```
Install the **[Redux Devtools extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)**
```Typescript
import { make } from 'oulik';

const store = make({ favoriteThings: { color: '', foods: new Array<string>() } });       

store(s => s.favoriteThings.color).replaceWith('red'); 
```
***[✍️ Writing state](./docs/readme-write.md)*** - update your state using a minimal but powerful set of state-update utilities

***[📖 Reading state](./docs/readme-read.md)*** - read synchronously, listen to updates, and memoise derived state

***[🐕‍🦺 Fetching state](./docs/readme-fetch.md)*** - de-duplicate simulatenous requests, cache responses, and track loading / error / result states

***[🥚 Nesting stores](./docs/readme-fetch.md)*** - nest component-level stores inside your application-level store

***[👩‍🎓 Best practices](./docs/best-practices.md)*** - if you don't already have some experience using Redux or NGRX
