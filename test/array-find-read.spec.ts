import { testState } from '../src/shared-state';
import { createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.find().read()', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should read()', () => {
    const store = createGlobalStore(initialState);
    const read = store.get(s => s.array)
      .findWhere(e => e.id).eq(2)
      .read();
    expect(read).toEqual(initialState.array[1]);
  })

  it('should onChange()', () => {
    const store = createGlobalStore(initialState);
    let changeCount = 0;
    store.get(s => s.array)
      .findWhere(e => e.id).eq(3)
      .onChange(e => {
        changeCount++;
        expect(e.value).toEqual('three x');
      });
    store.get(s => s.array)
      .findWhere(e => e.id).eq(3)
      .patch({ value: 'three x' });
    store.get(s => s.array)
      .findWhere(e => e.id).eq(1)
      .patch({ value: 'one x' });
    expect(changeCount).toEqual(1);
  })

});