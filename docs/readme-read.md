# OULIK - READING STATE #

## BEFORE WE BEGIN... ##  
Let's first assume that a store has been initialized as follows:
```Typescript
import { make } from 'oulik';

const get = make({
  size: { width: 10, height: 10 },
  border: { thickness: 1 },
}); 
```
---

## SYNCHRONOUS READS ##
Read data directly from the store
```Typescript
const width = get(s => s.size.width).read();
```

## ASYNCHRONOUS READS ##
Listen to updates to a particular part of the store
```Typescript
const listener = get(c => c.size.width).onChange(width => console.log(width));
listener.unsubscribe(); // Always unsubscribe to avoid memory leaks
```  

## MEMOIZED READS ##
Memoize computationally expensive state that has been derived from the store
```Typescript
import { deriveFrom } from 'oulik';

const innerWidth = deriveFrom(
  get(s => s.size.width),
  get(s => s.border.thickness),
).usingExpensiveCalc((
  boxWidth,
  borderThickness,
) => {
  return boxWidth - (borderThickness * 2); // Usually we'd be performing a much bigger calculation here
});

const width = innerWidth.read();

const listener = innerWidth.onChange(innerWidth => console.log('inner width', innerWidth));
listener.unsubscribe(); // Always unsubscribe to avoid memory leaks
```
