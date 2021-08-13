import { libState, testState } from '../src/shared-state';
import { createApplicationStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Immutability', () => {

  beforeAll(() => {
    testState.windowObject = windowAugmentedWithReduxDevtoolsImpl
  });

  beforeEach(() => {
    libState.applicationStore = null;
  })

  const initialState = {
    object: { property: 'one', property2: 'two' },
    arr: [{id: 1, name: 'a'}],
  };

  it('should not be able to modify an object payload', () => {
    const select = createApplicationStore(initialState);
    const payload = { property: 'a', property2: 'b' };
    select(s => s.object).replace(payload);
    expect(() => payload.property = 'x').toThrow();
  })

  it('should not be able to modify an array element payload', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 2, name: 'hey' };
    select(s => s.arr).findWhere(s => s.id).eq(1).replace(payload);
    expect(() => payload.name = 'XXX').toThrow();
  })

  it('should not be able to modify the payload root', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 2, name: 'hey' };
    select(s => s.arr).findWhere(s => s.id).eq(1).replace(payload);
    expect(() => (select().read() as any).arr = []).toThrow();
  })

});
