import { deriveFrom, make } from '../src';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Multi-store', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should support multiple stores', () => {
    const get1 = make(new Array<string>());
    const get2 = make(0);
    get1().replaceAll(['one']);
    get2().replace(2);
    expect(get1().read()).toEqual(['one']);
    expect(get2().read()).toEqual(2);
  })

  it('should memoise using multiple stores', () => {
    const get1 = make({ array: new Array<number>(), string: '' });
    const get2 = make({ number: 0 });
    const mem = deriveFrom(
      get1(s => s.array),
      get2(s => s.number),
    ).usingExpensiveCalc((
      array, 
      number,
    ) => array.concat(number));
    let changes = 0;
    mem.onChange(() => changes++);
    get1(s => s.string).replace('hey');
    expect(changes).toEqual(0);
    expect(mem.read()).toEqual([0]);
    get1(s => s.array).addAfter([3]);
    expect(mem.read()).toEqual([3, 0]);
    expect(changes).toEqual(1);
  })

});