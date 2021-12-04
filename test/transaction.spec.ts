
import { errorMessages } from '../src/constants';
import { createApplicationStore, derive, libState, testState, transact } from '../src/index';

describe('transaction', () => {

  beforeEach(() => {
    libState.appStates = {};
    testState.logLevel = 'none';
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

