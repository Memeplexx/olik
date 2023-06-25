import { createStore } from '../src/core';
import { resetLibraryState } from '../src/utility';

describe('read', () => {

  beforeEach(() => {
    resetLibraryState();
  })

  it('should read deep array element properties', () => {
    const state = { arr: [{ id: 1, val: 0, obj: { num: 1 } }, { id: 2, val: 0, obj: { num: 2 } }] };
    const store = createStore({ state });
    expect(store.arr.obj.num.$state).toEqual([1, 2]);
  })

});