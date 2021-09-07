import { libState, testState } from '../src/shared-state';
import { createApplicationStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filter().and().or()', () => {

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

  it('should eq().and().eq()', () => {
    const select = createApplicationStore(initialState, {  });
    select(s => s.array)
      .filter(s => s.id).eq(2)
      .and(s => s.value).eq('two')
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).eq(2).and(value).eq(two).remove()`,
      toRemove: [initialState.array[1]],
      where: [
        { 'id.eq': 2 },
        { 'and.value.eq': 'two' }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[2]]);
  })

  it('should eq().or().eq()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .filter(s => s.id).eq(1)
      .or(s => s.value).eq('two')
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).eq(1).or(value).eq(two).remove()`,
      toRemove: [initialState.array[0], initialState.array[1]],
      where: [
        { 'id.eq': 1 },
        { 'or.value.eq': 'two' }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[2]]);
  })

  it('should eq().and().eq() not matching', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .filter(s => s.id).eq(1)
      .and(s => s.id).eq(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).eq(1).and(id).eq(2).remove()`,
      toRemove: [],
      where: [
        { 'id.eq': 1 },
        { 'and.id.eq': 2 }
      ],
    });
    expect(select().read().array).toEqual(initialState.array);
  })

  it('should eq().and().eq().or().eq()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .filter(e => e.id).eq(1)
      .and(e => e.id).eq(2)
      .or(e => e.id).eq(3)
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).eq(1).and(id).eq(2).or(id).eq(3).remove()`,
      toRemove: [initialState.array[2]],
      where: [
        { 'id.eq': 1 },
        { 'and.id.eq': 2 },
        { 'or.id.eq': 3 }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1]]);
  })

  it('should eq().or().eq().and().eq()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .filter(e => e.id).eq(4)
      .or(e => e.id).eq(3)
      .and(e => e.value).eq('three')
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).eq(4).or(id).eq(3).and(value).eq(three).remove()`,
      toRemove: [initialState.array[2]],
      where: [
        { 'id.eq': 4 },
        { 'or.id.eq': 3 },
        { 'and.value.eq': 'three' },
      ],
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1]]);
  })

  it('should eq().and().eq().or().eq().and().eq()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .filter(e => e.id).eq(1)
      .and(e => e.value).eq('one')
      .or(e => e.id).eq(3)
      .and(e => e.value).eq('three')
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).eq(1).and(value).eq(one).or(id).eq(3).and(value).eq(three).remove()`,
      toRemove: [initialState.array[0], initialState.array[2]],
      where: [
        { 'id.eq': 1 },
        { 'and.value.eq': 'one' },
        { 'or.id.eq': 3 },
        { 'and.value.eq': 'three' },
      ],
    });
    expect(select().read().array).toEqual([initialState.array[1]]);
  })

});
