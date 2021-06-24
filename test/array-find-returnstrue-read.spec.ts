import { testState } from '../src/shared-state';
import { createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.findCustom().read()', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should read()', () => {
    const { get } = createGlobalStore(initialState);
    const read = get(s => s.array)
      .findWhere(e => e.id === 2).returnsTrue()
      .read();
    expect(read).toEqual(initialState.array[1]);
  })

  it('should onChange()', () => {
    const { get } = createGlobalStore(initialState);
    let changeCount = 0;
    get(s => s.array)
      .findWhere(e => e.id === 3).returnsTrue()
      .onChange(e => {
        changeCount++;
        expect(e.value).toEqual('three x');
      });
    get(s => s.array)
      .findWhere(e => e.id === 3).returnsTrue()
      .patch({ value: 'three x' });
    get(s => s.array)
      .findWhere(e => e.id === 1).returnsTrue()
      .patch({ value: 'one x' });
    expect(changeCount).toEqual(1);
  })

});