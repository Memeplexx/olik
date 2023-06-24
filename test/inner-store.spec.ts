import { createStore } from '../src/core';

describe('immutability', () => {

  const name = 'AppStore';

  const state = {
    object: { property: 'one', property2: 'two' },
    arr: [{id: 1, name: 'a'}],
  };

  it('should not be able to modify an object payload', () => {
    // const store = createStore({ state });
    // const payload = { property: 'a', property2: 'b' };
    // store.object.$replace(payload);
    // expect(() => payload.property = 'x').toThrow();
  })

});
