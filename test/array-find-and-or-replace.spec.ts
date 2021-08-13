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
    const payload = { id: 4, value: 'four' };
    const where = 'id === 2 && value === two';
    select(s => s.array)
      .findWhere(s => s.id).eq(2)
      .andWhere(s => s.value).eq('two')
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(${where}).replace()`,
      where,
      replacement: payload,
    });
    expect(select().read().array).toEqual([initialState.array[0], payload, initialState.array[2]]);
  })

  it('should eq().orWhere().eq()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    const where = 'id === 1 || value === two';
    select(s => s.array)
      .findWhere(s => s.id).eq(1)
      .orWhere(s => s.value).eq('two')
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(${where}).replace()`,
      where,
      replacement: payload,
    });
    expect(select().read().array).toEqual([payload, initialState.array[1], initialState.array[2]]);
  })

  it('should eq().andWhere().eq() not matching throw', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    expect(() => select(s => s.array)
      .findWhere(s => s.id).eq(1)
      .andWhere(s => s.id).eq(2)
      .replace(payload)
    ).toThrowError(errorMessages.NO_ARRAY_ELEMENT_FOUND);
  })

  it('should eq().andWhere().eq().or().eq()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    const where = 'id === 1 && id === 2 || id === 3';
    select(s => s.array)
      .findWhere(e => e.id).eq(1)
      .andWhere(e => e.id).eq(2)
      .orWhere(e => e.id).eq(3)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(${where}).replace()`,
      where,
      replacement: payload,
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1], payload]);
  })

  it('should eq().orWhere().eq().andWhere().eq()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    const where = 'id === 4 || id === 3 && value === three';
    select(s => s.array)
      .findWhere(e => e.id).eq(4)
      .orWhere(e => e.id).eq(3)
      .andWhere(e => e.value).eq('three')
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(${where}).replace()`,
      where,
      replacement: payload,
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1], payload]);
  })

  it('should eq().andWhere().eq().orWhere().eq().andWhere().eq()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    const where = 'id === 1 && value === one || id === 3 && value === three';
    select(s => s.array)
      .findWhere(e => e.id).eq(1)
      .andWhere(e => e.value).eq('one')
      .orWhere(e => e.id).eq(3)
      .andWhere(e => e.value).eq('three')
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(${where}).replace()`,
      where,
      replacement: payload,
    });
    expect(select().read().array).toEqual([payload, initialState.array[1], initialState.array[2]]);
  })

});