import { errorMessages, testState } from '../src/constant';
import { createStore } from '../src/core';
import { transact } from '../src/transact';
import { currentAction } from './_utility';
import { enableAsyncActionPayloads } from '../src/write-async';

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
    expect(currentAction(select)).toEqual({
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
    expect(currentAction(select)).toEqual({ type: 'num.replace()', payload });
  })

  it('should not support transactions if one of the actions has an async payload', () => {
    const state = { num: 0, str: '', bool: false };
    const select = createStore({ name, state });
    enableAsyncActionPayloads();
    expect(() => transact(
      () => select.num.replace(() => new Promise(resolve => resolve(1))),
      () => select.str.replace('x'),
    )).toThrow(errorMessages.ASYNC_PAYLOAD_INSIDE_TRANSACTION);
  })

  it('should not throw errors is transactions traverse multiple stores', () => {
    const select1 = createStore({ name: 'a', state: { num: 0 } });
    const select2 = createStore({ name: 'b', state: { str: '' } });
    transact(
      () => select1.num.increment(1),
      () => select2.str.replace('x'),
    );
    expect(currentAction(select1)).toEqual({
      type: 'num.increment()',
      actions: [ { type: 'num.increment()', payload: 1 } ]
    })
    expect(currentAction(select2)).toEqual({
      type: 'str.replace()',
      actions: [ { type: 'str.replace()', payload: 'x' } ]
    })
    select1.num.increment(1);
    expect(currentAction(select1)).toEqual({ type: 'num.increment()', payload: 1 });
    select2.str.replace('y');
    expect(currentAction(select2)).toEqual({ type: 'str.replace()', payload: 'y' });
  })

});

