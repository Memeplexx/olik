import { libState, testState } from '../src/shared-state';
import { createApplicationStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filter().ex().read()', () => {

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
      .filter(e => e.id === 2).ex()
      .read();
    expect(read).toEqual([initialState.array[1]]);
  })

  it('should onChange()', () => {
    const select = createApplicationStore(initialState);
    let changeCount = 0;
    select(s => s.array)
      .filter(e => e.id === 3).ex()
      .onChange(e => {
        changeCount++;
        expect(e).toEqual([{ id: 3, value: 'three x' }]);
      });
    select(s => s.array)
      .filter(e => e.id === 3).ex()
      .patch({ value: 'three x' });
    select(s => s.array)
      .filter(e => e.id === 1).ex()
      .patch({ value: 'one x' });
    expect(changeCount).toEqual(1);
  })

});