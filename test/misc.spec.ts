import { errorMessages, testState } from '../src/constant';
import { createStore } from '../src/core';

describe('misc', () => {

  const name = 'AppStore';

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should work with half-finished writes intermixed with reads', () => {
    const state = { num: 0, str: '', bool: false };
    const store = createStore({ name, state });
    const changeNum = store.num;
    const changeBool = store.bool;
    store.str.$replace('x');
    changeNum.$add(1);
    changeBool.$replace(true);
    expect(store.$state).toEqual({ num: 1, str: 'x', bool: true });
  })

  it('should not allow sets or maps', () => {
    const state = { set: new Set() };
    expect(() => createStore({name, state})).toThrow(errorMessages.INVALID_STATE_INPUT(new Set().toString()));
  })

});

