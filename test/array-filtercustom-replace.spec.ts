import { set } from '../src/store-creators';
import { libState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filterCustom().replace()', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq()', () => {
    const get = set(initialState);
    const payload = { id: 4, value: 'four' };
    const query = (e: typeof initialState['array'][0]) => e.id === 2;
    get(s => s.array)
      .filterCustom(query)
      .replace(payload);
    expect(libState.currentAction).toEqual({
      type: 'array.filterCustom().replace()',
      replacement: payload,
      query: query.toString(),
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('should ne()', () => {
    const get = set(initialState);
    const payload = { id: 4, value: 'four' };
    const query = (e: typeof initialState['array'][0]) => e.id !== 2;
    get(s => s.array)
      .filterCustom(query)
      .replace(payload);
    expect(libState.currentAction).toEqual({
      type: 'array.filterCustom().replace()',
      replacement: payload,
      query: query.toString(),
    });
    expect(get(s => s.array).read()).toEqual([payload, initialState.array[1], payload]);
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('should gt()', () => {
    const get = set(initialState);
    const payload = { id: 4, value: 'four' };
    const query = (e: typeof initialState['array'][0]) => e.id > 1;
    get(s => s.array)
      .filterCustom(query)
      .replace(payload);
    expect(libState.currentAction).toEqual({
      type: 'array.filterCustom().replace()',
      replacement: payload,
      query: query.toString(),
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[0], payload, payload]);
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('should lt()', () => {
    const get = set(initialState);
    const payload = { id: 4, value: 'four' };
    const query = (e: typeof initialState['array'][0]) => e.id < 2;
    get(s => s.array)
      .filterCustom(e => e.id < 2)
      .replace(payload);
    expect(libState.currentAction).toEqual({
      type: 'array.filterCustom().replace()',
      replacement: payload,
      query: query.toString(),
    });
    expect(get(s => s.array).read()).toEqual([payload, initialState.array[1], initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('should in()', () => {
    const get = set(initialState);
    const payload = { id: 4, value: 'four' };
    const query = (e: typeof initialState['array'][0]) => [1, 2].includes(e.id);
    get(s => s.array)
      .filterCustom(query)
      .replace(payload);
    expect(libState.currentAction).toEqual({
      type: 'array.filterCustom().replace()',
      replacement: payload,
      query: query.toString(),
    });
    expect(get(s => s.array).read()).toEqual([payload, payload, initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('should ni()', () => {
    const get = set(initialState);
    const payload = { id: 4, value: 'four' };
    const query = (e: typeof initialState['array'][0]) => ![1, 2].includes(e.id);
    get(s => s.array)
      .filterCustom(e => ![1, 2].includes(e.id))
      .replace(payload);
    expect(libState.currentAction).toEqual({
      type: 'array.filterCustom().replace()',
      replacement: payload,
      query: query.toString(),
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[0], initialState.array[1], payload]);
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('should match()', () => {
    const get = set(initialState);
    const payload = { id: 4, value: 'four' };
    const query = (e: typeof initialState['array'][0]) => /^t/.test(e.value);
    get(s => s.array)
      .filterCustom(query)
      .replace(payload);
    expect(libState.currentAction).toEqual({
      type: 'array.filterCustom().replace()',
      replacement: payload,
      query: query.toString(),
    });
    expect(get(s => s.array).read()).toEqual([initialState.array[0], payload, payload]);
    expect(libState.currentMutableState).toEqual(get().read());
  })

});