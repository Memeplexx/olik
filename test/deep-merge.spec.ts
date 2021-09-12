import { libState, testState } from '../src/shared-state';
import { createApplicationStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('DeepMerge', () => {

  beforeAll(() => {
    testState.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  });

  beforeEach(() => {
    libState.applicationStore = null;
  });

  it('should deepMerge properties', () => {
    const select = createApplicationStore({ some: { val: 'test' } });
    select(s => s.some).deepMerge({ val: 'another', num: 3 });
    expect(select().read()).toEqual({ some: { val: 'another', num: 3 } });
  })

  it('should deepMerge arrays', () => {
    const select = createApplicationStore({ some: { array: [1, 2, 3], num: 0 } });
    select(s => s.some).deepMerge({ array: [2, 3, 4], num: 1, str: 'sss' });
    expect(select().read()).toEqual({ some: { array: [ 2, 3, 4 ], num: 1, str: 'sss' } });
  })

  it('should deepMerge stores', () => {
    libState.applicationStore = null;
    const select1 = createApplicationStore({ some: { val: 'test' } });
    const select2 = createApplicationStore({ another: '' });
    expect(testState.currentAction).toEqual({ type: 'deepMerge()', toMerge: { another: '' } });
    expect(select1().read()).toEqual(select2().read());
    select2(s => s.another).replace('hello');
    expect(select1().read()).toEqual(select2().read());
    select1(s => s.some.val).replace('hello');
    expect(select1().read()).toEqual(select2().read());
  })

});
