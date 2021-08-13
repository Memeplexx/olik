import { libState, testState } from '../src/shared-state';
import { createApplicationStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.find().returnsTrue().read()', () => {

  beforeAll(() => {
    testState.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  });

  beforeEach(() => {
    libState.applicationStore = null;
  })

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should read()', () => {
    const select = createApplicationStore(initialState);
    const read = select(s => s.array)
      .findWhere(e => e.id === 2).returnsTrue()
      .read();
    expect(read).toEqual(initialState.array[1]);
  })

  it('should onChange()', () => {
    const select = createApplicationStore(initialState);
    let changeCount = 0;
    select(s => s.array)
      .findWhere(e => e.id === 3).returnsTrue()
      .onChange(e => {
        changeCount++;
        expect(e.value).toEqual('three x');
      });
    select(s => s.array)
      .findWhere(e => e.id === 3).returnsTrue()
      .patch({ value: 'three x' });
    select(s => s.array)
      .findWhere(e => e.id === 1).returnsTrue()
      .patch({ value: 'one x' });
    expect(changeCount).toEqual(1);
  })

});