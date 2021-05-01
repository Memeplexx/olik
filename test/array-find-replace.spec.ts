import { testState } from '../src/shared-state';
import { store } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.find().replace()', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq()', () => {
    const select = store(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .findWhere(e => e.id).isEqualto(2)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.find().replace()',
      replacement: payload,
      where: 'id === 2',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should ne()', () => {
    const select = store(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .findWhere(e => e.id).isNotEqualTo(2)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.find().replace()',
      replacement: payload,
      where: 'id !== 2',
    });
    expect(select(s => s.array).read()).toEqual([payload, initialState.array[1], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should gt()', () => {
    const select = store(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .findWhere(e => e.id).isGreaterThan(1)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.find().replace()',
      replacement: payload,
      where: 'id > 1',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should gte()', () => {
    const select = store(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .findWhere(e => e.id).isGreaterThanOrEqualTo(1)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.find().replace()',
      replacement: payload,
      where: 'id >= 1',
    });
    expect(select(s => s.array).read()).toEqual([payload, initialState.array[1], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should lt()', () => {
    const select = store(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .findWhere(e => e.id).isLessThan(2)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.find().replace()',
      replacement: payload,
      where: 'id < 2',
    });
    expect(select(s => s.array).read()).toEqual([payload, initialState.array[1], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should lte()', () => {
    const select = store(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .findWhere(e => e.id).isLessThanOrEqualTo(2)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.find().replace()',
      replacement: payload,
      where: 'id <= 2',
    });
    expect(select(s => s.array).read()).toEqual([payload, initialState.array[1], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should in()', () => {
    const select = store(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .findWhere(e => e.id).isInArray([1, 2])
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.find().replace()',
      replacement: payload,
      where: '[1, 2].includes(id)',
    });
    expect(select(s => s.array).read()).toEqual([payload, initialState.array[1], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should ni()', () => {
    const get = store(initialState);
    const payload = { id: 4, value: 'four' };
    get(s => s.array)
      .findWhere(e => e.id).isNotInArray([1, 2])
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.find().replace()',
      replacement: payload,
      where: '![1, 2].includes(id)',
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[0], initialState.array[1], payload]);
    expect(testState.currentMutableState).toEqual(get().read());
  })

  it('should match()', () => {
    const get = store(initialState);
    const payload = { id: 4, value: 'four' };
    get(s => s.array)
      .findWhere(e => e.value).isMatchingRegex(/^t/)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.find().replace()',
      replacement: payload,
      where: 'value.match(/^t/)',
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(get().read());
  })

});