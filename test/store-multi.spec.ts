import { deriveFrom } from '../src/derive-from';
import { testState } from '../src/shared-state';
import { createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Multi-store', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should support multiple stores', () => {
    const store1 = createGlobalStore(new Array<string>());
    const store2 = createGlobalStore(0);
    store1.get().replaceAll(['one']);
    store2.get().replace(2);
    expect(store1.read()).toEqual(['one']);
    expect(store2.read()).toEqual(2);
  })

  it('should memoise using multiple stores', () => {
    const store1 = createGlobalStore({ array: new Array<number>(), string: '' });
    const store2 = createGlobalStore({ number: 0 });
    const mem = deriveFrom(
      store1.get(s => s.array),
      store2.get(s => s.number),
    ).usingExpensiveCalc((
      array, 
      number,
    ) => array.concat(number));
    let changes = 0;
    mem.onChange(() => changes++);
    store1.get(s => s.string).replace('hey');
    expect(changes).toEqual(0);
    expect(mem.read()).toEqual([0]);
    store1.get(s => s.array).insert([3]);
    expect(mem.read()).toEqual([3, 0]);
    expect(changes).toEqual(1);
  })

});