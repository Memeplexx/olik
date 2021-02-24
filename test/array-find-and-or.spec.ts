import { errorMessages } from '../src/shared-consts';
import { set } from '../src/store-creators';
import { libState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.find().and().or()', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq().and().eq()', () => {
    const get = set(initialState);
    libState.logLevel = 'DEBUG';
    get(s => s.array)
      .whereOne(s => s.id).eq(2).and(s => s.value).eq('two')
      .remove();
    libState.logLevel = 'NONE';
    expect(libState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[1],
      query: 'id === 2 && value === two',
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[0], initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('should eq().or().eq()', () => {
    const get = set(initialState);
    get(s => s.array)
      .whereOne(s => s.id).eq(1).or(s => s.value).eq('two')
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[0],
      query: 'id === 1 || value === two',
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[1], initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('should eq().and().eq() not matching throw', () => {
    const get = set(initialState);
    expect(() => get(s => s.array)
      .whereOne(s => s.id).eq(1).and(s => s.id).eq(2)
      .remove()).toThrowError(errorMessages.NO_ARRAY_ELEMENT_FOUND);
  })

  it('should eq().and().eq().or().eq()', () => {
    const get = set(initialState);
    get(s => s.array)
      .whereOne(e => e.id).eq(1).and(e => e.id).eq(2).or(e => e.id).eq(3)
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[2],
      query: 'id === 1 && id === 2 || id === 3',
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[0], initialState.array[1]]);
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('should eq().or().eq().and().eq()', () => {
    const get = set(initialState);
    get(s => s.array)
      .whereOne(e => e.id).eq(4).or(e => e.id).eq(3).and(e => e.value).eq('three')
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[2],
      query: 'id === 4 || id === 3 && value === three',
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[0], initialState.array[1]]);
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('should eq().and().eq().or().eq().and().eq()', () => {
    const get = set(initialState);
    get(s => s.array)
      .whereOne(e => e.id).eq(1).and(e => e.value).eq('one').or(e => e.id).eq(3).and(e => e.value).eq('three')
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[0],
      query: 'id === 1 && value === one || id === 3 && value === three',
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[1], initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(get().read());
  })

});