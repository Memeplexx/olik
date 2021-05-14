import { testState } from '../src/shared-state';
import { store } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filter().patch()', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq()', () => {
    const { select, read } = store(initialState);
    const payload = { value: 'new' };
    select(s => s.array)
      .filterWhere(e => e.id).isEq(2)
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
    const { select, read } = store(initialState);
    const payload = { value: 'four' };
    select(s => s.array)
      .filterWhere(e => e.id).isNotEq(2)
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
    const { select, read } = store(initialState);
    const payload = { value: 'four' };
    select(s => s.array)
      .filterWhere(e => e.id).isMoreThan(1)
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
    const { select, read } = store(initialState);
    const payload = { value: 'four' };
    select(s => s.array)
      .filterWhere(e => e.id).isMoreThanOrEq(1)
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
    const { select, read } = store(initialState);
    const payload = { value: 'four' };
    select(s => s.array)
      .filterWhere(e => e.id).isLessThan(2)
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
    const { select, read } = store(initialState);
    const payload = { value: 'four' };
    select(s => s.array)
      .filterWhere(e => e.id).isLessThanOrEq(2)
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
    const { select, read } = store(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .filterWhere(e => e.id).isIn([1, 2])
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
    const { select, read } = store(initialState);
    const payload = { value: 'four' };
    select(s => s.array)
      .filterWhere(e => e.id).isNotIn([1, 2])
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
    const { select, read } = store(initialState);
    const payload = { value: 'four' };
    select(s => s.array)
      .filterWhere(e => e.value).isMatching(/^t/)
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