import { comparators, libState, updateFunctions } from './constant';
import { OlikAction, StateAction } from './type';
import { StoreInternal } from './type-internal';

export const setCurrentActionReturningNewState = (
  { newState, payload, stateActions }:
    { stateActions: ReadonlyArray<StateAction>, payload: unknown, newState: unknown }
): unknown => {
  const type = stateActions.map(sa => fixCurrentAction(sa, true)).join('.');
  const typeOrig = stateActions.map(sa => fixCurrentAction(sa, false)).join('.');
  const action: OlikAction = { type, ...(payload !== undefined ? { payload } : {}) };
  if (type !== typeOrig) {
    action.typeOrig = typeOrig;
  }
  libState.currentAction = action;
  return newState;
}

const regexp = new RegExp([...comparators, ...updateFunctions].map(c => `^\\${c}$`).join('|'), 'g');
const fixCurrentAction = (action: { name: string, arg?: unknown }, nested: boolean): string => {
  return action.name.replace(regexp, match => {
    if (updateFunctions.includes(match)) {
      return `${match}()`;
    }
    if (action.arg === undefined) {
      return `${match}()`;
    }
    const stateActions = (action.arg as StoreInternal).$stateActions;
    if (!nested && stateActions !== undefined) {
      return `${match}(${JSON.stringify((action.arg as StoreInternal).$state)})`;
    }
    if (stateActions === undefined) {
      return `${match}(${JSON.stringify(action.arg)})`;
    }
    return `${match}( ${stateActions.map(sa => fixCurrentAction(sa, nested)).join('.')} = ${JSON.stringify((action.arg as StoreInternal).$state)} )`;
  });
}