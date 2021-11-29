
import { createApplicationStore, deriveFrom, libState, testState } from '../src/index';

describe('edge-case', () => {

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

  it('should support derivations', () => {
    const select = createApplicationStore({ num: 0, str: '', bool: false });
    const derivation = deriveFrom(
      select.num,
      select.str,
    ).with((num, str) => [num, str]);
    expect(derivation.read()).toEqual([0, '']);
    let changeCount = 0;
    derivation.onChange(() => changeCount++);
    select.bool.replace(true);
    expect(changeCount).toEqual(0);
    select.num.increment(1);
    expect(changeCount).toEqual(1);
    expect(derivation.read()).toEqual([1, '']);
  })


});

