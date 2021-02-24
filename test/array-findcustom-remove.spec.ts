import { set } from '../src/store-creators';
import { libState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.findCustom().remove()', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq()', () => {
    const select = set(initialState);
    const query = (e: typeof initialState['array'][0]) => e.id === 2;
    select(s => s.array)
      .find(query)
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[1],
      query: query.toString(),
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should ne()', () => {
    const select = set(initialState);
    const query = (e: typeof initialState['array'][0]) => e.id !== 2;
    select(s => s.array)
      .find(query)
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[0],
      query: query.toString(),
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[1], initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should gt()', () => {
    const select = set(initialState);
    const query = (e: typeof initialState['array'][0]) => e.id > 1;
    select(s => s.array)
      .find(query)
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[1],
      query: query.toString(),
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should lt()', () => {
    const select = set(initialState);
    const query = (e: typeof initialState['array'][0]) => e.id < 2;
    select(s => s.array)
      .find(query)
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[0],
      query: query.toString(),
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[1], initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should in()', () => {
    const select = set(initialState);
    const query = (e: typeof initialState['array'][0]) => [1, 2].includes(e.id);
    select(s => s.array)
      .find(query)
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[0],
      query: query.toString(),
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[1], initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should ni()', () => {
    const select = set(initialState);
    const query = (e: typeof initialState['array'][0]) => ![1, 2].includes(e.id);
    select(s => s.array)
      .find(query)
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[2],
      query: query.toString(),
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], initialState.array[1]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should match()', () => {
    const select = set(initialState);
    const query = (e: typeof initialState['array'][0]) => /^t/.test(e.value);
    select(s => s.array)
      .find(query)
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.find().remove()',
      toRemove: initialState.array[1],
      query: query.toString(),
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

});