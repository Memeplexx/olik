import { testState } from '../src/shared-state';
import { createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filterCustom().replace()', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq()', () => {
    const select = createGlobalStore(initialState);
    const payload = { id: 4, value: 'four' };
    const where = (e: typeof initialState['array'][0]) => e.id === 2;
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().replace()',
      replacement: payload,
      where: where.toString(),
    });
    expect(select().read().array).toEqual([initialState.array[0], payload, initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should ne()', () => {
    const select = createGlobalStore(initialState);
    const payload = { id: 4, value: 'four' };
    const where = (e: typeof initialState['array'][0]) => e.id !== 2;
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().replace()',
      replacement: payload,
      where: where.toString(),
    });
    expect(select().read().array).toEqual([payload, initialState.array[1], payload]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should gt()', () => {
    const select = createGlobalStore(initialState);
    const payload = { id: 4, value: 'four' };
    const where = (e: typeof initialState['array'][0]) => e.id > 1;
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().replace()',
      replacement: payload,
      where: where.toString(),
    });
    expect(select().read().array).toEqual([initialState.array[0], payload, payload]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should lt()', () => {
    const select = createGlobalStore(initialState);
    const payload = { id: 4, value: 'four' };
    const where = (e: typeof initialState['array'][0]) => e.id < 2;
    select(s => s.array)
      .filterWhere(e => e.id < 2).returnsTrue()
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().replace()',
      replacement: payload,
      where: where.toString(),
    });
    expect(select().read().array).toEqual([payload, initialState.array[1], initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should in()', () => {
    const select = createGlobalStore(initialState);
    const payload = { id: 4, value: 'four' };
    const where = (e: typeof initialState['array'][0]) => [1, 2].includes(e.id);
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().replace()',
      replacement: payload,
      where: where.toString(),
    });
    expect(select().read().array).toEqual([payload, payload, initialState.array[2]]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should ni()', () => {
    const select = createGlobalStore(initialState);
    const payload = { id: 4, value: 'four' };
    const where = (e: typeof initialState['array'][0]) => ![1, 2].includes(e.id);
    select(s => s.array)
      .filterWhere(e => ![1, 2].includes(e.id)).returnsTrue()
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().replace()',
      replacement: payload,
      where: where.toString(),
    });
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[1], payload]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should match()', () => {
    const select = createGlobalStore(initialState);
    const payload = { id: 4, value: 'four' };
    const where = (e: typeof initialState['array'][0]) => /^t/.test(e.value);
    select(s => s.array)
      .filterWhere(where).returnsTrue()
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'array.filter().replace()',
      replacement: payload,
      where: where.toString(),
    });
    expect(select().read().array).toEqual([initialState.array[0], payload, payload]);
    expect(testState.currentMutableState).toEqual(select().read());
  })

});