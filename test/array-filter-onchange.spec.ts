import { set } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filter().onChange()', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should listen to onChange()', () => {
    const get = set(initialState);
    let changeCount = 0;
    get(s => s.array)
      .find(e => e.id).eq(3)
      .onChange(e => {
        changeCount++;
        expect(e.value).toEqual('three x');
      });
    get(s => s.array)
      .filter(e => e.id).eq(3)
      .patch({ value: 'three x' });
    get(s => s.array)
      .filter(e => e.id).eq(1)
      .patch({ value: 'one x' });
    expect(changeCount).toEqual(1);
  })

});