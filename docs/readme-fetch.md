# OULIK - FETCHING DATA #

## FETCHING ASYNC STATE ##
**Fetchers** report the status of a request, prevent duplicate simulataneous requests, cache responses, and automatically update your store. 

`api.ts`
```Typescript
const fetchSize = createFetcher({
  onStore: store(s => s.size),
  getData: () => fetchSizeFromApi(),
  cacheFor: 1000 * 60,
});
```

`component.ts`
```Typescript
const sizeFetcher = fetchSize();
const onChangeSubscription = sizeFetcher.onChange(() => console.log(`Fetcher status is currently ${sizeFetcher.status}`));
onChangeSubscription.unSubscribe(); // Always unsubscribe to avoid memory leaks
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