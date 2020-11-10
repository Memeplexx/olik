import { Derivation, MappedDataTuple, Store, Unsubscribable } from "./shape";

/**
 * Takes an arbitrary number of state selections as input, and performs an expensive calculation only when one of those inputs change value.  
 * FOR EXAMPLE:
 * ```Typescript
 * const memo = deriveFrom(
 *   store(s => s.some.property),
 *   store(s => s.some.other.property),
 * ).usingExpensiveCalc((someProperty, someOtherProperty) => {
 *   // perform some expensive calculation and return the result
 * });
 * 
 * const memoizedResult = memo.read();
 * ```
 */
export function deriveFrom<X extends Store<any, any, any>[]>(...args: X) {
  let previousParams = new Array<any>();
  let previousResult = null as any;
  return {
    usingExpensiveCalc: <R>(calculation: (...inputs: MappedDataTuple<X>) => R) => {
      const getValue = () => {
        const params = (args as Array<Store<any, any, any>>).map(arg => arg.read());
        if (previousParams.length && params.every((v, i) => v === previousParams[i])) {
          return previousResult;
        }
        const result = calculation(...(params as Store<any, any, any>));
        previousParams = params;
        previousResult = result;
        return result;
      }
      const changeListeners = new Set<(value: R) => any>();
      return {
        read: () => getValue(),
        onChange: (listener: (value: R) => any) => {
          changeListeners.add(listener);
          const unsubscribables: Unsubscribable[] = (args as Array<Store<any, any, any>>)
            .map(ops => ops.onChange(() => listener(getValue())));
          return {
            unsubscribe: () => {
              unsubscribables.forEach(u => u.unsubscribe());
              changeListeners.delete(listener);
            }
          }
        }
      } as Derivation<R>;
    }
  }
}