import { errorMessages } from '../src/constant';
import { createStore } from '../src/core';
import { transact } from '../src/transact';
import { currentAction } from './_utility';
import { importOlikAsyncModule } from '../src/write-async';
import { resetLibraryState } from '../src/utility';

describe('transaction', () => {

  beforeEach(() => {
    resetLibraryState();
  })

  it('should support transactions', () => {
    const state = { num: 0, str: '', bool: false };
    const store = createStore({ state });
    transact(
      () => store.num.$set(1),
      () => store.str.$set('x'),
    );
    expect(store.$state).toEqual({ num: 1, str: 'x', bool: false });
    expect(currentAction(store)).toEqual({
      type: 'num.set(), str.set()',
      payload: [
        { type: 'num.set()', payload: 1 },
        { type: 'str.set()', payload: 'x' },
      ]
    })
  })

  it('should support transactions with only 1 action', () => {
    const state = { num: 0 };
    const store = createStore({ state });
    const payload = 1;
    transact(() => store.num.$set(payload));
    expect(store.num.$state).toEqual(payload);
    expect(currentAction(store)).toEqual({ type: 'num.set()', payload });
  })

  it('should not support transactions if one of the actions has an async payload', () => {
    const state = { num: 0, str: '', bool: false };
    const store = createStore({ state });
    importOlikAsyncModule();
    expect(() => transact(
      () => store.num.$set(() => new Promise(resolve => resolve(1))),
      () => store.str.$set('x'),
    )).toThrow(errorMessages.ASYNC_PAYLOAD_INSIDE_TRANSACTION);
  })

  // it('should not throw errors is transactions traverse multiple stores', () => {
  //   const store1 = createStore({ name: 'a', state: { num: 0 } });
  //   const store2 = createStore({ name: 'b', state: { str: '' } });
  //   transact(
  //     () => store1.num.$add(1),
  //     () => store2.str.$replace('x'),
  //   );
  //   expect(currentAction(store1)).toEqual({
  //     type: 'num.add()',
  //     actions: [ { type: 'num.add()', payload: 1 } ]
  //   })
  //   expect(currentAction(store2)).toEqual({
  //     type: 'str.replace()',
  //     actions: [ { type: 'str.replace()', payload: 'x' } ]
  //   })
  //   store1.num.$add(1);
  //   expect(currentAction(store1)).toEqual({ type: 'num.add()', payload: 1 });
  //   store2.str.$replace('y');
  //   expect(currentAction(store2)).toEqual({ type: 'str.replace()', payload: 'y' });
  // })

});

