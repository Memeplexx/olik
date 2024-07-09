import { augmentations } from './constant';
import { BasicRecord, Derivation, DerivationCalculationInputs, DerivationUnSubscribe, Readable, Unsubscribe } from './type';
import { enqueueMicroTask } from './utility';


export function derive<X extends Readable<unknown>[]>(...args: X) {
  let previousParams = new Array<unknown>();
  let previousResult = null as unknown;
  const $with = <R>(accumulator: R, calculation: (...inputs: DerivationCalculationInputs<X>) => R) => {
    const getValue = () => {
      const params = args.map(arg => arg.$state) as DerivationCalculationInputs<X>;
      if (previousParams.length && params.every((v, i) => {
        // Start with a simple equality check.
        // Else, if an array has been filtered (creating a new array to be created each time) compare stringified versions of the state
        return (v === previousParams[i]) || (Array.isArray(v) && JSON.stringify(v) === JSON.stringify(previousParams[i]));
      })) {
        return previousResult as R;
      }
      const result = accumulator === undefined ? calculation(...params) : calculation(...[accumulator, ...params] as DerivationCalculationInputs<X>);
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
          if (valueCalculated)
            return;
          valueCalculated = true;
          listener(getValue(), previousResult as R);
        })
      }));
      return $cleanup(listener, subscriptions);
    }
    const $onChangeImmediate = (listener: (value: R, previous: R) => void) => {
      changeListeners.add(listener);
      const subscriptions = args.map(arg => arg.$onChange(() => listener(getValue(), previousResult as R)));
      return $cleanup(listener, subscriptions);
    }
    const result = {
      get $state() { return getValue(); },
      $invalidate: () => previousParams.length = 0,
      $onChange,
      $onChangeImmediate,
      $unsubscribe: accumulator !== undefined ? $onChangeImmediate(() => {}) : () => null,
    } as Derivation<R> & DerivationUnSubscribe<R>;
    Object.keys(augmentations.derivation).forEach(name => (result as unknown as BasicRecord)[name] = augmentations.derivation[name](result));
    return result;
  }
  return {
    $with: <R>(calculation: (...inputs: DerivationCalculationInputs<X>) => R) => $with(undefined, calculation) as Derivation<R>,
    $withAccumulator: $with as <R>(accumulator: R, calculation: (accumulator: R, ...inputs: DerivationCalculationInputs<X>) => R) => Derivation<R> & DerivationUnSubscribe<R>
  }
}
