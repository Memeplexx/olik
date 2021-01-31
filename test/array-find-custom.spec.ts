import { set } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.findCustom()', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should replace()', () => {
    const get = set(initialState);
    const payload = { id: 5, value: 'hey' };
    const query = (a: typeof initialState['array'][0]) => a.id === 2;
    get(s => s.array)
      .findCustom(query)
      .replace(payload);
    expect(get(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
    expect(tests.currentAction).toEqual({
      type: 'array.findCustom().replace()',
      query: query.toString(),
      replacement: payload,
    })
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should patch()', () => {
    const get = set(initialState);
    const payload = { value: 'test' };
    const query = (a: typeof initialState['array'][0]) => a.id === 2;
    get(s => s.array)
      .findCustom(query)
      .patch(payload);
    expect(get(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
    expect(tests.currentAction).toEqual({
      type: 'array.findCustom().patch()',
      query: query.toString(),
      patch: payload,
    })
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should remove()', () => {
    const get = set(initialState);
    const query = (s: typeof initialState['array'][0]) => s.id === 2;
    get(s => s.array)
      .findCustom(query)
      .remove();
    expect(get(s => s.array).read()).toEqual([initialState.array[0], initialState.array[2]]);
    expect(tests.currentAction).toEqual({
      type: 'array.findCustom().remove()',
      toRemove: [{ id: 2, value: 'two' }],
      query: query.toString(),
    })
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should read()', () => {
    const get = set(initialState);
    const read = get(s => s.array)
      .findCustom(e => e.id === 2)
      .read();
    expect(read).toEqual(initialState.array[1]);
  })

  it('should listen to onChange()', () => {
    const get = set(initialState);
    let changeCount = 0;
    get(s => s.array)
      .findCustom(e => e.id === 2)
      .onChange(value => {
        changeCount++;
        expect(value).toEqual({ id: 2, value: 'twoo' })
      });
    get(s => s.object.property).replace('xx');
    get(s => s.array).find(s => s.id).eq(1).patch({ value: 'test' })
    get(s => s.array).find(s => s.id).eq(2).patch({ value: 'twoo' })
    expect(changeCount).toEqual(1);
  })

});
