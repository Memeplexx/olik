import { augmentations } from './constant';
import { BasicRecord, Derivation, DerivationCalculationInputs, Readable, Unsubscribe } from './type';
import { enqueueMicroTask } from './utility';



export function derive<X extends Readable<unknown>[]>(...args: X) {
  let previousParams = new Array<unknown>();
  let previousResult = null as unknown;
  return {
    $with: <R>(calculation: (...inputs: DerivationCalculationInputs<X>) => R) => {
      const getValue = () => {
        const params = args.map(arg => arg.$state) as DerivationCalculationInputs<X>;
        if (previousParams.length && params.every((v, i) => {
          // Start with a simple equality check.
          // Else, if an array has been filtered (creating a new array to be created each time) compare stringified versions of the state
          return (v === previousParams[i]) || (Array.isArray(v) && JSON.stringify(v) === JSON.stringify(previousParams[i]));
        })) {
          return previousResult as R;
        }
        const result = calculation(...params);
        previousParams = params;
        previousResult = result;
        return result;
      }
      const changeListeners = new Set<(value: R) => unknown>();
      const result = (new class {
        get $state() { return getValue(); }
        $invalidate = () => previousParams.length = 0;
        $cleanup = (listener: (value: R) => unknown, subscriptions: Unsubscribe[]) => () => {
          subscriptions.forEach(u => u());
          changeListeners.delete(listener);
        }
        $onChange = (listener: (value: R) => unknown) => {
          changeListeners.add(listener);
          let valueCalculated: boolean;
          const subscriptions = args.map(arg => arg.$onChange(() => {
            valueCalculated = false;
            enqueueMicroTask(() => { // wait for all other change listeners to fire
              if (valueCalculated) { return; }
              valueCalculated = true;
              listener(getValue());
            })
          }));
          return this.$cleanup(listener, subscriptions);
        }
      }()) as Derivation<R>;
      Object.keys(augmentations.derivation).forEach(name => (result as unknown as BasicRecord)[name] = augmentations.derivation[name](result));
      return result;
    }
  }
}
