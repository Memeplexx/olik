import { augmentations, libState } from './constant';
import { Derivation, DerivationCalculationInputs, Readable, Unsubscribe } from './type';


export function derive<X extends Readable<unknown>[]>(...args: X) {
  let cacheKey: unknown[];
  return {
    $with: <R>(calculation: (...inputs: DerivationCalculationInputs<X>) => R) => {
      const getValue = () => {
        const params = args.map(arg => arg.$state) as DerivationCalculationInputs<X>;
        const kvp = [...libState.derivations.entries()]
          .filter(([previousParams]) => previousParams.length === params.length)
          .find(([previousParams]) => {
          return params.every((param, i) => {
            const previousParam = previousParams[i];
            // Start with a simple equality check.
            // Else, if an array has been filtered (creating a new array to be created each time) compare stringified versions of the state
            return (param === previousParam) || (Array.isArray(param) && JSON.stringify(param) === JSON.stringify(previousParam));
          })
        })
        if (kvp) {
          return kvp[1] as R;
        }
        const result = calculation(...params);
        libState.derivations.set(params, result);
        cacheKey = params;
        return result;
      }
      const changeListeners = new Set<(value: R) => unknown>();
      const result = (new class {
        get $state() { return getValue(); }
        $invalidate = () => libState.derivations.delete(cacheKey);
        $onChange = (listener: (value: R) => unknown) => {
          changeListeners.add(listener);
          const unsubscribes: Unsubscribe[] = args
            .map(ops => ops.$onChange(() => listener(getValue())));
          return {
            unsubscribe: () => {
              unsubscribes.forEach(u => u.unsubscribe());
              changeListeners.delete(listener);
            }
          }
        }
      }()) as Derivation<R>;
      Object.keys(augmentations.derivation).forEach(name => (result as unknown as Record<string, unknown>)[name] = augmentations.derivation[name](result));
      return result;
    }
  }
}
