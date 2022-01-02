import { augmentations } from './constant';
import { DeepReadonly, Derivation, DerivationCalculationInputs, Readable, Unsubscribe } from './type';

export function derive<X extends Readable<any>[]>(...args: X) {
  let previousParams = new Array<any>();
  let previousResult = null as any;
  return {
    with: <R>(calculation: (...inputs: DerivationCalculationInputs<X>) => R) => {
      const getValue = () => {
        const params = (args as Array<Readable<any>>).map(arg => arg.state);
        if (previousParams.length && params.every((v, i) => {
          // Start with a simple equality check.
          // Else, if an array has been filtered (creating a new array to be created each time) compare stringified versions of the state
          return (v === previousParams[i]) || (Array.isArray(v) && JSON.stringify(v) === JSON.stringify(previousParams[i]));
        })) {
          return previousResult;
        }
        const result = calculation(...(params as any));
        previousParams = params;
        previousResult = result;
        return result;
      }
      const changeListeners = new Set<(value: DeepReadonly<R>) => any>();
      const result = (new class {
        get state() { return getValue(); }
        invalidate = () => previousParams.length = 0;
        onChange = (listener: (value: DeepReadonly<R>) => any) => {
          changeListeners.add(listener);
          const unsubscribes: Unsubscribe[] = args
            .map(ops => ops.onChange(() => listener(getValue())));
          return {
            unsubscribe: () => {
              unsubscribes.forEach(u => u.unsubscribe());
              changeListeners.delete(listener);
            }
          }
        }
      }()) as Derivation<R>;
      Object.keys(augmentations.derivation).forEach(name => (result as any)[name] = augmentations.derivation[name](result));
      return result;
    }
  }
}
