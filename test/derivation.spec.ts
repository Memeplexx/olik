import { createApplicationStore, derive, libState, testState } from '../src';


describe('derivation', () => {

  beforeEach(() => {
    libState.appStates = {};
    testState.logLevel = 'none';
  })

  it('should support derivations', () => {
    const select = createApplicationStore({ num: 0, str: '', bool: false });
    const derivation = derive(
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

