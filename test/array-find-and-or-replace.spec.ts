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

  it('should eq().and().eq()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .find(s => s.id).eq(2)
      .and(s => s.value).eq('two')
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(id).eq(2).and(value).eq(two).replace()`,
      where: [
        { 'id.eq': 2 },
        { 'and.value.eq': 'two' }
      ],
      replacement: payload,
    });
    expect(select().read().array).toEqual([initialState.array[0], payload, initialState.array[2]]);
  })

  it('should eq().or().eq()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .find(s => s.id).eq(1)
      .or(s => s.value).eq('two')
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(id).eq(1).or(value).eq(two).replace()`,
      where: [
        { 'id.eq': 1 },
        { 'or.value.eq': 'two' }
      ],
      replacement: payload,
    });
    expect(select().read().array).toEqual([payload, initialState.array[1], initialState.array[2]]);
  })

  it('should eq().and().eq() not matching throw', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    expect(() => select(s => s.array)
      .find(s => s.id).eq(1)
      .and(s => s.id).eq(2)
      .replace(payload)
    ).toThrowError(errorMessages.NO_ARRAY_ELEMENT_FOUND);
  })

  it('should eq().and().eq().or().eq()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    const where = 'id === 1 && id === 2 || id === 3';
    select(s => s.array)
      .find(e => e.id).eq(1)
      .and(e => e.id).eq(2)
      .or(e => e.id).eq(3)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(id).eq(1).and(id).eq(2).or(id).eq(3).replace()`,
      where: [
        { 'id.eq': 1 },
        { 'and.id.eq': 2 },
        { 'or.id.eq': 3 }
      ],
      replacement: payload,
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1], payload]);
  })

  it('should eq().or().eq().and().eq()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .find(e => e.id).eq(4)
      .or(e => e.id).eq(3)
      .and(e => e.value).eq('three')
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(id).eq(4).or(id).eq(3).and(value).eq(three).replace()`,
      where: [
        { 'id.eq': 4 },
        { 'or.id.eq': 3 },
        { 'and.value.eq': 'three' }
      ],
      replacement: payload,
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1], payload]);
  })

  it('should eq().and().eq().or().eq().and().eq()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .find(e => e.id).eq(1)
      .and(e => e.value).eq('one')
      .or(e => e.id).eq(3)
      .and(e => e.value).eq('three')
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(id).eq(1).and(value).eq(one).or(id).eq(3).and(value).eq(three).replace()`,
      where: [
        { 'id.eq': 1 },
        { 'and.value.eq': 'one' },
        { 'or.id.eq': 3 },
        { 'and.value.eq': 'three' }
      ],
      replacement: payload,
    });
    expect(select().read().array).toEqual([payload, initialState.array[1], initialState.array[2]]);
  })

});