import { deriveFrom } from '../src/derive-from';
import { set } from '../src/store-creators';
import { libState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Multi-store', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should support multiple stores', () => {
    const select1 = set(new Array<string>());
    const select2 = set(0);
    select1().replaceAll(['one']);
    select2().replace(2);
    expect(select1().read()).toEqual(['one']);
    expect(select2().read()).toEqual(2);
  })

  it('should memoise using multiple stores', () => {
    const select1 = set({ array: new Array<number>(), string: '' });
    const select2 = set({ number: 0 });
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