# OLIK #

![Version](https://img.shields.io/npm/v/olik.svg)
[![Build Status](https://travis-ci.org/Memeplexx/olik.svg?branch=master)](https://travis-ci.org/Memeplexx/olik.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/Memeplexx/Olik/badge.svg?branch=master)](https://coveralls.io/github/Memeplexx/Olik?branch=master)
![Package Size](https://badgen.net/bundlephobia/minzip/olik)
![Dependency count](https://badgen.net/bundlephobia/dependency-count/olik)

## Crystal-clear state-management  

Olik allows you to comprehensively grok your state updates without ever leaving your component code.  
* Its fluent typesafe API maximizes **transparency**, **consistency** and **eliminates ambiguity** 
* **Debuggability** is enhanced through **auto-generated action types**
* **Nested stores** allow you to debug your component state with or without your application store.
* Transactions, async updates, and caching are all built-in.

---
NOTE: The below code demonstrates Olik **without a framework**,
however, bindings currently exist for ***[React](https://memeplexx.github.io/olik/docs/read)***, and
***[Angular](https://memeplexx.github.io/olik/docs/angular)***

#### 🌈 **SET UP**
Initializing your store couldn't be simpler while integration with the **[Redux Devtools extension](https://github.com/zalmoxisus/redux-devtools-extension)** is automatic.
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
Writes consist of a **selection** followed by an **action** allowing state-updates to be **described** for you. 
```ts
select(s => s.username)              // type: 'username.replace()'
  .replace('Terence');               // replacement: 'Terence'

select(s => s.favorite.foods)        // type: 'favorite.foods.insert()'
  .insert(['Indian', 'Sushi']);      // insertion: ['Indian', 'Sushi']

select(s => s.favorite.hobbies)      // type: 'favorite.hobbies.find().patch()'
  .findWhere(s => s.id).eq(3)        // query: 'id === 3',
  .patch({ name: 'coding' });        // patch: { name: 'coding' }
```
#### 🔍 **READ STATE**
State can be **read** from, **listened** to, and expensive derivations can be **memoised**.
```ts
select(s => s.favorite.hobbies)
  .read()

select(s => s.favorite.hobbies)
  .onChange(e => console.log(e));

const derivation = derive(
  select(s => s.foods),
  select(s => s.hobbies),
).usingExpensiveCalc(
  (foods, hobbies) => /* ...some expensive calculation we do not wish to repeat... */
)
```
#### 🥚 **NEST STORES**
Each component's state can be managed and debugged with or without your application store.
```ts
select = setNested({                  // applicationStoreState = {
  title: '',                          //   /* ... */
  description: '',                    //   nested {
  done: false,                        //     TodoComponent: {
}, {                                  //       1: { title: '', description: '', done: false }
  storeName: 'TodoComponent',         //     }
  instanceName: todoId                //   }
});                                   // }

select(s => s.done)                   // type: 'nested.TodoComponent.1.done.replace()'
  .replace(true);                     // replacement: true
```

#### ↪️ **TRANSACT**
Perform multiple updates in one go to prevent unnecessary re-renders
```ts
transact(                             // type: 'username.replace(), favorite.foods.removeAll()'
  () => select(s => s.username)       // actions: [
    .replace('James'),                //   { type: 'username.replace()', replacement: 'James' },
  () => select(s => s.favorite.foods) //   { type: 'favorite.foods.removeAll()' },
    .removeAll(),                     // ]
);
```

#### ⏲️ **ASYNC**
Pass async payload and optionally prevent unnecessary subsequent promise invocations for a specified period
```ts
select(s => s.favorite.hobbies)
  .replaceAll(() => axios.get('http://www.example.com/todos'), { bypassPromiseFor: 1000  })
  .catch(e => notifyUserOfError(e));

select(s => s.favorite.hobbies)
  .stopBypassingPromises();
```
