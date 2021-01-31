import { set } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    object: { property: '' },
  };

  it('should removeAll()', () => {
    const get = set(initialState);
    get(s => s.array)
      .removeAll();
    expect(tests.currentAction).toEqual({
      type: 'array.removeAll()',
    });
    expect(get(s => s.array).read()).toEqual([]);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should replaceAll()', () => {
    const get = set(initialState);
    const payload = [{ id: 4, value: 'four' }, { id: 5, value: 'five' }];
    get(s => s.array)
      .replaceAll(payload);
    expect(tests.currentAction).toEqual({
      type: 'array.replaceAll()',
      replacement: payload,
    });
    expect(get(s => s.array).read()).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should reset()', () => {
    const get = set(initialState);
    get(s => s.array)
      .reset();
    expect(tests.currentAction).toEqual({
      type: 'array.reset()',
      replacement: initialState.array,
    });
    expect(get(s => s.array).read()).toEqual(initialState.array);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should insert() one', () => {
    const get = set(initialState);
    const payload = { id: 4, value: 'four' };
    get(s => s.array)
      .insert(payload);
    expect(tests.currentAction).toEqual({
      type: 'array.insert()',
      insertion: payload,
    });
    expect(get(s => s.array).read()).toEqual([...initialState.array, payload]);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should insert() many', () => {
    const get = set(initialState);
    const payload = [{ id: 4, value: 'four' }, { id: 5, value: 'five' }];
    get(s => s.array)
      .insert(payload);
    expect(tests.currentAction).toEqual({
      type: 'array.insert()',
      insertion: payload,
    });
    expect(get(s => s.array).read()).toEqual([...initialState.array, ...payload]);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should be able to replaceElseInsert() with multiple elements, replacing and inserting', () => {
    const get = set(initialState);
    const payload = [{ id: 2, value: 'twoo' }, { id: 3, value: 'threee' }, { id: 4, value: 'four' }];
    get(s => s.array)
      .match(e => e.id)
      .replaceElseInsert(payload);
    expect(tests.currentAction).toEqual({
      type: 'array.match(id).replaceElseInsert()',
      argument: payload,
      replacementCount: 2,
      insertionCount: 1,
    });
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'twoo' }, { id: 3, value: 'threee' }, { id: 4, value: 'four' }]);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should replaceElseInsert() with one element replacing', () => {
    const get = set(initialState);
    const payload = { id: 2, value: 'two updated' };
    get(s => s.array)
      .match(s => s.id)
      .replaceElseInsert(payload);
    expect(tests.currentAction).toEqual({
      type: 'array.match(id).replaceElseInsert()',
      argument: payload,
      insertionCount: 0,
      replacementCount: 1,
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should replaceElseInsert() with one element inserting', () => {
    const get = set(initialState);
    const payload = { id: 4, value: 'four inserted' };
    get(s => s.array)
      .match(s => s.id)
      .replaceElseInsert(payload);
    expect(tests.currentAction).toEqual({
      type: 'array.match(id).replaceElseInsert()',
      argument: payload,
      insertionCount: 1,
      replacementCount: 0,
    });
    expect(get(s => s.array).read()).toEqual([...initialState.array, payload]);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to find() an array element and replace one of its properties', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { hello: 'world' },
    });
    const payload = 'twoo';
    get(s => s.array.find(e => e.id === 2)!.value).replace(payload);
    expect(tests.currentAction).toEqual({
      type: 'array.1.value.replace()',
      replacement: payload,
    })
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'twoo' }, { id: 3, value: 'three' }]);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to find() an array element and patch one of its properties', () => {
    const get = set({
      array: [{ id: 1, value: { a: 'one', b: 'one' } }, { id: 2, value: { a: 'two', b: 'two' } }, { id: 3, value: { a: 'three', b: 'three' } }],
      object: { hello: 'world' },
    });
    const payload = { b: 'twoo' }
    get(s => s.array.find(e => e.id === 2)!.value).patch(payload);
    expect(tests.currentAction).toEqual({
      type: 'array.1.value.patch()',
      patch: payload,
    });
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: { a: 'one', b: 'one' } }, { id: 2, value: { a: 'two', b: 'twoo' } }, { id: 3, value: { a: 'three', b: 'three' } }]);
    expect(tests.currentMutableState).toEqual(get().read());
  });

});