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
    expect(get(s => s.array).read()).toEqual([]);
    expect(tests.currentAction).toEqual({
      type: 'array.removeAll()',
    });
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should replaceAll()', () => {
    const get = set(initialState);
    const payload = [{ id: 4, value: 'four' }, { id: 5, value: 'five' }];
    get(s => s.array)
      .replaceAll(payload);
    expect(get(s => s.array).read()).toEqual(payload);
    expect(tests.currentAction).toEqual({
      type: 'array.replaceAll()',
      replacement: payload,
    })
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should reset()', () => {
    const get = set(initialState);
    get(s => s.array)
      .reset();
    expect(get(s => s.array).read()).toEqual(initialState.array);
    expect(tests.currentAction).toEqual({
      type: 'array.reset()',
      replacement: initialState.array,
    })
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

  it('should be able to merge() with some replacements and some insertions', () => {
    const get = set(initialState);
    const payload = [{ id: 2, value: 'twoo' }, { id: 3, value: 'threee' }, { id: 4, value: 'four' }];
    get(s => s.array)
      .merge(payload)
      .match(e => e.id);
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'twoo' }, { id: 3, value: 'threee' }, { id: 4, value: 'four' }]);
    expect(tests.currentAction).toEqual({
      type: 'array.merge().match(id)',
      argument: payload,
      replacementCount: 2,
      insertionCount: 1,
    })
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should upsert() and replace', () => {
    const get = set(initialState);
    const payload = { id: 2, value: 'two updated' };
    get(s => s.array).upsert(payload).match(s => s.id);
    expect(get(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
    expect(tests.currentAction).toEqual({
      type: 'array.upsert().match(id)',
      argument: payload,
      matchFound: true,
    });
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should upsert() and insert', () => {
    const get = set(initialState);
    const payload = { id: 4, value: 'four inserted' };
    get(s => s.array).upsert(payload).match(s => s.id);
    expect(get(s => s.array).read()).toEqual([...initialState.array, payload]);
    expect(tests.currentAction).toEqual({
      type: 'array.upsert().match(id)',
      matchFound: false,
      argument: payload,
    })
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