import { libState, testState } from '../src/shared-state';
import { createApplicationStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('DeepMerge', () => {

  beforeAll(() => {
    testState.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  });

  it('should deepMerge properties', () => {
    const select = createApplicationStore({ some: { val: 'test' } });
    select(s => s.some).deepMerge({ val: 'another', num: 3 });
    expect(select().read()).toEqual({ some: { val: 'another', num: 3 } });
  })

  it('should deepMerge stores', () => {
    libState.applicationStore = null;
    const select1 = createApplicationStore({ some: { val: 'test' } });
    const select2 = createApplicationStore({ another: '' }, { mergeIntoExistingStoreIfItExists: true });
    expect(testState.currentAction).toEqual({ type: 'deepMerge()', toMerge: { another: '' } });
    expect(select1().read()).toEqual(select2().read());
    select2(s => s.another).replace('hello');
    expect(select1().read()).toEqual(select2().read());
    select1(s => s.some.val).replace('hello');
    expect(select1().read()).toEqual(select2().read());
  })

});
