# OULIK #

![Version](https://img.shields.io/npm/v/oulik.svg)
[![Build Status](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/Memeplexx/oulik/badge.svg?branch=master)](https://coveralls.io/github/Memeplexx/oulik?branch=master)
![Package Size](https://badgen.net/bundlephobia/minzip/oulik)
![Dependency count](https://badgen.net/bundlephobia/dependency-count/oulik)

## ***Dead-simple state-management, free of confusing user-defined abstractions*** ##  

Oulik leverages the shape of your state tree and standardizes your state-update primitives to provide a **lucid state-management experience**. It also supports the ability to **dynamically nest component-level stores** within your application-level store.

> This rest of this guide covers the vanilla JS version. You may prefer to use ***[![](./docs/assets/react.png)&nbsp;OULIK-REACT](./docs/readme-react.md)***, or ***[![](./docs/assets/angular.png)&nbsp;OULIK-NG](./docs/readme-ng.md)***.  

```console
npm i oulik
```

```Typescript
import { make } from 'oulik';

const get = make({
  name: '',
  favorite: {
    foods: new Array<string>(),
    hobbies: new Array<string>(),
  },
});       

get(s => s.name).replace('Terence');

get(s => s.favorite.foods).replaceAll(['Indian', 'Sushi']);

get(s => s.favorite.hobbies).replaceWhere(h => h === 'Coding').with('Napping');
```
***[✍️ Writing state](./docs/readme-write.md)*** - update your state using a minimal but powerful set of state-update utilities

***[📖 Reading state](./docs/readme-read.md)*** - read synchronously, listen to updates, and memoise derived state

***[🥚 Nesting stores](./docs/readme-fetch.md)*** - nest component-level stores inside your application-level store

***[👩‍🎓 Best practices](./docs/best-practices.md)*** - if you don't already have some experience using Redux or NGRX
