import { set } from '../src/store-creators';
import { libState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filter().patch()', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq()', () => {
    const select = set(initialState);
    const payload = { value: 'new' };
    select(s => s.array)
      .whereMany(e => e.id).eq(2)
      .patch(payload);
    expect(libState.currentAction).toEqual({
      type: 'select(array).whereMany().patch()',
      patch: payload,
      query: 'id === 2',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should ne()', () => {
    const select = set(initialState);
    const payload = { value: 'four' };
    select(s => s.array)
      .whereMany(e => e.id).ne(2)
      .patch(payload);
    expect(libState.currentAction).toEqual({
      type: 'select(array).whereMany().patch()',
      patch: payload,
      query: 'id !== 2',
    });
    expect(select(s => s.array).read()).toEqual([{ ...initialState.array[0], ...payload }, initialState.array[1], { ...initialState.array[2], ...payload }]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should gt()', () => {
    const select = set(initialState);
    const payload = { value: 'four' };
    select(s => s.array)
      .whereMany(e => e.id).gt(1)
      .patch(payload);
    expect(libState.currentAction).toEqual({
      type: 'select(array).whereMany().patch()',
      patch: payload,
      query: 'id > 1',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, { ...initialState.array[2], ...payload }]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should gte()', () => {
    const select = set(initialState);
    const payload = { value: 'four' };
    select(s => s.array)
      .whereMany(e => e.id).gte(1)
      .patch(payload);
    expect(libState.currentAction).toEqual({
      type: 'select(array).whereMany().patch()',
      patch: payload,
      query: 'id >= 1',
    });
    expect(select(s => s.array).read()).toEqual([{ ...initialState.array[0], ...payload }, { ...initialState.array[1], ...payload }, { ...initialState.array[2], ...payload }]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should lt()', () => {
    const select = set(initialState);
    const payload = { value: 'four' };
    select(s => s.array)
      .whereMany(e => e.id).lt(2)
      .patch(payload);
    expect(libState.currentAction).toEqual({
      type: 'select(array).whereMany().patch()',
      patch: payload,
      query: 'id < 2',
    });
    expect(select(s => s.array).read()).toEqual([{ ...initialState.array[0], ...payload }, initialState.array[1], initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should lte()', () => {
    const select = set(initialState);
    const payload = { value: 'four' };
    select(s => s.array)
      .whereMany(e => e.id).lte(2)
      .patch(payload);
    expect(libState.currentAction).toEqual({
      type: 'select(array).whereMany().patch()',
      patch: payload,
      query: 'id <= 2',
    });
    expect(select(s => s.array).read()).toEqual([{ ...initialState.array[0], ...payload }, { ...initialState.array[1], ...payload }, initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should in()', () => {
    const select = set(initialState);
    const payload = { id: 4, value: 'four' };
    select(s => s.array)
      .whereMany(e => e.id).in([1, 2])
      .patch(payload);
    expect(libState.currentAction).toEqual({
      type: 'select(array).whereMany().patch()',
      patch: payload,
      query: '[1, 2].includes(id)',
    });
    expect(select(s => s.array).read()).toEqual([{ ...initialState.array[0], ...payload }, { ...initialState.array[1], ...payload }, initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should ni()', () => {
    const select = set(initialState);
    const payload = { value: 'four' };
    select(s => s.array)
      .whereMany(e => e.id).ni([1, 2])
      .patch(payload);
    expect(libState.currentAction).toEqual({
      type: 'select(array).whereMany().patch()',
      patch: payload,
      query: '![1, 2].includes(id)',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], initialState.array[1], { ...initialState.array[2], ...payload }]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should match()', () => {
    const select = set(initialState);
    const payload = { value: 'four' };
    select(s => s.array)
      .whereMany(e => e.value).match(/^t/)
      .patch(payload);
    expect(libState.currentAction).toEqual({
      type: 'select(array).whereMany().patch()',
      patch: payload,
      query: 'value.match(/^t/)',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, { ...initialState.array[2], ...payload }]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

});