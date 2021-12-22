import { createStore, transact } from '../src';
import { errorMessages, libState, testState } from '../src/constant';

describe('transaction', () => {

  const name = 'AppStore';

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should support transactions', () => {
    const state = { num: 0, str: '', bool: false };
    const select = createStore({ name, state });
    transact(
      () => select.num.replace(1),
      () => select.str.replace('x'),
    );
    expect(select.state).toEqual({ num: 1, str: 'x', bool: false });
    expect(libState.currentAction).toEqual({
      type: 'num.replace(), str.replace()',
      actions: [
        { type: 'num.replace()', payload: 1 },
        { type: 'str.replace()', payload: 'x' },
      ]
    })
  })

  it('should support transactions with only 1 action', () => {
    const state = { num: 0 };
    const select = createStore({ name, state });
    const payload = 1;
    transact(() => select.num.replace(payload));
    expect(select.num.state).toEqual(payload);
    expect(libState.currentAction).toEqual({ type: 'num.replace()', payload });
  })

  it('should not support transactions if one of the actions has an async payload', () => {
    const state = { num: 0, str: '', bool: false };
    const select = createStore({ name, state });
    expect(() => transact(
      () => select.num.replace(() => new Promise(resolve => resolve(1))),
      () => select.str.replace('x'),
    )).toThrow(errorMessages.ASYNC_PAYLOAD_INSIDE_TRANSACTION);
  })

});

