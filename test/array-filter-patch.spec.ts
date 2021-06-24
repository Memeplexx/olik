import { testState } from '../src/shared-state';
import { createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filter().patch()', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq()', () => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { value: 'new' };
    get(s => s.array)
      .filterWhere(e => e.id).eq(2)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().patch()',
      patch: payload,
      where: 'id === 2',
    });
    expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should ne()', () => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { value: 'four' };
    get(s => s.array)
      .filterWhere(e => e.id).ne(2)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().patch()',
      patch: payload,
      where: 'id !== 2',
    });
    expect(read().array).toEqual([{ ...initialState.array[0], ...payload }, initialState.array[1], { ...initialState.array[2], ...payload }]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should gt()', () => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { value: 'four' };
    get(s => s.array)
      .filterWhere(e => e.id).gt(1)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().patch()',
      patch: payload,
      where: 'id > 1',
    });
    expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, { ...initialState.array[2], ...payload }]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should gte()', () => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { value: 'four' };
    get(s => s.array)
      .filterWhere(e => e.id).gte(1)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().patch()',
      patch: payload,
      where: 'id >= 1',
    });
    expect(read().array).toEqual([{ ...initialState.array[0], ...payload }, { ...initialState.array[1], ...payload }, { ...initialState.array[2], ...payload }]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should lt()', () => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { value: 'four' };
    get(s => s.array)
      .filterWhere(e => e.id).lt(2)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().patch()',
      patch: payload,
      where: 'id < 2',
    });
    expect(read().array).toEqual([{ ...initialState.array[0], ...payload }, initialState.array[1], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should lte()', () => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { value: 'four' };
    get(s => s.array)
      .filterWhere(e => e.id).lte(2)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().patch()',
      patch: payload,
      where: 'id <= 2',
    });
    expect(read().array).toEqual([{ ...initialState.array[0], ...payload }, { ...initialState.array[1], ...payload }, initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should in()', () => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { id: 4, value: 'four' };
    get(s => s.array)
      .filterWhere(e => e.id).in([1, 2])
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().patch()',
      patch: payload,
      where: '[1, 2].includes(id)',
    });
    expect(read().array).toEqual([{ ...initialState.array[0], ...payload }, { ...initialState.array[1], ...payload }, initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should ni()', () => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { value: 'four' };
    get(s => s.array)
      .filterWhere(e => e.id).ni([1, 2])
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().patch()',
      patch: payload,
      where: '![1, 2].includes(id)',
    });
    expect(read().array).toEqual([initialState.array[0], initialState.array[1], { ...initialState.array[2], ...payload }]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should match()', () => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { value: 'four' };
    get(s => s.array)
      .filterWhere(e => e.value).matches(/^t/)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().patch()',
      patch: payload,
      where: 'value.match(/^t/)',
    });
    expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, { ...initialState.array[2], ...payload }]);
    expect(testState.currentMutableState).toEqual(read());
  })

});