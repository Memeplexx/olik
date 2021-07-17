import { testState } from '../src/shared-state';
import { createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filter().remove()', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq()', () => {
    const select = createGlobalStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).eq(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[1]],
      where: 'id === 2',
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should ne()', () => {
    const select = createGlobalStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).ne(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[0], initialState.array[2]],
      where: 'id !== 2',
    });
    expect(select().read().array).toEqual([initialState.array[1]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should gt()', () => {
    const select = createGlobalStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).gt(1)
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[1], initialState.array[2]],
      where: 'id > 1',
    });
    expect(select().read().array).toEqual([initialState.array[0]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should gte()', () => {
    const select = createGlobalStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).gte(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[1], initialState.array[2]],
      where: 'id >= 2',
    });
    expect(select().read().array).toEqual([initialState.array[0]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should lt()', () => {
    const select = createGlobalStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).lt(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[0]],
      where: 'id < 2',
    });
    expect(select().read().array).toEqual([initialState.array[1], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should lte()', () => {
    const select = createGlobalStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).lte(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[0], initialState.array[1]],
      where: 'id <= 2',
    });
    expect(select().read().array).toEqual([initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should in()', () => {
    const select = createGlobalStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).in([1, 2])
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[0], initialState.array[1]],
      where: '[1, 2].includes(id)',
    });
    expect(select().read().array).toEqual([initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should ni()', () => {
    const select = createGlobalStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).ni([1, 2])
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[2]],
      where: '![1, 2].includes(id)',
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should match()', () => {
    const select = createGlobalStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.value).matches(/^t/)
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[1], initialState.array[2]],
      where: 'value.match(/^t/)',
    });
    expect(select().read().array).toEqual([initialState.array[0]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

});