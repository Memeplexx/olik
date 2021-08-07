import { testState } from '../src/shared-state';
import { createRootStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filterCustom().remove()', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq()', () => {
    const select = createRootStore(initialState);
    const where = (e: typeof initialState['array'][0]) => e.id === 2;
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[1]],
      where: where.toString(),
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[2]]);
  })

  it('should ne()', () => {
    const select = createRootStore(initialState);
    const where = (e: typeof initialState['array'][0]) => e.id !== 2;
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[0], initialState.array[2]],
      where: where.toString(),
    });
    expect(select().read().array).toEqual([initialState.array[1]]);
  })

  it('should gt()', () => {
    const select = createRootStore(initialState);
    const where = (e: typeof initialState['array'][0]) => e.id > 1;
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[1], initialState.array[2]],
      where: where.toString(),
    });
    expect(select().read().array).toEqual([initialState.array[0]]);
  })

  it('should lt()', () => {
    const select = createRootStore(initialState);
    const where = (e: typeof initialState['array'][0]) => e.id < 2;
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[0]],
      where: where.toString(),
    });
    expect(select().read().array).toEqual([initialState.array[1], initialState.array[2]]);
  })

  it('should in()', () => {
    const select = createRootStore(initialState);
    const where = (e: typeof initialState['array'][0]) => [1, 2].includes(e.id);
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[0], initialState.array[1]],
      where: where.toString(),
    });
    expect(select().read().array).toEqual([initialState.array[2]]);
  })

  it('should ni()', () => {
    const select = createRootStore(initialState);
    const where = (e: typeof initialState['array'][0]) => ![1, 2].includes(e.id);
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[2]],
      where: where.toString(),
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1]]);
  })

  it('should match()', () => {
    const select = createRootStore(initialState);
    const where = (e: typeof initialState['array'][0]) => /^t/.test(e.value);
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[1], initialState.array[2]],
      where: where.toString(),
    });
    expect(select().read().array).toEqual([initialState.array[0]]);
  })

});