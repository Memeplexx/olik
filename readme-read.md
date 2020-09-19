# OULIK - READING STATE #

This guide shows the vanilla (framework-less) way of reading state and reacting to updates. It may be more appropriate to checkout:  
![](assets/react.ico) [Reading state with **Oulik-React**]()  
![](assets/angular.png) [Reading state with **Oulik-NG**](./readme-ng-read.md)  

---

Let's first assume that a store has been initialized as follows:
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
const canvasWidth = getCanvas().read().size.width;
```

## LISTENING TO STATE UPDATES ##
```Typescript
const listener = getCanvas(c => c.size.width)
  .onChange(width => console.log(width));
listener.unsubscribe(); // Please unsubscribe to avoid memory leaks
```  

## CALCULATING DERIVED STATE ##
```Typescript
import { deriveFrom } from 'oulik';

const innerWidth = deriveFrom(
  getCanvas(s => s.size.width),
  getCanvas(s => s.border.thickness),
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
Using *Fetchers* allows you to track the status of a request (loading / success / error) as well as cache request responses.

`api.ts`
```Typescript
const canvasSizeFetcher = getCanvas(s => s.size)
  .createFetcher(() => fetchCanvasSizeFromApi(), { cacheForMillis: 1000 * 60 });
```

`component.ts`
```Typescript
canvasSizeFetcher
  .onStatusChange(status => console.log(`Fetcher is status currently ${status}`))
canvasSizeFetcher.fetch()
  .then(size => ...);
```