import { augmentations, libState } from './constant';
import { Derivable, Derivation, DerivationCalculationInputs, DerivationKey, Readable, StateAction, Unsubscribe } from './type';
import { enqueueMicroTask } from './utility';


export const derive = (key: string) => ({
  $from: <X extends Derivable<unknown>[]>(...args: X) => {
    let cacheKey: DerivationKey;
    const fn = (sync: boolean) => <R>(calculation: (...inputs: DerivationCalculationInputs<X>) => R) => {
      const getValue = () => {
        const params: DerivationKey = {
          key,
          state: null,
          from: (args as Array<Readable<unknown> & { $stateActions?: StateAction[], $cacheKey?: DerivationKey }>)
            .map(arg => {
              const state = arg.$state; // force read so that cacheKey is set
              if (arg.$stateActions) {
                return { state, key: arg.$stateActions.map(action => `${action.name}${action.arg !== undefined ? `(${action.arg})` : ''}`).join('.') };
              } else {
                return { ...arg.$cacheKey!, state };
              }
            })
        }
        const kvp = [...libState.derivations.entries()]
          .filter(([previousParams]) => previousParams.key === params.key && previousParams.from!.length === params.from!.length)
          .find(([previousParams]) => {
            return params.from!.every((param, i) => {
              const previousParam = previousParams.from![i];
              const previousArray = previousParam.state as Array<unknown>;
              const strip = (thing: DerivationKey): unknown => {
                return {
                  key: thing.key,
                  from: thing.from?.map(p => strip(p)),
                }
              }
              // Compare paths (in case the keys are not different but the path is)
              return (JSON.stringify(strip(param)) === JSON.stringify(strip(previousParam))) && ( // TODO: Make this more EFFICIENT! Right now it is serializing state EVERY TIME
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
        const result = calculation(...params.from!.map(p => p.state) as DerivationCalculationInputs<X>);
        libState.derivations.set(params, result);
        cacheKey = params;
        cacheKey.state = result;
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

})