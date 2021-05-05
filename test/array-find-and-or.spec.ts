import { errorMessages } from '../src/shared-consts';
import { testState } from '../src/shared-state';
import { store } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.find().and().or()', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq().andWhere().eq()', () => {
    const select = store(initialState);
    select(s => s.array)
      .findWhere(s => s.id).isEq(2)
      .andWhere(s => s.value).isEq('two')
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[1],
      where: 'id === 2 && value === two',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should eq().orWhere().eq()', () => {
    const select = store(initialState);
    select(s => s.array)
      .findWhere(s => s.id).isEq(1)
      .orWhere(s => s.value).isEq('two')
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[0],
      where: 'id === 1 || value === two',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[1], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should eq().andWhere().eq() not matching throw', () => {
    const select = store(initialState);
    expect(() => select(s => s.array)
      .findWhere(s => s.id).isEq(1)
      .andWhere(s => s.id).isEq(2)
      .remove()).toThrowError(errorMessages.NO_ARRAY_ELEMENT_FOUND);
  })

  it('should eq().andWhere().eq().or().eq()', () => {
    const select = store(initialState);
    select(s => s.array)
      .findWhere(e => e.id).isEq(1)
      .andWhere(e => e.id).isEq(2)
      .orWhere(e => e.id).isEq(3)
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[2],
      where: 'id === 1 && id === 2 || id === 3',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], initialState.array[1]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should eq().orWhere().eq().andWhere().eq()', () => {
    const select = store(initialState);
    select(s => s.array)
      .findWhere(e => e.id).isEq(4)
      .orWhere(e => e.id).isEq(3)
      .andWhere(e => e.value).isEq('three')
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[2],
      where: 'id === 4 || id === 3 && value === three',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], initialState.array[1]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should eq().andWhere().eq().orWhere().eq().andWhere().eq()', () => {
    const select = store(initialState);
    select(s => s.array)
      .findWhere(e => e.id).isEq(1)
      .andWhere(e => e.value).isEq('one')
      .orWhere(e => e.id).isEq(3)
      .andWhere(e => e.value).isEq('three')
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[0],
      where: 'id === 1 && value === one || id === 3 && value === three',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[1], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

});