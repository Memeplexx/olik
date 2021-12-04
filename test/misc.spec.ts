import { createApplicationStore } from '../src';
import { libState } from '../src/constant';

describe('misc', () => {

  beforeEach(() => {
    libState.appStates = {};
    libState.logLevel = 'none';
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

});

