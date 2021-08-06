import { testState } from '../src/shared-state';
import { createRootStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.whereMany().replace()', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq()', () => {
    const select = createRootStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filterWhere(e => e.id).eq(2)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().replace()',
      replacement: payload,
      where: 'id === 2',
    });
    expect(select().read().array).toEqual([initialState.array[0], payload, initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should ne()', () => {
    const select = createRootStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filterWhere(e => e.id).ne(2)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().replace()',
      replacement: payload,
      where: 'id !== 2',
    });
    expect(select().read().array).toEqual([payload, initialState.array[1], payload]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should gt()', () => {
    const select = createRootStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filterWhere(e => e.id).gt(1)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().replace()',
      replacement: payload,
      where: 'id > 1',
    });
    expect(select().read().array).toEqual([initialState.array[0], payload, payload]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should gte()', () => {
    const select = createRootStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filterWhere(e => e.id).gte(1)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().replace()',
      replacement: payload,
      where: 'id >= 1',
    });
    expect(select().read().array).toEqual([payload, payload, payload]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should lt()', () => {
    const select = createRootStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filterWhere(e => e.id).lt(2)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().replace()',
      replacement: payload,
      where: 'id < 2',
    });
    expect(select().read().array).toEqual([payload, initialState.array[1], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should lte()', () => {
    const select = createRootStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filterWhere(e => e.id).lte(2)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().replace()',
      replacement: payload,
      where: 'id <= 2',
    });
    expect(select().read().array).toEqual([payload, payload, initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should in()', () => {
    const select = createRootStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filterWhere(e => e.id).in([1, 2])
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().replace()',
      replacement: payload,
      where: '[1, 2].includes(id)',
    });
    expect(select().read().array).toEqual([payload, payload, initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should ni()', () => {
    const select = createRootStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filterWhere(e => e.id).ni([1, 2])
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().replace()',
      replacement: payload,
      where: '![1, 2].includes(id)',
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1], payload]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should match()', () => {
    const select = createRootStore(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filterWhere(e => e.value).matches(/^t/)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().replace()',
      replacement: payload,
      where: 'value.match(/^t/)',
    });
    expect(select().read().array).toEqual([initialState.array[0], payload, payload]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

});