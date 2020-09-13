# OULIK - READING STATE #

*NOTE: this guide shows the vanilla (framework-less) way of reading state.  
It may be more appropriate to checkout [React's]() & [Angular's](./readme-angular-read.md) approach to reading & reacting to state updates.*

---

Let's first assume that a store has been initialized as follows...
```Typescript
import { make } from 'oulik';

const getCanvas = make('canvas', {
  size: { width: 10, height: 10 },
  border: { thickness: 1 },
}); 
```
---

## READING STATE SYNCHRONOUSLY ##
```Typescript
const canvasWidth = getCanvas(s => s.size.width).read();
```

## LISTENING TO STATE UPDATES ##

```Typescript
const listener = getCanvas(c => c.size.width).onChange(width => console.log(width));
listener.unsubscribe(); // Please unsubscribe to avoid memory leaks
```  

## CALCULATING DERIVED STATE ##
```Typescript
import { derive } from 'oulik';

const innerWidth = deriveFrom(
  getCanvas(s => s.size.width),
  getCanvas(s => s.border.thickness),
).usingExpensiveCalc((boxWidth, borderThickness) => {
  return boxWidth - (borderThickness * 2); // Usually we'd be performing a much bigger calculation here
});

const width = innerWidth.read();

const listener = innerWidth.onChange(innerWidth => console.log('inner width', innerWidth));
listener.unsubscribe(); // Please unsubscribe to avoid memory leaks
```

## FETCHING STATE FROM EXTERNAL SOURCES ##
Using *Fetchers* allows you to track the status of a request (loading / success / error), and cache request responses.

`api.ts`
```Typescript
const canvasSizeFetcher = getCanvas(s => s.size)
  .createFetcher(() => fetchCanvasSizeFromApi(), { cacheForMillis: 1000 * 60 })
```

`component.ts`
```Typescript
canvasSizeFetcher
  .onStatusChange(status => console.log(`Fetcher is status currently ${status}`))
canvasSizeFetcher.fetch()
  .then(size => ...);
```