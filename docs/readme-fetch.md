# OULIK - FETCHING DATA #

## FETCHING ASYNC STATE ##
**Fetchers** report the status of a request, prevent duplicate simulataneous requests, cache responses, and automatically update your store. 


Let's first assume that a store has been initialized as follows:
```Typescript
import { make } from 'oulik';

const store = make({
  todos: new Array<{ id: number, text: string }>(),
}); 
```
---

`api.ts`
```Typescript
const fetchTodos = createFetcher({
  onStore: store(s => s.todos),
  getData: () => fetchTodosFromApi(),
  cacheFor: 1000 * 60,
});
```

`component.ts`
```Typescript
const subscription = fetchTodos()
  .onChange(() => console.log(`Fetcher status is currently ${sizeFetcher.status}`));
subscription.unSubscribe(); // Always unsubscribe to avoid memory leaks
```

## FETCHING ASYNC STATE (WITH ARGS) ##
Some data fetches, such as **pagination** need an argument to be supplied to the fetcher

`api.ts`
```Typescript
const fetchTodos = createFetcher({
  onStore: store(s => s.todos),
  getData: (args: { offset: number, count: number }) => fetchTodosFromApi(offset, count),
  cacheFor: 1000 * 60,
});
```

`component.ts`
```Typescript
const todosFetcher = fetchTodos({ offset: 0, count: 10 });
```