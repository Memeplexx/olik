import { deriveFrom } from '../src/derive-from';
import { libState, testState } from '../src/shared-state';
import { createApplicationStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Multi-store', () => {

  beforeAll(() => {
    testState.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  });

  beforeEach(() => {
    libState.applicationStore = null;
  })

  // it('should support multiple stores', () => {
  //   const store1 = createApplicationStore(new Array<string>());
  //   const store2 = createApplicationStore(0);
  //   store1().replaceAll(['one']);
  //   store2().replace(2);
  //   expect(store1().read()).toEqual(['one']);
  //   expect(store2().read()).toEqual(2);
  // })

  it('should memoise using multiple stores', () => {
    const select1 = createApplicationStore({ array: new Array<number>(), string: '' });
    const select2 = createApplicationStore({ number: 0 });
    const mem = deriveFrom(
      select1(s => s.array),
      select2(s => s.number),
    ).usingExpensiveCalc((
      array, 
      number,
    ) => array.concat(number));
    let changes = 0;
    mem.onChange(() => changes++);
    select1(s => s.string).replace('hey');
    expect(changes).toEqual(0);
    expect(mem.read()).toEqual([0]);
    select1(s => s.array).insert([3]);
    expect(mem.read()).toEqual([3, 0]);
    expect(changes).toEqual(1);
  })

});