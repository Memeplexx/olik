import {
  ActionOptions,
  AnyAsync,
  DeepReadonly,
  Selector,
  StoreOrDerivation,
  StoreWhichIsResettable,
  Trackability,
  UpdateAtIndex,
  UpdateOptions,
  ReplaceAll,
  Patch,
  Increment,
  DeepMerge,
  InsertOne,
  InsertMany,
  RemoveAll,
  PatchAll,
  UpsertMatching,
} from './shapes-external';
import { CoreActionsState, StoreState } from './shapes-internal';
import { deepCopy, isEmpty, readSelector, validateSelectorFn } from './shared-utils';
import { processStateUpdateRequest } from './store-updaters';
import { transact } from './transact';

export const onChange = <S, C, X extends C & Array<any>>(
  selector: Selector<S, C, X>,
  changeListeners: Map<(ar: any) => any, (arg: S) => any>,
) => (performAction => {
  changeListeners.set(performAction, selector);
  return { unsubscribe: () => changeListeners.delete(performAction) };
}) as StoreOrDerivation<C>['onChange'];

export const read = <S, C, X extends C & Array<any>>(
  selector: Selector<S, C, X>,
  currentState: () => S,
) => (
  () => selector(currentState())
) as StoreOrDerivation<C>['read'];

export const reset = <S, C, X extends C & Array<any>, T extends Trackability>(
  context: CoreActionsState<S, C, X>,
) => (
  updateOptions => replace({ ...context, name: 'reset' })((context.selector as any)(context.initialState), updateOptions as UpdateOptions<T, any>)
) as StoreWhichIsResettable<C, T>['reset'];

export const replaceAll = <S, C, X extends C & Array<any>, T extends Trackability>(
  context: CoreActionsState<S, C, X>,
) => (
  (replacement, updateOptions) => replace({ ...context, name: 'replaceAll' })(replacement as X, updateOptions as UpdateOptions<T, any>)
) as ReplaceAll<X, T>['replaceAll'];

export const patchAll = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X>,
) => ((argument, updateOptions) => {
  validateSelector(arg);
  return processStateUpdateRequest<S, C, X>({
    ...arg,
    updateOptions,
    actionNameSuffix: `patchAll()`,
    argument,
    replacer: (old, argument) => old.map(o => ({ ...o, ...argument })),
    getPayload: payload => ({ patch: payload }),
  });
}) as PatchAll<X, T>['patchAll'];

export const removeAll = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X>,
) => ((
  argumentOrUpdateOptions?: (() => AnyAsync<any>) | ActionOptions<T>, updateOptionsAsync?: ActionOptions<T>
) => {
  validateSelector(arg);
  return processStateUpdateRequest<S, C, X>({
    ...arg,
    argument: argumentOrUpdateOptions,
    updateOptions: updateOptionsAsync || argumentOrUpdateOptions,
    actionNameSuffix: `removeAll()`,
    getPayload: () => null,
    replacer: () => [],
  });
}) as RemoveAll<T>['removeAll'];

export const insertIntoArray = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X> & { type: 'One' | 'Many' },
) => ((argument, updateOptions: UpdateAtIndex = {}) => {
  validateSelector(arg);
  return processStateUpdateRequest<S, C, X>({
    ...arg,
    updateOptions,
    actionNameSuffix: `insert${arg.type}()`,
    argument,
    replacer: (old, payload) => {
      const input = deepCopy(Array.isArray(payload) ? payload : [payload]);
      return (!isEmpty(updateOptions.atIndex)) ? [...old.slice(0, updateOptions.atIndex), ...input, ...old.slice(updateOptions.atIndex)] : [...old, ...input];
    },
    getPayload: payload => (!isEmpty(updateOptions.atIndex))
      ? { insertion: payload, atIndex: updateOptions.atIndex }
      : { insertion: payload },
  });
}) as InsertOne<X, T>['insertOne'] | InsertMany<X, T>['insertMany'];

export const patch = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X>,
) => ((argument, updateOptions) => {
  validateSelector(arg);
  return processStateUpdateRequest({
    ...arg,
    argument,
    updateOptions,
    actionNameSuffix: `patch()`,
    replacer: (old, payload) => ({ ...old, ...payload }),
    getPayload: payload => ({ patch: payload })
  });
}) as Patch<C, T>['patch'];

export const increment = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X>,
) => ((argument, updateOptions) => {
  validateSelector(arg);
  return processStateUpdateRequest({
    ...arg,
    updateOptions,
    actionNameSuffix: `increment()`,
    argument,
    replacer: (old, payload) => (old as any as number) + (payload as any as number),
    getPayload: payload => ({ incrementBy: payload }),
  });
}) as Increment<T>['increment'];

export const deepMerge = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X>,
) => ((
  argument: C | (() => Promise<C>),
  updateOptions: UpdateOptions<T, any>,
) => {
  validateSelector(arg);
  return processStateUpdateRequest({
    ...arg,
    argument,
    updateOptions,
    actionNameSuffix: `deepMerge()`,
    replacer: (old, payload) => {
      const isObject = (item: any) => (item && typeof item === 'object' && !Array.isArray(item));
      const mergeDeep = (target: any, source: any) => {
        let output = Object.assign({}, target);
        if (isObject(target) && isObject(source)) {
          Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
              if (!(key in target)) {
                Object.assign(output, { [key]: source[key] });
              } else {
                output[key] = mergeDeep(target[key], source[key]);
              }
            } else {
              Object.assign(output, { [key]: source[key] });
            }
          });
        }
        return output;
      }
      return mergeDeep(old, payload);
    },
    getPayload: payload => ({
      toMerge: payload,
    }),
  });
}) as DeepMerge<C, T>['deepMerge'];

export const upsertMatching = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X>
) => (getProp => {
  validateSelector(arg);
  const fn = (type: 'One' | 'Many') => ((argument, updateOptions) => {
    validateSelector(arg);
    const segs = !getProp ? [] : readSelector(getProp);
    let replacementCount = 0;
    let insertionCount = 0;
    return processStateUpdateRequest({
      ...arg,
      updateOptions,
      actionNameSuffix: `upsertMatching(${segs.join('.')}).with${type}()`,
      argument,
      getPayload: () => null,
      getPayloadFn: () => ({
        argument,
        replacementCount,
        insertionCount,
      }),
      replacer: (old, payload) => {
        const payloadFrozenArray: X[0][] = Array.isArray(payload) ? payload : [payload];
        const replacements = old.map(oe => {
          const found = payloadFrozenArray.find(ne => !getProp ? oe === ne : getProp(oe) === getProp(ne));
          if (found !== null && found !== undefined) { replacementCount++; }
          return found || oe;
        });
        const insertions = payloadFrozenArray.filter(ne => !old.some(oe => !getProp ? oe === ne : getProp(oe) === getProp(ne)));
        insertionCount = insertions.length;
        return [
          ...replacements,
          ...insertions
        ];
      },
    });
  }) as ReturnType<UpsertMatching<X, T>['upsertMatching']>['withMany']
  return {
    withOne: fn('One'),
    withMany: fn('Many'),
  };
}) as UpsertMatching<X, T>['upsertMatching'];

export const remove = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X>,
) => (
  argumentOrUpdateOptions?: (() => AnyAsync<any>) | ActionOptions<T>, updateOptionsAsync?: ActionOptions<T>
) => {
    validateSelector(arg);
    const pathSegments = readSelector(arg.selector);
    return processStateUpdateRequest({
      ...arg,
      argument: argumentOrUpdateOptions,
      updateOptions: updateOptionsAsync || argumentOrUpdateOptions,
      actionNameSuffix: `remove()`,
      pathSegments: pathSegments.slice(0, pathSegments.length - 1),
      getPayload: () => null,
      replacer: (old) => {
        const lastSeg: any = pathSegments[pathSegments.length - 1];
        const { [lastSeg]: value, ...otherValues } = old;
        return otherValues;
      },
    });
  }

export const replace = <S, C, X extends C & Array<any>, T extends Trackability>(
  arg: CoreActionsState<S, C, X> & { name: string },
) => (
  argument: C | (() => Promise<C>),
  updateOptions: UpdateOptions<T, any>,
  ) => {
    validateSelector(arg);
    const pathSegments = readSelector(arg.selector);
    return processStateUpdateRequest({
      ...arg,
      updateOptions,
      actionNameSuffix: `${arg.name}()`,
      argument,
      pathSegments: pathSegments.slice(0, pathSegments.length - 1),
      getPayload: (argument) => ({ replacement: argument }),
      replacer: (old, payload) => {
        if (!pathSegments.length) { return payload; }
        const lastSeg = pathSegments[pathSegments.length - 1];
        if (Array.isArray(old)) { return (old as Array<any>).map((o, i) => i === +lastSeg ? payload : o); }
        return ({ ...old, [lastSeg]: payload });
      },
    });
  };

export function invalidateCache<S, C, X extends C & Array<any>>(
  selector: Selector<S, C, X>,
  select: (selector?: (s: DeepReadonly<S>) => C) => any,
) {
  const segs = readSelector(selector);
  const pathSegs = segs.join('.');
  transact(...(Object.keys(select().read().cache || [])).filter(key => key.startsWith(pathSegs))
    .map(key => () => select(s => (s as any).cache[key]).remove()));
}

const validateSelector = <S, C, X extends C & Array<any>>(
  arg: {
    selector: Selector<S, C, X>,
    isComponentStore: () => boolean,
    storeState: StoreState<S>,
  },
) => {
  if (arg.isComponentStore()) { arg.storeState.bypassSelectorFunctionCheck = true; }
  validateSelectorFn('select', arg.storeState, arg.selector);
  if (arg.isComponentStore()) { arg.storeState.bypassSelectorFunctionCheck = false; }
}
