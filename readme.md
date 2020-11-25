# OULIK #

![Version](https://img.shields.io/npm/v/oulik.svg)
[![Build Status](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/Memeplexx/oulik/badge.svg?branch=master)](https://coveralls.io/github/Memeplexx/oulik?branch=master)
![Package Size](https://badgen.net/bundlephobia/minzip/oulik)
![Dependency count](https://badgen.net/bundlephobia/dependency-count/oulik)

## ***Effortless state-management with an incurable magic-string allergy*** ##  

**Inline**, **type-safe** state updates, **accurately described for you** inside the **[Redux Devtools extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)**.  

> This guide introduces Oulik without a framework. You may prefer to use ***[![](./docs/assets/react.png)&nbsp;OULIK-REACT](./docs/readme-react.md)***, or ***[![](./docs/assets/angular.png)&nbsp;OULIK-NG](./docs/readme-ng.md)***.  

```console
npm i oulik
```
```Typescript
import { make } from 'oulik';

const store = make({ favoriteThings: { color: '', food: '' } });       

store(s => s.favoriteThings.color).replaceWith('red'); 
```
***[✍️ Writing state](./docs/readme-write.md)*** - update your state using a minimal but powerful set of state update primitives

***[📖 Reading state](./docs/readme-read.md)*** - read synchronously, listen to updates, and memoise derived state

***[🐕‍🦺 Fetching data](./docs/readme-fetch.md)*** - de-duplicate simulatenous requests, cache responses, and track loading / error / result states

***[🥚 Nesting stores](./docs/readme-fetch.md)*** - enhance the debuggability of your component's states by nesting component-level stores

***[👩‍🎓 Best practices](./docs/best-practices.md)*** - if you don't already have some experience using Redux or NGRX
