
import { errorMessages } from '../src/constants';
import { createApplicationStore, derive, libState, testState, transact } from '../src/index';

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

  it('should support transactions', () => {
    const select = createApplicationStore({ num: 0, str: '', bool: false });
    transact(
      () => select.num.replace(1),
      () => select.str.replace('x'),
    );
    expect(select.read()).toEqual({ num: 1, str: 'x', bool: false });
    expect(libState.currentAction).toEqual({
      type: 'num.replace(), str.replace()',
      actions: [
        { type: 'num.replace()', replacement: 1 },
        { type: 'str.replace()', replacement: 'x' },
      ]
    })
  })

  it('should support transactions with only 1 action', () => {
    const select = createApplicationStore({ num: 0 });
    const replacement = 1;
    transact(() => select.num.replace(replacement));
    expect(select.num.read()).toEqual(replacement);
    expect(libState.currentAction).toEqual({ type: 'num.replace()', replacement });
  })

  it('should not support transactions if one of the actions has an async payload', () => {
    const select = createApplicationStore({ num: 0, str: '', bool: false });
    expect(() => transact(
      () => select.num.replace(() => new Promise(resolve => resolve(1))),
      () => select.str.replace('x'),
    )).toThrow(errorMessages.ASYNC_PAYLOAD_INSIDE_TRANSACTION);
  })

});

