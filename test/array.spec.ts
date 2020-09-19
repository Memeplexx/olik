import { make } from '../src/core';
import { tests } from '../src/tests';

describe('Array', () => {

  it('should addAfter()', () => {
    const initialState = {
      array: [{ id: 1, value: 'one' }],
      object: { property: '' },
    };
    const getStore = make('state', initialState);
    const payload = [{ id: 2, value: 'two' }, { id: 3, value: 'three' }];
    getStore(s => s.array).addAfter(payload);
    expect(getStore().read().array).toEqual([...initialState.array, ...payload]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.addAfter()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(getStore().read());
  })

  it('should addBefore()', () => {
    const initialState = {
      array: [{ id: 3, value: 'three' }],
      object: { property: '' },
    };
    const getStore = make('state', initialState);
    const payload = [{ id: 1, value: 'one' }, { id: 2, value: 'two' }];
    getStore(s => s.array).addBefore(payload);
    expect(getStore().read().array).toEqual([...payload, ...initialState.array]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.addBefore()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(getStore().read());
  })

  it('should patchWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    const payload = { value: 'test' };
    getStore(s => s.array).patchWhere(e => e.value.startsWith('t')).with(payload);
    expect(getStore().read().array).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'test' }, { id: 3, value: 'test' }]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.1,2.patchWhere()');
    expect(tests.currentAction.payload.patch).toEqual(payload);
    expect(tests.currentMutableState).toEqual(getStore().read());
  })

  it('should removeWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    getStore(s => s.array).removeWhere(a => a.id === 2);
    expect(getStore().read().array).toEqual([{ id: 1, value: 'one' }, { id: 3, value: 'three' }]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.1.removeWhere()');
    expect(tests.currentAction.payload.toRemove).toEqual([{ id: 2, value: 'two' }]);
    expect(tests.currentMutableState).toEqual(getStore().read());
  })

  it('should replaceWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    const payload = { id: 5, value: 'hey' };
    getStore(s => s.array).replaceWhere(a => a.id === 2).with(payload);
    expect(getStore().read().array).toEqual([{ id: 1, value: 'one' }, payload, { id: 3, value: 'three' }]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.1.replaceWhere()');
    expect(tests.currentAction.payload.replacement).toEqual(payload);
    expect(tests.currentMutableState).toEqual(getStore().read());
  })

  it('should upsertWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    const payload = { id: 1, value: 'one updated' };
    getStore(s => s.array).upsertWhere(e => e.id === 1).with(payload);
    expect(getStore().read().array).toEqual([payload, { id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    expect(tests.currentAction.type).toEqual('array.0.replaceWhere()');
    expect(tests.currentAction.payload.replacement).toEqual(payload);
    expect(tests.currentMutableState).toEqual(getStore().read());
    const payload2 = { id: 4, value: 'four inserted' };
    getStore(s => s.array).upsertWhere(e => e.id === 4).with(payload2);
    expect(getStore().read().array).toEqual([payload, { id: 2, value: 'two' }, { id: 3, value: 'three' }, payload2]);
    expect(tests.currentAction.type).toEqual('array.addAfter()');
    expect(tests.currentMutableState).toEqual(getStore().read());
  })

  it('should removeAll()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }]
    };
    const getStore = make('state', initialState);
    getStore(s => s.array).removeAll();
    expect(getStore().read().array).toEqual([]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.removeAll()');
    expect(tests.currentMutableState).toEqual(getStore().read());
  })

  it('should removeFirst()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    getStore(s => s.array).removeFirst();
    expect(getStore().read().array).toEqual([{ id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.removeFirst()');
    expect(tests.currentMutableState).toEqual(getStore().read());
  })

  it('should removeLast()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    getStore(s => s.array).removeLast();
    expect(getStore().read().array).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.removeLast()');
    expect(tests.currentMutableState).toEqual(getStore().read());
  })

  it('should replaceAll()', () => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { property: '' },
    };
    const getStore = make('state', initialState);
    const payload = [{ id: 4, value: 'four' }, { id: 5, value: 'five' }];
    getStore(s => s.array).replaceAll(payload);
    expect(getStore().read().array).toEqual([{ id: 4, value: 'four' }, { id: 5, value: 'five' }]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.replaceAll()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(getStore().read());
  })

  it('should be able to find() an array element and replace one of its properties', () => {
    const getStore = make('store', {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { hello: 'world' },
    });
    getStore(s => s.array.find(e => e.id === 2)!.value).replaceWith('twoo');
    expect(getStore().read().array).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'twoo' }, { id: 3, value: 'three' }]);
  })

  it('should be able to find() an array element and patch one of its properties', () => {
    const getStore = make('store', {
      array: [{ id: 1, value: { a: 'one', b: 'one' } }, { id: 2, value: { a: 'two', b: 'two' } }, { id: 3, value: { a: 'three', b: 'three' } }],
      object: { hello: 'world' },
    });
    getStore(s => s.array.find(e => e.id === 2)!.value).patchWith({ b: 'twoo' });
    expect(getStore().read().array).toEqual([{ id: 1, value: { a: 'one', b: 'one' } }, { id: 2, value: { a: 'two', b: 'twoo' } }, { id: 3, value: { a: 'three', b: 'three' } }]);
  })

});
