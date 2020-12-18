# OULIK - FETCHING DATA #

**🐕‍🦺 Fetchers** report the status of a request, prevent duplicate simultaneous requests, cache responses, and automatically update your store. 

## BEFORE WE BEGIN... ##  
Let's first assume that a store has been initialized as follows:
```Typescript
import { make } from 'oulik';

const get = make({ todos: new Array<{ id: number, text: string }>() }); 
```
---
## FETCHING ASYNC STATE ##

`api.ts`
```Typescript
const fetchTodos = createFetcher({
  onStore: get(s => s.todos),
  getData: () => fetchTodosFromApi(),
  cacheFor: 1000 * 60,
});
```

`component.ts`
```Typescript
const todosFetch = fetchTodos()
  .onChange(() => console.log(`Fetcher status is currently ${sizeFetcher.status}`));
todosFetch.unSubscribe(); // Always unsubscribe to avoid memory leaks
```

## FETCHING ASYNC STATE (WITH ARGS) ##
Some data fetches, such as **pagination** need an argument to be supplied to the fetcher

`api.ts`
```Typescript
const fetchTodos = createFetcher({
  onStore: get(s => s.todos),
  getData: (arg: { offset: number, count: number }) => fetchTodosFromApi(arg.offset, arg.count),
  setData: (arg) => arg.store.addAfter(arg.data),
  cacheFor: 1000 * 60,
});
```

`component.ts`
```Typescript
const todosFetch = fetchTodos({ offset: 0, count: 10 });
```