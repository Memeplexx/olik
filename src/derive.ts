import { augmentations, libState } from './constant';
import { Derivation, DerivationCalculationInputs, Readable, Unsubscribe } from './type';


export function derive<X extends Readable<unknown>[]>(...args: X) {
  // let previousParams = new Array<unknown>();
  // let previousResult = null as unknown;
  let cacheKey: unknown[];
  return {
    $with: <R>(calculation: (...inputs: DerivationCalculationInputs<X>) => R) => {

      // const getValue = () => {
      //   const params = args.map(arg => arg.$state) as DerivationCalculationInputs<X>;
      //   if (previousParams.length && params.every((v, i) => {
      //     // Start with a simple equality check.
      //     // Else, if an array has been filtered (creating a new array to be created each time) compare stringified versions of the state
      //     return (v === previousParams[i]) || (Array.isArray(v) && JSON.stringify(v) === JSON.stringify(previousParams[i]));
      //   })) {
      //     return previousResult as R;
      //   }
      //   const result = calculation(...params);
      //   previousParams = params;
      //   previousResult = result;
      //   return result;
      // }
      const getValue = () => {
        const params = args.map(arg => arg.$state) as DerivationCalculationInputs<X>;
        const kvp = [...libState.derivations.entries()].find(([previousParams]) => {
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

        // $invalidate = () => previousParams.length = 0;
        $invalidate = () => libState.derivations.delete(cacheKey);

        $onChange = (listener: (value: R) => unknown) => {
          changeListeners.add(listener);
          const unsubscribes: Unsubscribe[] = args

            // .map(ops => ops.$onChange(() => listener(getValue())));
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
