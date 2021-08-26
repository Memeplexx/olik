import { libState, testState } from '../src/shared-state';
import { createApplicationStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filter().replace()', () => {

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
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filter(e => e.id).eq(2)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).eq(2).replace()`,
      replacement: payload,
      where: [
        { 'id.eq': 2 }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[0], payload, initialState.array[2]]);
  })

  it('should ne()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filter(e => e.id).ne(2)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).ne(2).replace()`,
      replacement: payload,
      where: [
        { 'id.ne': 2 }
      ],
    });
    expect(select().read().array).toEqual([payload, initialState.array[1], payload]);
  })

  it('should gt()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filter(e => e.id).gt(1)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).gt(1).replace()`,
      replacement: payload,
      where: [
        { 'id.gt': 1 }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[0], payload, payload]);
  })

  it('should gte()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filter(e => e.id).gte(1)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).gte(1).replace()`,
      replacement: payload,
      where: [
        { 'id.gte': 1 }
      ],
    });
    expect(select().read().array).toEqual([payload, payload, payload]);
  })

  it('should lt()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filter(e => e.id).lt(2)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).lt(2).replace()`,
      replacement: payload,
      where: [
        { 'id.lt': 2 }
      ],
    });
    expect(select().read().array).toEqual([payload, initialState.array[1], initialState.array[2]]);
  })

  it('should lte()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filter(e => e.id).lte(2)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).lte(2).replace()`,
      replacement: payload,
      where: [
        { 'id.lte': 2 }
      ],
    });
    expect(select().read().array).toEqual([payload, payload, initialState.array[2]]);
  })

  it('should in()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filter(e => e.id).in([1, 2])
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).in(1,2).replace()`,
      replacement: payload,
      where: [
        { 'id.in': [1, 2] }
      ],
    });
    expect(select().read().array).toEqual([payload, payload, initialState.array[2]]);
  })

  it('should ni()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filter(e => e.id).ni([1, 2])
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.filter(id).ni(1,2).replace()`,
      replacement: payload,
      where: [
        { 'id.ni': [1, 2] }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1], payload]);
  })

  it('should match()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filter(e => e.value).match(/^t/)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `array.filter(value).match(/^t/).replace()`,
      replacement: payload,
      where: [
        { 'value.match': /^t/ }
      ],
    });
    expect(select().read().array).toEqual([initialState.array[0], payload, payload]);
  })

});