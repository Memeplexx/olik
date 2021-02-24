# OLIK #

![Version](https://img.shields.io/npm/v/olik.svg)
[![Build Status](https://travis-ci.org/Memeplexx/olik.svg?branch=master)](https://travis-ci.org/Memeplexx/olik.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/Memeplexx/Olik/badge.svg?branch=master)](https://coveralls.io/github/Memeplexx/Olik?branch=master)
![Package Size](https://badgen.net/bundlephobia/minzip/olik)
![Dependency count](https://badgen.net/bundlephobia/dependency-count/olik)

### *Declarative* state-management. *Free* of inaccurate *actions* & convoluted reducers. *All* in-line.

#### 🎨 **WHY CHOOSE OLIK?**
Olik is designed to make your state management as **transparent** and semantically **consistent** as possible. Its fluent, typesafe API allows it to describe your actions in perfect detail (within the Redux Devtools) and perform efficient immutable updates. It can be used with ***[![](./src/assets/javascript.png)&nbsp;Vanilla-JS](https://memeplexx.github.io/olik/docs/vanilla-js)***, and has minimal bindings for ***[![](./src/assets/react.png)&nbsp;React](https://memeplexx.github.io/olik/docs/read)***, and ***[![](./src/assets/angular.png)&nbsp;Angular](https://memeplexx.github.io/olik/docs/angular)***.  

#### 🌈 **SET UP**
```ts
const select = set({
  username: '',
  favorite: {
    foods: new Array<string>(),
    hobbies: new Array<{ id: number, name: string }>(),
  },
});
```  
#### ✍️ **WRITE STATE**  
```ts
select(s => s.username)            // type: 'username.replace()'
  .replace('Terence');             // replacement: 'Terence'

select(s => s.favorite.foods)      // type: 'favorite.foods.insert()'
  .insert(['Indian', 'Sushi']);    // insertion: ['Indian', 'Sushi']

select(s => s.favorite.hobbies)    // type: 'favorite.hobbies.whereOne().patch()'
  .whereOne(s => s.id).eq(3)       // query: 'id === 3',
  .patch({ name: 'coding' });      // patch: { name: 'coding' }
```
#### 🔍 **READ STATE**
```ts
select(s => s.favorite.hobbies)
  .read()

select(s => s.favorite.hobbies)
  .onChange(e => console.log(e));

derive(
  select(s => s.foods),
  select(s => s.hobbies),
).usingExpensiveCalc(
  (foods, hobbies) => {
    // some calculation we don't want to repeat unnecessarily
  }
)
```
#### 🥚 **NEST STORES**
```ts
class TodoComponent {
  select = setNested({
    title: '',
    description: '',
    done: false,
  });
  onClickDone(done: boolean) {
    this.select(s => s.done)
      .replace(done);
  }
}
```