import { augmentations } from './augmentations';
import { Derivation, DerivationCalculationInputs, StoreOrDerivation, Unsubscribable } from './shapes-external';

/**
 * Takes an arbitrary number of state selections as input, and performs an expensive calculation only when one of those inputs change value.  
 * FOR EXAMPLE:
 * ```Typescript
 * const memo = deriveFrom(
 *   select(s => s.some.property),
 *   select(s => s.some.other.property),
 * ).usingExpensiveCalc((someProperty, someOtherProperty) => {
 *   // perform some expensive calculation and return the result
 * });
 * 
 * const memoizedResult = memo.read();
 * ```
 */
export function deriveFrom<X extends StoreOrDerivation<any>[]>(...args: X) {
  let previousParams = new Array<any>();
  let previousResult = null as any;
  return {
    usingExpensiveCalc: <R>(calculation: (...inputs: DerivationCalculationInputs<X>) => R) => {
      const getValue = () => {
        const params = (args as Array<StoreOrDerivation<any>>).map(arg => arg.read());
        if (previousParams.length && params.every((v, i) => v === previousParams[i])) {
          return previousResult;
        }
        const result = calculation(...(params as any));
        previousParams = params;
        previousResult = result;
        return result;
      }
      const changeListeners = new Set<(value: R) => any>();
      const result: Derivation<R> = {
        read: () => getValue(),
        invalidate: () => previousParams.length = 0,
        onChange: (listener: (value: R) => any) => {
          changeListeners.add(listener);
          const unsubscribables: Unsubscribable[] = (args as Array<StoreOrDerivation<any>>)
            .map(ops => ops.onChange(() => listener(getValue())));
          return {
            unsubscribe: () => {
              unsubscribables.forEach(u => u.unsubscribe());
              changeListeners.delete(listener);
            }
          }
        }
      };
      Object.keys(augmentations.derivation).forEach(name => (result as any)[name] = augmentations.derivation[name](result));
      return result;
    }
  }
  
}