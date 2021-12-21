import { createStore } from '../src';
import { errorMessages, testState } from '../src/constant';

describe('misc', () => {

  const name = 'AppStore';

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should work with half-finished writes intermixed with reads', () => {
    const state = { num: 0, str: '', bool: false };
    const select = createStore({ name, state });
    const changeNum = select.num;
    const changeBool = select.bool;
    select.str.replace('x');
    changeNum.increment(1);
    changeBool.replace(true);
    expect(select.read()).toEqual({ num: 1, str: 'x', bool: true });
  })

  it('should not allow sets or maps', () => {
    const state = { set: new Set() };
    expect(() => createStore({name, state})).toThrow(errorMessages.INVALID_STATE_INPUT(new Set().toString()));
  })

});

