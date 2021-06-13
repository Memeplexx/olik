import { testState } from '../src/shared-state';
import { createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.findCustom().patch()', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq()', () => {
    const { select, read } = createGlobalStore(initialState);
    const payload = { value: 'new' };
    const where = (e: typeof initialState['array'][0]) => e.id === 2;
    select(s => s.array)
      .findWhere(where).returnsTrue()
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.find().patch()',
      patch: payload,
      where: where.toString(),
    });
    expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should ne()', () => {
    const { select, read } = createGlobalStore(initialState);
    const payload = { value: 'four' };
    const where = (e: typeof initialState['array'][0]) => e.id !== 2;
    select(s => s.array)
      .findWhere(where).returnsTrue()
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.find().patch()',
      patch: payload,
      where: where.toString(),
    });
    expect(read().array).toEqual([{ ...initialState.array[0], ...payload }, initialState.array[1], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should gt()', () => {
    const { select, read } = createGlobalStore(initialState);
    const payload = { value: 'four' };
    const where = (e: typeof initialState['array'][0]) => e.id > 1;
    select(s => s.array)
      .findWhere(where).returnsTrue()
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.find().patch()',
      patch: payload,
      where: where.toString(),
    });
    expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should lt()', () => {
    const { select, read } = createGlobalStore(initialState);
    const payload = { value: 'four' };
    const where = (e: typeof initialState['array'][0]) => e.id < 2;
    select(s => s.array)
      .findWhere(where).returnsTrue()
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.find().patch()',
      patch: payload,
      where: where.toString(),
    });
    expect(read().array).toEqual([{ ...initialState.array[0], ...payload }, initialState.array[1], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should in()', () => {
    const { select, read } = createGlobalStore(initialState);
    const payload = { id: 4, value: 'four' };
    const where = (e: typeof initialState['array'][0]) => [1, 2].includes(e.id);
    select(s => s.array)
      .findWhere(where).returnsTrue()
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.find().patch()',
      patch: payload,
      where: where.toString(),
    });
    expect(read().array).toEqual([{ ...initialState.array[0], ...payload }, initialState.array[1], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should ni()', () => {
    const { select, read } = createGlobalStore(initialState);
    const payload = { value: 'four' };
    const where = (e: typeof initialState['array'][0]) => ![1, 2].includes(e.id);
    select(s => s.array)
      .findWhere(where).returnsTrue()
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.find().patch()',
      patch: payload,
      where: where.toString(),
    });
    expect(read().array).toEqual([initialState.array[0], initialState.array[1], { ...initialState.array[2], ...payload }]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should match()', () => {
    const { select, read } = createGlobalStore(initialState);
    const payload = { value: 'four' };
    const where = (e: typeof initialState['array'][0]) => /^t/.test(e.value);
    select(s => s.array)
      .findWhere(where).returnsTrue()
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.find().patch()',
      patch: payload,
      where: where.toString(),
    });
    expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(read());
  })

});