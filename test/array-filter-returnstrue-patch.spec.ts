import { testState } from '../src/shared-state';
import { createRootStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filterCustom().patch()', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq()', () => {
    const select = createRootStore(initialState);
    const payload = { value: 'new' };
    const where = (e: typeof initialState['array'][0]) => e.id === 2;
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().patch()',
      patch: payload,
      where: where.toString(),
    });
    expect(select().read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
  })

  it('should ne()', () => {
    const select = createRootStore(initialState);
    const payload = { value: 'four' };
    const where = (e: typeof initialState['array'][0]) => e.id !== 2;
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().patch()',
      patch: payload,
      where: where.toString(),
    });
    expect(select().read().array).toEqual([{ ...initialState.array[0], ...payload }, initialState.array[1], { ...initialState.array[2], ...payload }]);
  })

  it('should gt()', () => {
    const select = createRootStore(initialState);
    const payload = { value: 'four' };
    const where = (e: typeof initialState['array'][0]) => e.id > 1;
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().patch()',
      patch: payload,
      where: where.toString(),
    });
    expect(select().read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, { ...initialState.array[2], ...payload }]);
  })

  it('should lt()', () => {
    const select = createRootStore(initialState);
    const payload = { value: 'four' };
    const where = (e: typeof initialState['array'][0]) => e.id < 2;
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().patch()',
      patch: payload,
      where: where.toString(),
    });
    expect(select().read().array).toEqual([{ ...initialState.array[0], ...payload }, initialState.array[1], initialState.array[2]]);
  })

  it('should in()', () => {
    const select = createRootStore(initialState);
    const payload = { id: 4, value: 'four' };
    const where = (e: typeof initialState['array'][0]) => [1, 2].includes(e.id);
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().patch()',
      patch: payload,
      where: where.toString(),
    });
    expect(select().read().array).toEqual([{ ...initialState.array[0], ...payload }, { ...initialState.array[1], ...payload }, initialState.array[2]]);
  })

  it('should ni()', () => {
    const select = createRootStore(initialState);
    const payload = { value: 'four' };
    const where = (e: typeof initialState['array'][0]) => ![1, 2].includes(e.id);
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().patch()',
      patch: payload,
      where: where.toString(),
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1], { ...initialState.array[2], ...payload }]);
  })

  it('should match()', () => {
    const select = createRootStore(initialState);
    const payload = { value: 'four' };
    const where = (e: typeof initialState['array'][0]) => /^t/.test(e.value);
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().patch()',
      patch: payload,
      where: where.toString(),
    });
    expect(select().read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, { ...initialState.array[2], ...payload }]);
  })

});