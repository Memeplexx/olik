/* eslint-disable react-hooks/rules-of-hooks */
import * as core from 'olik';
import { FutureState } from 'olik';
import React from 'react';

export * from 'olik';

declare module 'olik' {
  interface StoreOrDerivation<C> {
    useState: (deps?: React.DependencyList) => C;
  }
  interface Derivation<R> {
    useState: (deps?: React.DependencyList) => R;
  }
  interface Future<C> {
    useAsync: (deps?: React.DependencyList) => FutureState<C>;
  }
}

export const init = () => {
  core.augment({
    selection: {
      useState: function<C>(input: core.StoreOrDerivation<C>) {
        return function(deps: React.DependencyList = []) {
          const selection = React.useRef(input);
          const [value, setValue] = React.useState(selection.current.read() as core.DeepReadonly<C>);
          const allDeps = [selection.current.read()];
          if (deps) { allDeps.push(...deps); }
          React.useEffect(() => {
            const subscription = selection.current.onChange(arg => {
              setValue(arg as core.DeepReadonly<C>); //// deepreadonly ?
            });
            return () => subscription.unsubscribe();
            // eslint-disable-next-line react-hooks/exhaustive-deps
          }, allDeps);
          return value;
        }
      },
    },
    derivation: {
      useState: function<C>(input: core.Derivation<C>) {
        return function(deps: React.DependencyList = []) {
          const selection = React.useRef(input);
          const [value, setValue] = React.useState(selection.current.read() as core.DeepReadonly<C>);
          const previousDeps = React.useRef(deps);
          const first = React.useRef(true);
          React.useEffect(() => {
            let subscription: core.Unsubscribable;
            if (first || (JSON.stringify(previousDeps.current) !== JSON.stringify(deps))) {
              selection.current = input;
              setValue(selection.current.read() as any);
              previousDeps.current = deps;
              subscription = selection.current.onChange(arg => {
                setValue(arg as core.DeepReadonly<C>);
              })
            }
            return () => {
              if (subscription) { subscription.unsubscribe(); }
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
          }, deps);
          return value;
        }
      },
    },
    future: {
      useAsync: function<C>(input: core.Future<C>) {
        return function(deps: React.DependencyList = []) {
          const selection = React.useRef(input);
          const [value, setValue] = React.useState({ error: null, isLoading: true, storeValue: input.read(), wasRejected: false, wasResolved: false } as core.FutureState<C>);
          const previousDeps = React.useRef(deps);
          const first = React.useRef(true);
          React.useEffect(() => {
            let subscription: core.Unsubscribable;
            if (first || (JSON.stringify(previousDeps.current) !== JSON.stringify(deps))) {
              selection.current = input;
              previousDeps.current = deps;
              setValue({ error: null, isLoading: true, storeValue: input.read(), wasRejected: false, wasResolved: false })
              subscription = selection.current.onChange(arg => {
                setValue(arg);
              })
            }
            return () => {
              if (subscription) { subscription.unsubscribe(); }
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
          }, deps);
          return value;
        }
      }
    }
  })
}

export const useComponentStore = function<C>(
  initialState: C,
  options: core.OptionsForMakingAComponentStore,
) {
  const initState = React.useRef(initialState);
  const opts = React.useRef(options);
  const select = React.useMemo(() => {
    return core.createComponentStore(initState.current, opts.current);
  }, []);
  React.useEffect(() => {
    return () => {
      const devMode = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
      // In dev mode, React.StrictMode is enabled. We cannot allow the store to be detached in this instance because an 
      // error will be thrown the next time a developer saves a code update and then attempts to update the nested store state.
      if (!devMode) {
        select().detachFromRootStore();
      } else { // Reset the state. Note for future: It may be safest that this is the ONLY correct behavior (rather than detaching)
        select().reset();
      }
    }
  }, [select]);
  return select;
}



// NOTES the following linting rules have been disabled in certain places:
// react-hooks/exhaustive-deps: We cannot forward deps from the enclosing function without receiving this linting error https://stackoverflow.com/questions/56262515/how-to-handle-dependencies-array-for-custom-hooks-in-react
// react-hooks/rules-of-hooks: We can guarantee the execution order of hooks in the context of the useDerivation() hook https://stackoverflow.com/questions/53906843/why-cant-react-hooks-be-called-inside-loops-or-nested-function
