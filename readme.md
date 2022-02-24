<img src="./assets/banner_2.png" style="max-width=100%" /> 

![Version](https://img.shields.io/npm/v/olik.svg)
[![Build Status](https://travis-ci.org/Memeplexx/olik.svg?branch=master)](https://travis-ci.org/Memeplexx/olik.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/Memeplexx/Olik/badge.svg?branch=master)](https://coveralls.io/github/Memeplexx/Olik?branch=master)
![Package Size](https://badgen.net/bundlephobia/minzip/olik)
![Dependency count](https://badgen.net/bundlephobia/dependency-count/olik)
[📖 Docs](https://memeplexx.github.io/olik/)

```ts
// replace the users age
store.user.age.$replace(28);

// insert one todo
store.todos.$insertOne(todo);

// find a todo by its id, and replace it
store.todos.$find.id.$eq(3).$replace(todo);

// remove all todos which are not urgent
store.todos.$filter.urgency.$lt(2).$remove();

// find a todo by its id, and change its status as 'done'
store.todos.$find.status.$eq(5).status.$replace('done');

// read state
const todos = store.todos.$state;

// listen to state changes to the user's name
const subscription = store.user.name
  .$onChange(name => console.log(`name is now "${name}"`))

// listen to changes to 'pending' todos
store.todos.$filter.status.$eq('pending')
  .$onChange(todos => console.log(todos));

// make an asynchronous update
store.todos
  .$replace(() => fetch('https://api.dev/todos').then(r => r.json()));
```
