import { testState } from '../src/constant';
import { createStore } from '../src/core';

describe('read', () => {

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should read deep array element properties', () => {
    const state = { arr: [{ id: 1, val: 0, obj: { num: 1 } }, { id: 2, val: 0, obj: { num: 2 } }] };
    const store = createStore({ state });
    expect(store.arr.obj.num.$state).toEqual([1, 2]);
  })

});