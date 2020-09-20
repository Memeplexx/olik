import { make } from '../src';
import { deriveFrom } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Multi-store', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should support multiple stores', () => {
    const getStore1 = make('store-1', new Array<string>());
    const getStore2 = make('store-2', 0);
    getStore1().replaceAll(['one']);
    getStore2().replaceWith(2);
    expect(getStore1().read()).toEqual(['one']);
    expect(getStore2().read()).toEqual(2);
  })

  it('should memoise using multiple stores', () => {
    const getStore1 = make('store-1', { array: new Array<number>(), string: '' });
    const getStore2 = make('store-2', { number: 0 });
    const mem = deriveFrom(
      getStore1(s => s.array),
      getStore2(s => s.number),
    ).usingExpensiveCalc((
      array, 
      number,
    ) => array.concat(number));
    let changes = 0;
    mem.onChange(() => changes++);
    getStore1(s => s.string).replaceWith('hey');
    expect(changes).toEqual(0);
    expect(mem.read()).toEqual([0]);
    getStore1(s => s.array).addAfter([3]);
    expect(mem.read()).toEqual([3, 0]);
    expect(changes).toEqual(1);
  })

});