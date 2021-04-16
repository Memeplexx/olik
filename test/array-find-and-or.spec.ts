import { errorMessages } from '../src/shared-consts';
import { store } from '../src/store-creators';
import { libState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';
import { transact } from '../src';

describe('array.find().and().or()', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq().andWhere().eq()', () => {
    const select = store(initialState);
    select(s => s.array)
      .findWhere(s => s.id).eq(2).andWhere(s => s.value).eq('two')
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[1],
      query: 'id === 2 && value === two',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should eq().orWhere().eq()', () => {
    const select = store(initialState);
    select(s => s.array)
      .findWhere(s => s.id).eq(1).orWhere(s => s.value).eq('two')
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[0],
      query: 'id === 1 || value === two',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[1], initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should eq().andWhere().eq() not matching throw', () => {
    const select = store(initialState);
    expect(() => select(s => s.array)
      .findWhere(s => s.id).eq(1).andWhere(s => s.id).eq(2)
      .remove()).toThrowError(errorMessages.NO_ARRAY_ELEMENT_FOUND);
  })

  it('should eq().andWhere().eq().or().eq()', () => {
    const select = store(initialState);
    select(s => s.array)
      .findWhere(e => e.id).eq(1).andWhere(e => e.id).eq(2).orWhere(e => e.id).eq(3)
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[2],
      query: 'id === 1 && id === 2 || id === 3',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], initialState.array[1]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should eq().orWhere().eq().andWhere().eq()', () => {
    const select = store(initialState);
    select(s => s.array)
      .findWhere(e => e.id).eq(4).orWhere(e => e.id).eq(3).andWhere(e => e.value).eq('three')
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[2],
      query: 'id === 4 || id === 3 && value === three',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], initialState.array[1]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should eq().andWhere().eq().orWhere().eq().andWhere().eq()', () => {
    const select = store(initialState);
    select(s => s.array)
      .findWhere(e => e.id).eq(1).andWhere(e => e.value).eq('one').orWhere(e => e.id).eq(3).andWhere(e => e.value).eq('three')
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[0],
      query: 'id === 1 && value === one || id === 3 && value === three',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[1], initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

});