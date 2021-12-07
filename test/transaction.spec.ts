import { createApplicationStore, transact } from '../src';
import { errorMessages, libState } from '../src/constant';

describe('transaction', () => {

  beforeEach(() => {
    libState.appStates = {};
    libState.logLevel = 'none';
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
        { type: 'num.replace()', payload: 1 },
        { type: 'str.replace()', payload: 'x' },
      ]
    })
  })

  it('should support transactions with only 1 action', () => {
    const select = createApplicationStore({ num: 0 });
    const payload = 1;
    transact(() => select.num.replace(payload));
    expect(select.num.read()).toEqual(payload);
    expect(libState.currentAction).toEqual({ type: 'num.replace()', payload });
  })

  it('should not support transactions if one of the actions has an async payload', () => {
    const select = createApplicationStore({ num: 0, str: '', bool: false });
    expect(() => transact(
      () => select.num.replace(() => new Promise(resolve => resolve(1))),
      () => select.str.replace('x'),
    )).toThrow(errorMessages.ASYNC_PAYLOAD_INSIDE_TRANSACTION);
  })

});

