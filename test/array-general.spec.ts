import { set } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Array General', () => {

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
      payload: {
        replacement: payload,
      }
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
      payload: {
        replacement: initialState.array
      }
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
      payload: {
        insertion: payload,
      },
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
      payload: {
        insertion: payload,
      },
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
      payload: {
        argument: payload,
        replacementCount: 2,
        insertionCount: 1,
      }
    })
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should upsert() and replace()', () => {
    const get = set(initialState);
    const payload = { id: 2, value: 'two updated' };
    get(s => s.array).upsert(payload).match(s => s.id);
    expect(get(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
    expect(tests.currentAction).toEqual({
      type: 'array.upsert().match(id)',
      payload: {
        argument: payload,
        matchFound: true,
      },
    });
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should upsert() and insert()', () => {
    const get = set(initialState);
    const payload = { id: 4, value: 'four inserted' };
    get(s => s.array).upsert(payload).match(s => s.id);
    expect(get(s => s.array).read()).toEqual([...initialState.array, payload ]);
    expect(tests.currentAction).toEqual({
      type: 'array.upsert().match(id)',
      payload: {
        matchFound: false,
        argument: payload,
      },
    })
    expect(tests.currentMutableState).toEqual(get().read());
  });

});