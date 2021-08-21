import { errorMessages } from '../src/shared-consts';
import { libState, testState } from '../src/shared-state';
import { createApplicationStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.find().and().or()', () => {

  beforeAll(() => {
    testState.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  });

  beforeEach(() => {
    libState.applicationStore = null;
  })

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq().andWhere().eq()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .findWhere(s => s.id).eq(2)
      .andWhere(s => s.value).eq('two')
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.find(id).eq(2).and(value).eq(two).remove()`,
      toRemove: initialState.array[1],
      where: [
        { 'id.eq': 2 },
        { 'and.value.eq': 'two' }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[2]]);
  })

  it('should eq().orWhere().eq()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .findWhere(s => s.id).eq(1)
      .orWhere(s => s.value).eq('two')
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.find(id).eq(1).or(value).eq(two).remove()`,
      toRemove: initialState.array[0],
      where: [
        { 'id.eq': 1 },
        { 'or.value.eq': 'two' }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[1], initialState.array[2]]);
  })

  it('should eq().andWhere().eq() not matching throw', () => {
    const select = createApplicationStore(initialState);
    expect(() => select(s => s.array)
      .findWhere(s => s.id).eq(1)
      .andWhere(s => s.id).eq(2)
      .remove()
    ).toThrowError(errorMessages.NO_ARRAY_ELEMENT_FOUND);
  })

  it('should eq().andWhere().eq().or().eq()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .findWhere(e => e.id).eq(1)
      .andWhere(e => e.id).eq(2)
      .orWhere(e => e.id).eq(3)
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.find(id).eq(1).and(id).eq(2).or(id).eq(3).remove()`,
      toRemove: initialState.array[2],
      where: [
        { 'id.eq': 1 },
        { 'and.id.eq': 2 },
        { 'or.id.eq': 3 }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1]]);
  })

  it('should eq().orWhere().eq().andWhere().eq()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .findWhere(e => e.id).eq(4)
      .orWhere(e => e.id).eq(3)
      .andWhere(e => e.value).eq('three')
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.find(id).eq(4).or(id).eq(3).and(value).eq(three).remove()`,
      toRemove: initialState.array[2],
      where: [
        { 'id.eq': 4 },
        { 'or.id.eq': 3 },
        { 'and.value.eq': 'three' }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1]]);
  })

  it('should eq().andWhere().eq().orWhere().eq().andWhere().eq()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .findWhere(e => e.id).eq(1)
      .andWhere(e => e.value).eq('one')
      .orWhere(e => e.id).eq(3)
      .andWhere(e => e.value).eq('three')
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.find(id).eq(1).and(value).eq(one).or(id).eq(3).and(value).eq(three).remove()`,
      toRemove: initialState.array[0],
      where: [
        { 'id.eq': 1 },
        { 'and.value.eq': 'one' },
        { 'or.id.eq': 3 },
        { 'and.value.eq': 'three' }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[1], initialState.array[2]]);
  })

});