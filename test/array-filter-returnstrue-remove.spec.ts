import { testState } from '../src/shared-state';
import { createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filterCustom().remove()', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq()', () => {
    const store = createGlobalStore(initialState);
    const where = (e: typeof initialState['array'][0]) => e.id === 2;
    store.get(s => s.array)
      .filterWhere(where).returnsTrue()
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[1]],
      where: where.toString(),
    });
    expect(store.read().array).toEqual([initialState.array[0], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('should ne()', () => {
    const store = createGlobalStore(initialState);
    const where = (e: typeof initialState['array'][0]) => e.id !== 2;
    store.get(s => s.array)
      .filterWhere(where).returnsTrue()
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[0], initialState.array[2]],
      where: where.toString(),
    });
    expect(store.read().array).toEqual([initialState.array[1]]);
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('should gt()', () => {
    const store = createGlobalStore(initialState);
    const where = (e: typeof initialState['array'][0]) => e.id > 1;
    store.get(s => s.array)
      .filterWhere(where).returnsTrue()
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[1], initialState.array[2]],
      where: where.toString(),
    });
    expect(store.read().array).toEqual([initialState.array[0]]);
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('should lt()', () => {
    const store = createGlobalStore(initialState);
    const where = (e: typeof initialState['array'][0]) => e.id < 2;
    store.get(s => s.array)
      .filterWhere(where).returnsTrue()
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[0]],
      where: where.toString(),
    });
    expect(store.read().array).toEqual([initialState.array[1], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('should in()', () => {
    const store = createGlobalStore(initialState);
    const where = (e: typeof initialState['array'][0]) => [1, 2].includes(e.id);
    store.get(s => s.array)
      .filterWhere(where).returnsTrue()
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[0], initialState.array[1]],
      where: where.toString(),
    });
    expect(store.read().array).toEqual([initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('should ni()', () => {
    const store = createGlobalStore(initialState);
    const where = (e: typeof initialState['array'][0]) => ![1, 2].includes(e.id);
    store.get(s => s.array)
      .filterWhere(where).returnsTrue()
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[2]],
      where: where.toString(),
    });
    expect(store.read().array).toEqual([initialState.array[0], initialState.array[1]]);
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('should match()', () => {
    const store = createGlobalStore(initialState);
    const where = (e: typeof initialState['array'][0]) => /^t/.test(e.value);
    store.get(s => s.array)
      .filterWhere(where).returnsTrue()
      .remove();
    expect(testState.currentAction).toEqual({
      type: 'array.filter().remove()',
      toRemove: [initialState.array[1], initialState.array[2]],
      where: where.toString(),
    });
    expect(store.read().array).toEqual([initialState.array[0]]);
    expect(testState.currentMutableState).toEqual(store.read());
  })

});