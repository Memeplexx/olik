import { set } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.find().remove()', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq()', () => {
    const get = set(initialState);
    get(s => s.array)
      .find(e => e.id).eq(2)
      .remove();
    expect(tests.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[1],
      query: 'id === 2',
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[0], initialState.array[2]]);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should ne()', () => {
    const get = set(initialState);
    get(s => s.array)
      .find(e => e.id).ne(2)
      .remove();
    expect(tests.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[0],
      query: 'id !== 2',
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[1], initialState.array[2]]);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should gt()', () => {
    const get = set(initialState);
    get(s => s.array)
      .find(e => e.id).gt(1)
      .remove();
    expect(tests.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[1],
      query: 'id > 1',
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[0], initialState.array[2]]);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should lt()', () => {
    const get = set(initialState);
    get(s => s.array)
      .find(e => e.id).lt(2)
      .remove();
    expect(tests.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[0],
      query: 'id < 2',
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[1], initialState.array[2]]);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should in()', () => {
    const get = set(initialState);
    get(s => s.array)
      .find(e => e.id).in([1, 2])
      .remove();
    expect(tests.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[0],
      query: '[1, 2].includes(id)',
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[1], initialState.array[2]]);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should ni()', () => {
    const get = set(initialState);
    get(s => s.array)
      .find(e => e.id).ni([1, 2])
      .remove();
    expect(tests.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[2],
      query: '![1, 2].includes(id)',
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[0], initialState.array[1]]);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should match()', () => {
    const get = set(initialState);
    get(s => s.array)
      .find(e => e.value).match(/^t/)
      .remove();
    expect(tests.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[1],
      query: 'value.match(/^t/)',
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[0], initialState.array[2]]);
    expect(tests.currentMutableState).toEqual(get().read());
  })

});