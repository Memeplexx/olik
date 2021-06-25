import { libState, testState } from '../src/shared-state';
import { getSelectedStateFromOperationWithoutUpdatingStore } from '../src/shared-utils';
import { createNestedStore, createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('dry-run', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  beforeEach(() => libState.nestedContainerStore = null);

  it('should perform a successful dry-run with an array element update', () => {
    const initState = { arr: [{ id: 1, val: 'one' }, { id: 2, val: 'two' }], str: '' };
    const store = createGlobalStore(initState);
    const state = getSelectedStateFromOperationWithoutUpdatingStore(store.get, () => store.get(s => s.arr).findWhere(s => s.id).eq(1).patch({ id: 3 }));
    expect(state).toEqual({ id: 1, val: 'one' });
    expect(store.read()).toEqual(initState);
  })

  it('should perform a successful dry-run with an object update', () => {
    const initState = { str: 'abc' };
    const store = createGlobalStore(initState);
    const state = getSelectedStateFromOperationWithoutUpdatingStore(store.get, () => store.get(s => s.str).replace('sdd'));
    expect(state).toEqual('abc');
    expect(store.read()).toEqual(initState);
  })

  it('should work with a nested store', () => {
    const store = createGlobalStore({ str: '' });
    const nested = createNestedStore({ hello: 'xx' }, { componentName: 'test', instanceName: '0' })
    const state = getSelectedStateFromOperationWithoutUpdatingStore(nested.get, () => nested.get(s => s.hello).replace('sdd'));
    expect(state).toEqual('xx');
    expect(store.read()).toEqual({ str: '', nested: { test: { '0': { hello: 'xx' } } } });
  })

  it('should work with a nested store which isn\'t attached', () => {
    const initState = { str: 'abc' };
    const store = createNestedStore(initState, { componentName: 'test', instanceName: '0' });
    const state = getSelectedStateFromOperationWithoutUpdatingStore(store.get, () => store.get(s => s.str).replace('sdd'));
    expect(state).toEqual('abc');
    expect(store.read()).toEqual(initState);
  })

});