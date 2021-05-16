import { testState } from '../src/shared-state';
import { createAppStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filter().remove()', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq()', () => {
    const { select, read } = createAppStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).isEq(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[1]],
      where: 'id === 2',
    });
    expect(read().array).toEqual([initialState.array[0], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should ne()', () => {
    const { select, read } = createAppStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).isNotEq(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[0], initialState.array[2]],
      where: 'id !== 2',
    });
    expect(read().array).toEqual([initialState.array[1]]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should gt()', () => {
    const { select, read } = createAppStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).isMoreThan(1)
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[1], initialState.array[2]],
      where: 'id > 1',
    });
    expect(read().array).toEqual([initialState.array[0]]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should gte()', () => {
    const { select, read } = createAppStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).isMoreThanOrEq(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[1], initialState.array[2]],
      where: 'id >= 2',
    });
    expect(read().array).toEqual([initialState.array[0]]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should lt()', () => {
    const { select, read } = createAppStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).isLessThan(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[0]],
      where: 'id < 2',
    });
    expect(read().array).toEqual([initialState.array[1], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should lte()', () => {
    const { select, read } = createAppStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).isLessThanOrEq(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[0], initialState.array[1]],
      where: 'id <= 2',
    });
    expect(read().array).toEqual([initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should in()', () => {
    const { select, read } = createAppStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).isIn([1, 2])
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[0], initialState.array[1]],
      where: '[1, 2].includes(id)',
    });
    expect(read().array).toEqual([initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should ni()', () => {
    const { select, read } = createAppStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).isNotIn([1, 2])
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[2]],
      where: '![1, 2].includes(id)',
    });
    expect(read().array).toEqual([initialState.array[0], initialState.array[1]]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should match()', () => {
    const { select, read } = createAppStore(initialState);
    select(s => s.array)
      .filterWhere(e => e.value).isMatching(/^t/)
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[1], initialState.array[2]],
      where: 'value.match(/^t/)',
    });
    expect(read().array).toEqual([initialState.array[0]]);
    expect(testState.currentMutableState).toEqual(read());
  })

});