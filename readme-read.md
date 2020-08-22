# OULIK 'FETCHERS' #
*Fetchers* are an **optional** standardized mechanism for
* fetching data from external resources,
* indicating the status of a request (loading / success / error), and 
* caching request responses (optional).

`api.ts`
```Typescript
const todosFetcher = store
  .select(s => s.schedule.todos)
  .createFetcher(() => fetchTodosFromApi(), { cacheForMillis: 1000 * 60 })
```

`component.ts`
```Typescript
todosFetcher.fetch()
  .then(todos => ...);
```