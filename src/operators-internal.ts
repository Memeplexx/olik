import { Selector, Trackability, UpdateOptions } from './shapes-external';
import { StoreWhichIsNestedInternal, UpdateStateFn } from './shapes-internal';
import { libState } from './shared-state';

export const defineRemoveNestedStore = <S, C, X extends C & Array<any>, T extends Trackability>(
  currentState: () => S,
  updateState: UpdateStateFn<S, C, T, X>,
) => ((name, key) => () => {
  if (!libState.nestedContainerStore) { return; }
  if (Object.keys((currentState() as S & { nested: any }).nested[name]).length === 1) {
    updateState({
      selector: ((s: S & { nested: any }) => s.nested) as Selector<S, C, X>,
      replacer: old => {
        const { [name]: toRemove, ...others } = old as Record<any, any>;
        return others;
      },
      mutator: (s: Record<any, any>) => delete s[name],
      pathSegments: ['nested'],
      actionName: 'removeNested',
      payload: { name, key },
      updateOptions: undefined as UpdateOptions<T>,
    })
  } else {
    updateState({
      selector: ((s: S & { nested: any }) => s.nested[name]) as Selector<S, C, X>,
      replacer: old => {
        const { [key]: toRemove, ...others } = old as Record<any, any>;
        return others;
      },
      mutator: (s: Record<any, any>) => delete s[key],
      pathSegments: ['nested', name],
      actionName: 'removeNested',
      payload: key,
      updateOptions: undefined as UpdateOptions<T>,
    })
  }
}) as StoreWhichIsNestedInternal<S, C>['defineRemoveNestedStore'];
