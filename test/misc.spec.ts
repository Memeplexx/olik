import { createApplicationStore } from '../src';
import { libState, testState, errorMessages } from '../src/constant';
import { Store } from '../src/type';

describe('misc', () => {

  beforeEach(() => {
    libState.appStates = {};
    testState.logLevel = 'none';
  })

  it('should work with half-finished writes intermixed with reads', () => {
    const select = createApplicationStore({ num: 0, str: '', bool: false });
    const changeNum = select.num;
    const changeBool = select.bool;
    select.str.replace('x');
    changeNum.increment(1);
    changeBool.replace(true);
    expect(select.read()).toEqual({ num: 1, str: 'x', bool: true });
  })

  it('should not allow sets or maps', () => {
    expect(() => createApplicationStore({ set: new Set() }) as any).toThrow(errorMessages.INVALID_STATE_INPUT(new Set().toString()));
  })

});

