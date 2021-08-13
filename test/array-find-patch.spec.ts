import { libState, testState } from '../src/shared-state';
import { createApplicationStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.find().patch()', () => {

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
    const payload = { value: 'new' };
    const where = 'id === 2';
    select(s => s.array)
      .findWhere(e => e.id).eq(2)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(${where}).patch()`,
      patch: payload,
      where,
    });
    expect(select().read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
  })

  it('should ne()', () => {
    const select = createApplicationStore(initialState);
    const payload = { value: 'four' };
    const where = 'id !== 2';
    select(s => s.array)
      .findWhere(e => e.id).ne(2)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(${where}).patch()`,
      patch: payload,
      where,
    });
    expect(select().read().array).toEqual([{ ...initialState.array[0], ...payload }, initialState.array[1], initialState.array[2]]);
  })

  it('should gt()', () => {
    const select = createApplicationStore(initialState);
    const payload = { value: 'four' };
    const where = 'id > 1';
    select(s => s.array)
      .findWhere(e => e.id).gt(1)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(${where}).patch()`,
      patch: payload,
      where,
    });
    expect(select().read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
  })

  it('should gte()', () => {
    const select = createApplicationStore(initialState);
    const payload = { value: 'four' };
    const where = 'id >= 1';
    select(s => s.array)
      .findWhere(e => e.id).gte(1)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(${where}).patch()`,
      patch: payload,
      where,
    });
    expect(select().read().array).toEqual([{ ...initialState.array[0], ...payload }, initialState.array[1], initialState.array[2]]);
  })

  it('should lt()', () => {
    const select = createApplicationStore(initialState);
    const payload = { value: 'four' };
    const where = 'id < 2';
    select(s => s.array)
      .findWhere(e => e.id).lt(2)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(${where}).patch()`,
      patch: payload,
      where,
    });
    expect(select().read().array).toEqual([{ ...initialState.array[0], ...payload }, initialState.array[1], initialState.array[2]]);
  })

  it('should lte()', () => {
    const select = createApplicationStore(initialState);
    const payload = { value: 'four' };
    const where = 'id <= 2';
    select(s => s.array)
      .findWhere(e => e.id).lte(2)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(${where}).patch()`,
      patch: payload,
      where,
    });
    expect(select().read().array).toEqual([{ ...initialState.array[0], ...payload }, initialState.array[1], initialState.array[2]]);
  })

  it('should in()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, value: 'four' };
    const where = '[1, 2].includes(id)';
    select(s => s.array)
      .findWhere(e => e.id).in([1, 2])
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(${where}).patch()`,
      patch: payload,
      where,
    });
    expect(select().read().array).toEqual([{ ...initialState.array[0], ...payload }, initialState.array[1], initialState.array[2]]);
  })

  it('should ni()', () => {
    const select = createApplicationStore(initialState);
    const payload = { value: 'four' };
    const where = '![1, 2].includes(id)';
    select(s => s.array)
      .findWhere(e => e.id).ni([1, 2])
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(${where}).patch()`,
      patch: payload,
      where,
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1], { ...initialState.array[2], ...payload }]);
  })

  it('should match()', () => {
    const select = createApplicationStore(initialState);
    const payload = { value: 'four' };
    const where = 'value.match(/^t/)';
    select(s => s.array)
      .findWhere(e => e.value).matches(/^t/)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: `array.find(${where}).patch()`,
      patch: payload,
      where,
    });
    expect(select().read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
  })

});