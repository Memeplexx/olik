import { augmentations, libState } from './constant';
import { Derivable, Derivation, DerivationCalculationInputs, Readable, StateAction, Unsubscribe } from './type';
import { enqueueMicroTask } from './utility';


export function derive<X extends Derivable<unknown>[]>(...args: X) {
  let cacheKey: { state: unknown; path: string; }[];
  const fn = (sync: boolean) => <R>(calculation: (...inputs: DerivationCalculationInputs<X>) => R) => {
    const getValue = () => {
      const params = (args as Array<Readable<unknown> & { $actions?: StateAction[], $cacheKey?: { state: unknown; path: string; }[] }>)
        .map(arg => {
          const state = arg.$state; // force read so that cacheKey is set
          const path = arg.$actions
            ? arg.$actions.map(action => `${action.name}${action.arg !== undefined ? `(${action.arg})` : ''}`).join('.')
            : arg.$cacheKey!.map(k => k.path).join('|');
          return { state, path }
        })
      const kvp = [...libState.derivations.entries()]
        .filter(([previousParams]) => previousParams.length === params.length)
        .find(([previousParams]) => {
          return params.every((param, i) => {
            const previousParam = previousParams[i];
            const previousArray = previousParam.state as Array<unknown>;
            // Compare paths
            return (param.path === previousParam.path) && (
              // Start with a simple equality check.
              param.state === previousParam.state
              // Else, if an array has been filtered (creating a new array each time) compare stringified versions of the state
              || (Array.isArray(param.state) && param.state.length === previousArray.length && param.state.every((p, i) => p === previousArray[i]))
            );
          })
        })
      if (kvp) {
        if (cacheKey === undefined) {
          cacheKey = params; // needs to be set in case derive() is called more than once
        }
        return kvp[1] as R;
      }
      const result = calculation(...params.map(p => p.state) as DerivationCalculationInputs<X>);
      libState.derivations.set(params, result);
      cacheKey = params;
      return result;
    }
    const changeListeners = new Set<(value: R) => unknown>();
    const result = (new class {
      get $state() { return getValue(); }
      get $cacheKey() { return cacheKey; }
      $invalidate = () => libState.derivations.delete(cacheKey);
      $cleanup = (listener: (value: R) => unknown, subscriptions: Unsubscribe[]) => ({
        unsubscribe: () => {
          subscriptions.forEach(u => u.unsubscribe());
          changeListeners.delete(listener);
          libState.derivations.delete(cacheKey);
        }
      })
      $onChangeSync = (listener: (value: R) => unknown) => {
        changeListeners.add(listener);
        const subscriptions = args.map(arg => ('$onChangeSync' in arg ? arg.$onChangeSync : arg.$onChange)(() => listener(getValue())));
        return this.$cleanup(listener, subscriptions);
      }
      $onChange = (listener: (value: R) => unknown) => {
        if (sync) {
          return this.$onChangeSync(listener);
        }
        changeListeners.add(listener);
        let valueCalculated: boolean;
        const subscriptions = args.map(arg => ('$onChangeSync' in arg ? arg.$onChangeSync : arg.$onChange)(() => {
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
    Object.keys(augmentations.derivation).forEach(name => (result as unknown as Record<string, unknown>)[name] = augmentations.derivation[name](result));
    return result;
  };
  return {
    /**
     * Supply a calculator function that will be called whenever the derivation's inputs changes.
     * This function will NOT be called immediately and IS optimized for performance because it will ONLY be called once the event loop completes.
     */
    $with: fn(false),
    /**
     * Supply a calculator function that will be called whenever the derivation's inputs changes.
     * This function will be called immediately and is NOT optimized for performance because it WILL be called immediately on EVERY input change.
     */
    $withSync: fn(true),
  }
}
