import { comparators, libState, updateFunctions } from './constant';
import { StateAction } from './type';
import { StoreInternal } from './type-internal';

export const setCurrentActionReturningNewState = (
  { newState, payload, stateActions }:
    { stateActions: ReadonlyArray<StateAction>, payload: unknown, newState: unknown }
): unknown => {
  const type = stateActions.map(sa => fixCurrentAction(sa)).join('.');
  const action = { type, ...(payload !== undefined ? { payload } : {}) };
  libState.currentAction = action;
  return newState;
}

const regexp = new RegExp([...comparators, ...updateFunctions].map(c => `^\\${c}$`).join('|'), 'g');
const fixCurrentAction = (action: { name: string, arg?: unknown }): string => {
  return action.name.replace(regexp, match => {
    if (updateFunctions.includes(match)) {
      return `${match}()`;
    }
    if (action.arg === undefined) {
      return `${match}()`;
    }
    const stateActions = (action.arg as StoreInternal).$stateActions;
    if (stateActions === undefined) {
      return `${match}(${JSON.stringify(action.arg)})`;
    }
    return `${match}( ${stateActions.map(sa => fixCurrentAction(sa)).join('.')} = ${JSON.stringify((action.arg as StoreInternal).$state)} )`;
  });
}