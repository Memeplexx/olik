import { make } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Array', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should addAfter()', () => {
    const initialState = {
      array: [{ id: 1, value: 'one' }],
      object: { property: '' },
    };
    const store = make('store', initialState);
    const payload = [{ id: 2, value: 'two' }, { id: 3, value: 'three' }];
    store(s => s.array).addAfter(payload);
    expect(store().read().array).toEqual([...initialState.array, ...payload]);
    expect(store().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.addAfter()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should addBefore()', () => {
    const initialState = {
      array: [{ id: 3, value: 'three' }],
      object: { property: '' },
    };
    const store = make('store', initialState);
    const payload = [{ id: 1, value: 'one' }, { id: 2, value: 'two' }];
    store(s => s.array).addBefore(payload);
    expect(store().read().array).toEqual([...payload, ...initialState.array]);
    expect(store().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.addBefore()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should patchWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = make('store', initialState);
    const payload = { value: 'test' };
    store(s => s.array).patchWhere(e => e.value.startsWith('t')).with(payload);
    expect(store().read().array).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'test' }, { id: 3, value: 'test' }]);
    expect(store().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.1,2.patchWhere()');
    expect(tests.currentAction.payload.patch).toEqual(payload);
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should removeWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = make('store', initialState);
    store(s => s.array).removeWhere(a => a.id === 2);
    expect(store().read().array).toEqual([{ id: 1, value: 'one' }, { id: 3, value: 'three' }]);
    expect(store().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.1.removeWhere()');
    expect(tests.currentAction.payload.toRemove).toEqual([{ id: 2, value: 'two' }]);
    expect(tests.currentMutableState).toEqual(store().read());
    expect(initialState.array === store(s => s.array).read()).toBeFalsy();
  })

  it('should replaceWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = make('store', initialState);
    const payload = { id: 5, value: 'hey' };
    store(s => s.array).replaceWhere(a => a.id === 2).with(payload);
    expect(store().read().array).toEqual([{ id: 1, value: 'one' }, payload, { id: 3, value: 'three' }]);
    expect(store().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.1.replaceWhere()');
    expect(tests.currentAction.payload.replacement).toEqual(payload);
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should upsertWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = make('store', initialState);
    const payload = { id: 1, value: 'one updated' };
    store(s => s.array).upsertWhere(e => e.id === 1).with(payload);
    expect(store().read().array).toEqual([payload, { id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    expect(tests.currentAction.type).toEqual('array.0.replaceWhere()');
    expect(tests.currentAction.payload.replacement).toEqual(payload);
    expect(tests.currentMutableState).toEqual(store().read());
    const payload2 = { id: 4, value: 'four inserted' };
    store(s => s.array).upsertWhere(e => e.id === 4).with(payload2);
    expect(store().read().array).toEqual([payload, { id: 2, value: 'two' }, { id: 3, value: 'three' }, payload2]);
    expect(tests.currentAction.type).toEqual('array.addAfter()');
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should removeAll()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }]
    };
    const store = make('store', initialState);
    store(s => s.array).removeAll();
    expect(store().read().array).toEqual([]);
    expect(store().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.removeAll()');
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should removeFirst()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = make('store', initialState);
    store(s => s.array).removeFirst();
    expect(store().read().array).toEqual([{ id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    expect(store().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.removeFirst()');
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should removeLast()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = make('store', initialState);
    store(s => s.array).removeLast();
    expect(store().read().array).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }]);
    expect(store().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.removeLast()');
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should replaceAll()', () => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { property: '' },
    };
    const store = make('store', initialState);
    const payload = [{ id: 4, value: 'four' }, { id: 5, value: 'five' }];
    store(s => s.array).replaceAll(payload);
    expect(store().read().array).toEqual([{ id: 4, value: 'four' }, { id: 5, value: 'five' }]);
    expect(store().read().object === initialState.object).toBeTruthy();
    expect(tests.currentAction.type).toEqual('array.replaceAll()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should be able to find() an array element and replace one of its properties', () => {
    const store = make('store', {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { hello: 'world' },
    });
    store(s => s.array.find(e => e.id === 2)!.value).replaceWith('twoo');
    expect(tests.currentAction.type).toEqual('array.1.value.replaceWith()');
    expect(store().read().array).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'twoo' }, { id: 3, value: 'three' }]);
  })

  it('should be able to find() an array element and patch one of its properties', () => {
    const store = make('store', {
      array: [{ id: 1, value: { a: 'one', b: 'one' } }, { id: 2, value: { a: 'two', b: 'two' } }, { id: 3, value: { a: 'three', b: 'three' } }],
      object: { hello: 'world' },
    });
    store(s => s.array.find(e => e.id === 2)!.value).patchWith({ b: 'twoo' });
    expect(tests.currentAction.type).toEqual('array.1.value.patchWith()');
    expect(store().read().array).toEqual([{ id: 1, value: { a: 'one', b: 'one' } }, { id: 2, value: { a: 'two', b: 'twoo' } }, { id: 3, value: { a: 'three', b: 'three' } }]);
  })

});
