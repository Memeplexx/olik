import { errorMessages } from '../src/constant';
import { createStore } from '../src/core';
import { resetLibraryState } from '../src/utility';

describe('misc', () => {

  beforeEach(() => {
    resetLibraryState();
  })

  it('should work with half-finished writes intermixed with reads', () => {
    const state = { num: 0, str: '', bool: false };
    const store = createStore({ state });
    const changeNum = store.num;
    const changeBool = store.bool;
    store.str.$set('x');
    changeNum.$add(1);
    changeBool.$set(true);
    expect(store.$state).toEqual({ num: 1, str: 'x', bool: true });
  })

  it('should not allow sets or maps', () => {
    const state = { set: new Set() };
    expect(() => createStore({ state })).toThrow(errorMessages.INVALID_STATE_INPUT(new Set().toString()));
  })

  it('should throw an error if a user uses a dollar prop in their state', () => {
    expect(() => createStore({ state: { $hello: 'world' } })).toThrow(errorMessages.DOLLAR_USED_IN_STATE);
  })

  // it('', () => {
  //   const store = createStore({ state: { arr: [{ id: 1, text: 'one' }] } });
  //   let s: any = store.arr;
  //   s = s.$find.id;
  //   s.$state;
  //   s = s.$eq(1);
  //   s = s.text;
  // })

});

