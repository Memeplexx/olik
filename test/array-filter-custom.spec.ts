import { set } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filterCustom()', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should replace()', () => {
    const get = set(initialState);
    const payload = { id: 5, value: 'hey' };
    const query = (a: typeof initialState['array'][0]) => a.id > 1;
    get(s => s.array)
      .filterCustom(query)
      .replace(payload);
    expect(get(s => s.array).read()).toEqual([initialState.array[0], payload, payload]);
    expect(tests.currentAction).toEqual({
      type: 'array.filterCustom().replace()',
      replacement: payload,
      query: query.toString(),
    })
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should patch()', () => {
    const get = set(initialState);
    const payload = { value: 'test' };
    const query = (a: typeof initialState['array'][0]) => a.id > 1;
    get(s => s.array)
      .filterCustom(query)
      .patch(payload);
    expect(get(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, { ...initialState.array[2], ...payload }]);
    expect(tests.currentAction).toEqual({
      type: 'array.filterCustom().patch()',
      patch: payload,
      query: query.toString(),
    })
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should remove()', () => {
    const get = set(initialState);
    const query = (a: typeof initialState['array'][0]) => a.id === 2;
    get(s => s.array)
      .filterCustom(query)
      .remove();
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 3, value: 'three' }]);
    expect(tests.currentAction).toEqual({
      type: 'array.filterCustom().remove()',
      toRemove: [{ id: 2, value: 'two' }],
      query: query.toString(),
    })
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should read()', () => {
    const get = set(initialState);
    const read = get(s => s.array)
      .filterCustom(e => e.id > 1)
      .read();
    expect(read).toEqual(initialState.array.slice(1));
  })

  it('should listen to onChange()', () => {
    const get = set(initialState);
    let changeCount = 0;
    get(s => s.array)
      .filterCustom(e => e.id > 1)
      .onChange(value => {
        changeCount++;
        expect(value).toEqual([{ id: 2, value: 'twoo' }, { id: 3, value: 'three' }])
      });
    get(s => s.object.property).replace('xx');
    get(s => s.array).find(s => s.id).eq(1).patch({ value: 'test' })
    get(s => s.array).find(s => s.id).eq(2).patch({ value: 'twoo' })
    expect(changeCount).toEqual(1);
  })

});
