import { deriveFrom, make } from '../src';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Multi-store', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should support multiple stores', () => {
    const store1 = make(new Array<string>());
    const store2 = make(0);
    store1().replaceAll(['one']);
    store2().replaceWith(2);
    expect(store1().read()).toEqual(['one']);
    expect(store2().read()).toEqual(2);
  })

  it('should memoise using multiple stores', () => {
    const store1 = make({ array: new Array<number>(), string: '' });
    const store2 = make({ number: 0 });
    const mem = deriveFrom(
      store1(s => s.array),
      store2(s => s.number),
    ).usingExpensiveCalc((
      array, 
      number,
    ) => array.concat(number));
    let changes = 0;
    mem.onChange(() => changes++);
    store1(s => s.string).replaceWith('hey');
    expect(changes).toEqual(0);
    expect(mem.read()).toEqual([0]);
    store1(s => s.array).addAfter([3]);
    expect(mem.read()).toEqual([3, 0]);
    expect(changes).toEqual(1);
  })

});