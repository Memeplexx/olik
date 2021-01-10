# OULIK #

![Version](https://img.shields.io/npm/v/oulik.svg)
[![Build Status](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)](https://travis-ci.org/Memeplexx/oulik.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/Memeplexx/oulik/badge.svg?branch=master)](https://coveralls.io/github/Memeplexx/oulik?branch=master)
![Package Size](https://badgen.net/bundlephobia/minzip/oulik)
![Dependency count](https://badgen.net/bundlephobia/dependency-count/oulik)

### *Declarative* state-management. *Free* of innacurate *actions* & convoluted reducers. *All* in-line.

> Oulik currently supports ***[![](./src/assets/javascript.png)&nbsp;Vanilla-JS](https://memeplexx.github.io/oulik/docs/vanilla-js)***, ***[![](./src/assets/react.png)&nbsp;React](https://memeplexx.github.io/oulik/docs/read)***, and ***[![](./src/assets/angular.png)&nbsp;Angular](https://memeplexx.github.io/oulik/docs/angular)***.  

```console
npm i oulik
```
#### 🌈 **SET UP**
```ts
const get = make({
  name: '',
  favorite: {
    foods: new Array<string>(),
    hobbies: new Array<{ id: number, name: string }>(),
  },
});
```  
#### ✍️ **WRITE STATE**  
```ts
get(s => s.name).replace('Terence');
// replaces state using: { type: 'name.replace()', payload: 'Terence' }

get(s => s.favorite.foods).addAfter(['Indian', 'Sushi']);
// replaces state using: { type: 'favorite.foods.addAfter()', payload: ['Indian', 'Sushi'] }

get(s => s.favorite.hobbies).replaceWhere(eq(h => h.id, 1)).with('Napping');
// replaces state using: { type: 'favorite.hobbies.replaceWhere(id==1)', payload: 'Napping' }
```
#### 🔍 **READ STATE**
```ts
get(s => s.favorite.hobbies).read()

get(s => s.favorite.hobbies).onChange(console.log);

derive(get(s => s.foods), get(s => s.hobbies)).usingExpensiveCalc((foods, hobbies) => /* some big calc */)
```
#### 🥚 **NEST STORES**
```ts
class MyTodoComponent {
  get = makeNested({
    name: '',
    description: '',
    done: false,
  });
}
```