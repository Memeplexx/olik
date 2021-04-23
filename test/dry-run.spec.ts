import { testState } from '../src/shared-state';
import { getSelectedStateFromOperationWithoutUpdatingStore } from '../src/shared-utils';
import { store } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('dry-run', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should perform a successful dry-run with an array element update', () => {
    const initState = { arr: [{ id: 1, val: 'one' }, { id: 2, val: 'two' }] , str: ''};
    const select = store(initState);
    const state = getSelectedStateFromOperationWithoutUpdatingStore(select, () => select(s => s.arr).findWhere(s => s.id).eq(1).patch({ id: 3 }));
    expect(state).toEqual({ id: 1, val: 'one' });
    expect(select().read()).toEqual(initState);
  })

  it('should perform a successful dry-run with an object update', () => {
    const initState = { str: ''};
    const select = store(initState);
    const state = getSelectedStateFromOperationWithoutUpdatingStore(select, () => select(s => s.str).replace('sdd'));
    expect(state).toEqual('');
    expect(select().read()).toEqual(initState);
  })

});