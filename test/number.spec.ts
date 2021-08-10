import { testState } from '../src/shared-state';
import { createApplicationStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Number', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: 1 },
  };

  it('should increment()', () => {
    const select = createApplicationStore(initialState);
    const payload = 5;
    select(s => s.object.property)
      .increment(payload);
    expect(select(s => s.object.property).read()).toEqual(6);
    expect(testState.currentAction).toEqual({
      type: 'object.property.increment()',
      incrementBy: payload,
    });
  })

});
