import { testState } from '../src/shared-state';
import { createApplicationStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filter().and().or()', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq().and().eq()', () => {
    const select = createApplicationStore(initialState);
    const where = 'id === 2 && value === two';
    select(s => s.array)
      .filterWhere(s => s.id).eq(2)
      .andWhere(s => s.value).eq('two')
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(${where}).remove()`,
      toRemove: [initialState.array[1]],
      where,
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[2]]);
  })

  it('should eq().or().eq()', () => {
    const select = createApplicationStore(initialState);
    const where = 'id === 1 || value === two';
    select(s => s.array)
      .filterWhere(s => s.id).eq(1)
      .orWhere(s => s.value).eq('two')
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(${where}).remove()`,
      toRemove: [initialState.array[0], initialState.array[1]],
      where,
    });
    expect(select().read().array).toEqual([initialState.array[2]]);
  })

  it('should eq().and().eq() not matching', () => {
    const select = createApplicationStore(initialState);
    const where = 'id === 1 && id === 2';
    select(s => s.array)
      .filterWhere(s => s.id).eq(1)
      .andWhere(s => s.id).eq(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(${where}).remove()`,
      toRemove: [],
      where,
    });
    expect(select().read().array).toEqual(initialState.array);
  })

  it('should eq().and().eq().or().eq()', () => {
    const select = createApplicationStore(initialState);
    const where = 'id === 1 && id === 2 || id === 3';
    select(s => s.array)
      .filterWhere(e => e.id).eq(1)
      .andWhere(e => e.id).eq(2)
      .orWhere(e => e.id).eq(3)
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(${where}).remove()`,
      toRemove: [initialState.array[2]],
      where,
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1]]);
  })

  it('should eq().or().eq().and().eq()', () => {
    const select = createApplicationStore(initialState);
    const where = 'id === 4 || id === 3 && value === three';
    select(s => s.array)
      .filterWhere(e => e.id).eq(4)
      .orWhere(e => e.id).eq(3)
      .andWhere(e => e.value).eq('three')
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(${where}).remove()`,
      toRemove: [initialState.array[2]],
      where,
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1]]);
  })

  it('should eq().and().eq().or().eq().and().eq()', () => {
    const select = createApplicationStore(initialState);
    const where = 'id === 1 && value === one || id === 3 && value === three';
    select(s => s.array)
      .filterWhere(e => e.id).eq(1)
      .andWhere(e => e.value).eq('one')
      .orWhere(e => e.id).eq(3)
      .andWhere(e => e.value).eq('three')
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(${where}).remove()`,
      toRemove: [initialState.array[0], initialState.array[2]],
      where,
    });
    expect(select().read().array).toEqual([initialState.array[1]]);
  })

});
