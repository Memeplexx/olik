import { createStore } from '../src/core';

describe('immutability', () => {

  const name = 'AppStore';

  const state = {
    object: { property: 'one', property2: 'two' },
    arr: [{id: 1, name: 'a'}],
  };

  it('should not be able to modify an object payload', () => {
    const store = createStore({ name, state });
    const payload = { property: 'a', property2: 'b' };
    store.object.$replace(payload);
    expect(() => payload.property = 'x').toThrow();
  })

  it('should not be able to modify an array element payload', () => {
    const store = createStore({ name, state });
    const payload = { id: 2, name: 'hey' };
    store.arr.$find.id.$eq(1).$replace(payload);
    expect(() => payload.name = 'XXX').toThrow();
  })

  it('should not be able to modify the payload root', () => {
    const store = createStore({ name, state });
    const payload = { id: 2, name: 'hey' };
    store.arr.$find.id.$eq(1).$replace(payload);
    expect(() => (store.$state as any).arr = []).toThrow();
  })

});
