import { testState } from '../src/shared-state';
import { store } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filter().and().or()', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq().and().eq()', () => {
    const select = store(initialState);
    select(s => s.array)
      .filterWhere(s => s.id).isEqualto(2)
      .andWhere(s => s.value).isEqualto('two')
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [ initialState.array[1] ],
      where: 'id === 2 && value === two',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should eq().or().eq()', () => {
    const select = store(initialState);
    select(s => s.array)
      .filterWhere(s => s.id).isEqualto(1)
      .orWhere(s => s.value).isEqualto('two')
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[0], initialState.array[1]],
      where: 'id === 1 || value === two',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should eq().and().eq() not matching', () => {
    const select = store(initialState);
    select(s => s.array)
      .filterWhere(s => s.id).isEqualto(1)
      .andWhere(s => s.id).isEqualto(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [],
      where: 'id === 1 && id === 2',
    });
    expect(select(s => s.array).read()).toEqual(initialState.array);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should eq().and().eq().or().eq()', () => {
    const select = store(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).isEqualto(1)
      .andWhere(e => e.id).isEqualto(2)
      .orWhere(e => e.id).isEqualto(3)
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[2]],
      where: 'id === 1 && id === 2 || id === 3',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], initialState.array[1]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should eq().or().eq().and().eq()', () => {
    const select = store(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).isEqualto(4)
      .orWhere(e => e.id).isEqualto(3)
      .andWhere(e => e.value).isEqualto('three')
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[2]],
      where: 'id === 4 || id === 3 && value === three',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], initialState.array[1]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should eq().and().eq().or().eq().and().eq()', () => {
    const select = store(initialState);
    select(s => s.array)
      .filterWhere(e => e.id).isEqualto(1)
      .andWhere(e => e.value).isEqualto('one')
      .orWhere(e => e.id).isEqualto(3)
      .andWhere(e => e.value).isEqualto('three')
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[0], initialState.array[2]],
      where: 'id === 1 && value === one || id === 3 && value === three',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[1]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

});