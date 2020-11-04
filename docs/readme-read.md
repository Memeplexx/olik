# OULIK - READING STATE #

Let's first assume that a store has been initialized as follows:
```Typescript
import { make } from 'oulik';

const store = make('canvas', {
  size: { width: 10, height: 10 },
  border: { thickness: 1 },
}); 
```
---

## READING STATE SYNCHRONOUSLY ##
```Typescript
const width = store(s => s.size.width).read();
```

## LISTENING TO STATE UPDATES ##
```Typescript
const listener = store(c => c.size.width)
  .onChange(width => console.log(width));
listener.unsubscribe(); // Please unsubscribe to avoid memory leaks
```  

## CALCULATING DERIVED STATE ##
```Typescript
import { deriveFrom } from 'oulik';

const innerWidth = deriveFrom(
  store(s => s.size.width),
  store(s => s.border.thickness),
).usingExpensiveCalc((
  boxWidth,
  borderThickness,
) => {
  return boxWidth - (borderThickness * 2); // Usually we'd be performing a much bigger calculation here
});

const width = innerWidth.read();

const listener = innerWidth.onChange(innerWidth => console.log('inner width', innerWidth));
listener.unsubscribe(); // Please unsubscribe to avoid memory leaks
```

## FETCHING STATE FROM EXTERNAL SOURCES ##
*Fetchers* report the status of an asynchronous request, prevent duplicate simulataneous requests, cache responses, and automatically updates your store. 

`api.ts`
```Typescript
const fetchSize = store(s => s.size).createFetcher({
  getData: () => fetchSizeFromApi(),
  cacheFor: 1000 * 60,
});
```

`component.ts`
```Typescript
const sizeFetcher = fetchSize();
const onChangeSubscription = sizeFetcher.onChange(() => console.log(`Fetcher status is currently ${sizeFetcher.status}`));
onChangeSubscription.unSubscribe(); // don't forget to unsubscribe when you no longer want to receive events to avoid memory leaks
```
