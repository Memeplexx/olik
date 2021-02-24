import { set } from '../src/store-creators';
import { libState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.find().read()', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should read()', () => {
    const select = set(initialState);
    const read = select(s => s.array)
      .whereOne(e => e.id).eq(2)
      .read();
    expect(read).toEqual(initialState.array[1]);
  })

  it('should onChange()', () => {
    const select = set(initialState);
    let changeCount = 0;
    select(s => s.array)
      .whereOne(e => e.id).eq(3)
      .onChange(e => {
        changeCount++;
        expect(e.value).toEqual('three x');
      });
    select(s => s.array)
      .whereOne(e => e.id).eq(3)
      .patch({ value: 'three x' });
    select(s => s.array)
      .whereOne(e => e.id).eq(1)
      .patch({ value: 'one x' });
    expect(changeCount).toEqual(1);
  })

});