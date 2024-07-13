import { augmentations } from './constant';
import { BasicRecord, DerivationCalculationInputs, Readable, Unsubscribe } from './type';
import { enqueueMicroTask } from './utility';


export function derive<X extends Readable<unknown>[]>(...args: X) {
  let previousParams = new Array<unknown>();
  let previousResult = null as unknown;
  const $with = <R>(calculation: (...inputs: DerivationCalculationInputs<X>) => R) => {
    const $state = () => {
      const params = args.map(arg => arg.$state) as DerivationCalculationInputs<X>;
      if (previousParams.length && params.every((v, i) => {
        // Start with a simple equality check.
        // Else, if an array has been filtered (creating a new array to be created each time) compare stringified versions of the state
        return (v === previousParams[i]) || (Array.isArray(v) && JSON.stringify(v) === JSON.stringify(previousParams[i]));
      })) return previousResult as R;
      const result = calculation(...params);
      previousParams = params;
      previousResult = result;
      return result;
    }
    const changeListeners = new Set<(value: R, previous: R) => void>();
    const $cleanup = (listener: (value: R, previous: R) => void, subscriptions: Unsubscribe[]) => () => {
      subscriptions.forEach(u => u());
      changeListeners.delete(listener);
    }
    const $onChange = (listener: (value: R, previous: R) => void) => {
      changeListeners.add(listener);
      let valueCalculated: boolean;
      const subscriptions = args.map(arg => arg.$onChange(() => {
        valueCalculated = false;
        enqueueMicroTask(() => { // wait for all other change listeners to fire
          if (valueCalculated) return;
          valueCalculated = true;
          listener($state(), previousResult as R);
        })
      }));
      return $cleanup(listener, subscriptions);
    }
    const $onChangeImmediate = (listener: (value: R, previous: R) => void) => {
      changeListeners.add(listener);
      const subscriptions = args.map(arg => arg.$onChange(() => listener($state(), previousResult as R)));
      return $cleanup(listener, subscriptions);
    }
    const result = {
      get $state() { return $state(); },
      $invalidate: () => previousParams.length = 0,
      $onChange,
      $onChangeImmediate,
    };
    Object.keys(augmentations.derivation).forEach(name => (result as unknown as BasicRecord)[name] = augmentations.derivation[name](result as Readable<R>));
    return result;
  }
  const $withAccumulator = <R>(accumulator: R, calculation: (accumulator: R, ...inputs: DerivationCalculationInputs<X>) => (void | undefined)) => {
    const $state = () => {
      calculation(accumulator, ...args.map(arg => arg.$state) as DerivationCalculationInputs<X>);
      return accumulator;
    }
    const changeListeners = new Set<(value: R, previous: R) => void>();
    const $cleanup = (listener: (value: R, previous: R) => void, subscriptions: Unsubscribe[]) => () => {
      subscriptions.forEach(u => u());
      changeListeners.delete(listener);
    }
    const $onChange = (listener: (value: R, previous: R) => void) => {
      changeListeners.add(listener);
      const subscriptions = args.map(arg => arg.$onChange(() => listener($state(), previousResult as R)));
      return $cleanup(listener, subscriptions);
    }
    const result = {
      get $state() { return $state(); },
      $onChange,
      $destroy: $onChange(() => {})
    };
    Object.keys(augmentations.derivation).forEach(name => (result as BasicRecord)[name] = augmentations.derivation[name](result as Readable<R>));
    return result;
  }
  return {
    /**
     * Accepts a function that will be called whenever the state of the derivation changes.
     * This function should perform a calculation and return the result.
     */
    $with,
    /**
     * Define a function that will be called whenever the state of the derivation changes.
     * @param accumulator The initial value of the mutable accumulator object who's value should be mutated by the calculation function.
     * @param calculation The function that will be called whenever the state of the derivation changes.
     */
    $withAccumulator,
  }
}
