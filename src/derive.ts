import { augmentations, libState } from './constant';
import { Derivation, DerivationCalculationInputs, Readable, StateAction, Unsubscribe } from './type';
import { serialize } from './utility';


export function derive<X extends Readable<unknown>[]>(...args: X) {
  let cacheKey: { state: unknown; path: string; }[];
  return {
    $with: <R>(calculation: (...inputs: DerivationCalculationInputs<X>) => R) => {
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
              // Compare paths
              return (param.path === previousParam.path) && (
                // Start with a simple equality check.
                param.state === previousParam.state
                // Else, if an array has been filtered (creating a new array each time) compare stringified versions of the state
                || (Array.isArray(param.state) && serialize(param.state) === serialize(previousParam.state))
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
        $onChange = (listener: (value: R) => unknown) => {
          changeListeners.add(listener);
          const unsubscribes: Unsubscribe[] = args
            .map(ops => ops.$onChange(() => listener(getValue())));
          return {
            unsubscribe: () => {
              unsubscribes.forEach(u => u.unsubscribe());
              changeListeners.delete(listener);
              libState.derivations.delete(cacheKey);
            }
          }
        }
      }()) as Derivation<R>;
      Object.keys(augmentations.derivation).forEach(name => (result as unknown as Record<string, unknown>)[name] = augmentations.derivation[name](result));
      return result;
    }
  }
}
