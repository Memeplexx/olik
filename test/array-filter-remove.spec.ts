import { libState, testState } from '../src/shared-state';
import { createApplicationStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filter().remove()', () => {

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

  it('should eq()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .filter(e => e.id).eq(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).eq(2).remove()`,
      toRemove: [initialState.array[1]],
      where: [
        { 'id.eq': 2 }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[2]]);
  })

  it('should ne()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .filter(e => e.id).ne(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).ne(2).remove()`,
      toRemove: [initialState.array[0], initialState.array[2]],
      where: [
        { 'id.ne': 2 }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[1]]);
  })

  it('should gt()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .filter(e => e.id).gt(1)
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).gt(1).remove()`,
      toRemove: [initialState.array[1], initialState.array[2]],
      where: [
        { 'id.gt': 1 }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[0]]);
  })

  it('should gte()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .filter(e => e.id).gte(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).gte(2).remove()`,
      toRemove: [initialState.array[1], initialState.array[2]],
      where: [
        { 'id.gte': 2 }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[0]]);
  })

  it('should lt()', () => {
    const select = createApplicationStore(initialState);
    const where = 'id < 2';
    select(s => s.array)
      .filter(e => e.id).lt(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).lt(2).remove()`,
      toRemove: [initialState.array[0]],
      where: [
        { 'id.lt': 2 }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[1], initialState.array[2]]);
  })

  it('should lte()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .filter(e => e.id).lte(2)
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).lte(2).remove()`,
      toRemove: [initialState.array[0], initialState.array[1]],
      where: [
        { 'id.lte': 2 }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[2]]);
  })

  it('should in()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .filter(e => e.id).in([1, 2])
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).in(1,2).remove()`,
      toRemove: [initialState.array[0], initialState.array[1]],
      where: [
        { 'id.in': [1, 2] }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[2]]);
  })

  it('should ni()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .filter(e => e.id).ni([1, 2])
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).ni(1,2).remove()`,
      toRemove: [initialState.array[2]],
      where: [
        { 'id.ni': [1, 2] }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1]]);
  })

  it('should match()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .filter(e => e.value).match(/^t/)
      .remove();
    expect(testState.currentAction).toEqual({
      type: `array.filter(value).match(/^t/).remove()`,
      toRemove: [initialState.array[1], initialState.array[2]],
      where: [
        { 'value.match': /^t/ }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[0]]);
  })

});