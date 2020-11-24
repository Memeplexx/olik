# OULIK - READING STATE #

Let's first assume that a store has been initialized as follows:
```Typescript
import { make } from 'oulik';

const store = make({
  size: { width: 10, height: 10 },
  border: { thickness: 1 },
}); 
```
---

## READING STATE ##
```Typescript
const width = store(s => s.size.width).read();
```

## LISTENING TO STATE UPDATES ##
```Typescript
const listener = store(c => c.size.width).onChange(width => console.log(width));
listener.unsubscribe(); // Always unsubscribe to avoid memory leaks
```  

## HANDLING DERIVED STATE ##
We can derive state from the store
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
listener.unsubscribe(); // Always unsubscribe to avoid memory leaks
```
