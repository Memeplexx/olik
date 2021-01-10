# OULIK #

![Version](https://img.shields.io/npm/v/oulik.svg)
[![Build Status](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/Memeplexx/oulik/badge.svg?branch=master)](https://coveralls.io/github/Memeplexx/oulik?branch=master)
![Package Size](https://badgen.net/bundlephobia/minzip/oulik)
![Dependency count](https://badgen.net/bundlephobia/dependency-count/oulik)

### *Declarative* state-management. *Free* of innacurate *actions* & convoluted reducers. *All* in-line.

Oulik leverages the shape of your state tree and standardizes your state-update primitives to provide a **crystal clear state-management experience**. It also supports the ability to **dynamically nest component-level stores** within your application-level store.

> This rest of this guide covers the vanilla JS version. You may prefer to use ***[![](./docs/assets/react.png)&nbsp;OULIK-REACT](./docs/readme-react.md)***, or ***[![](./docs/assets/angular.png)&nbsp;OULIK-NG](./docs/readme-ng.md)***.  

```console
npm i oulik
```
### 🐤 SET UP
```ts
const get = make({
  name: '',
  favorite: {
    foods: new Array<string>(),
    hobbies: new Array<{ id: number, name: string }>(),
  },
});
```  
### ✍️ WRITE STATE  
```ts
get(s => s.name).replace('Terence');
// dispatch({ type: 'name.replace()', payload: 'Terence' })

get(s => s.favorite.foods).addAfter(['Indian', 'Sushi']);
// dispatch({ type: 'favorite.foods.addAfter()', payload: ['Indian', 'Sushi'] })

get(s => s.favorite.hobbies).replaceWhere(eq(h => h.id, 1)).with('Napping');
// dispatch({ type: 'favorite.hobbies.replaceWhere(id==1)', payload: 'Napping' })
```
### 📖 READ STATE
```ts
get(s => s.favorite.hobbies).read()

get(s => s.favorite.hobbies).onChange(console.log);

derive(get(s => s.foods), get(s => s.hobbies)).usingExpensiveCalc((foods, hobbies) => [...foods, hobbies])
```
### 🥚 NEST STORES
```ts
const get = makeNested({ ... })
```