import { testState } from '../src/shared-state';
import { createApplicationStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Object', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: 'one', property2: 'two' },
    arr: [{id: 1, name: 'a'}],
  };

  it('should replace()', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 2, name: 'hey' };
    select(s => s.arr).findWhere(s => s.id).eq(1).replace(payload);
    // payload.property = 'xxx';
    // payload.name = 'ss';
  })


});
