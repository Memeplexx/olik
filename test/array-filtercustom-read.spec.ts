import { set } from '../src/store-creators';
import { libState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filterCustom().read()', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should read()', () => {
    const select = set(initialState);
    const read = select(s => s.array)
      .filter(e => e.id === 2)
      .read();
    expect(read).toEqual([initialState.array[1]]);
  })

  it('should onChange()', () => {
    const select = set(initialState);
    let changeCount = 0;
    select(s => s.array)
      .filter(e => e.id === 3)
      .onChange(e => {
        changeCount++;
        expect(e).toEqual([{ id: 3, value: 'three x' }]);
      });
    select(s => s.array)
      .filter(e => e.id === 3)
      .patch({ value: 'three x' });
    select(s => s.array)
      .filter(e => e.id === 1)
      .patch({ value: 'one x' });
    expect(changeCount).toEqual(1);
  })

});