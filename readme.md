# OULIK #

![Version](https://img.shields.io/npm/v/oulik.svg)
[![Build Status](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)
![Coverage Status](https://coveralls.io/repos/github/Memeplexx/oulik/badge.svg?branch=master)
![Package Size](https://badgen.net/bundlephobia/minzip/oulik)
![Dependency count](https://badgen.net/bundlephobia/dependency-count/oulik)

## ***Effortless state-management with an incurable magic-string allergy*** ##  

Oulik enables **inline**, **type-safe** state updates, and **accurately describes them for you** inside the **[Redux Devtools extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)**
without requiring actions, reducers, dispatches, middleware, de-duping requests, custom caching code, or manually tracking loading / error / result states.

> This guide introduces Oulik without a framework. You may prefer to use ***[![](./docs/assets/react.png)&nbsp;OULIK-REACT](./docs/readme-react.md)***, or ***[![](./docs/assets/angular.png)&nbsp;OULIK-NG](./docs/readme-ng.md)***.  

```console
npm i oulik
```
```Typescript
import { make } from 'oulik';

const store = make({ favoriteThings: { color: '', food: '' } });       

store(s => s.favoriteThings.color).replaceWith('red'); 
```
***[All write options...](./docs/readme-write.md)***

***[All read options...](./docs/readme-read.md)***

***[Fetching data...](./docs/readme-fetch.md)***

***[Best practices...](./docs/best-practices.md)***
