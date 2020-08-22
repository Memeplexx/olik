import { make } from "../src";

describe('Object', () => {

  it('should REPLACE a node', () => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const store = make('state', initialState);
    store(s => s.object.property).replace('hey');
    expect(store().read().object.property).toEqual('hey');
    expect(store().read().object.property2 === initialState.object.property2).toBeTruthy();
  })

  it('should PATCH an node', () => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const store = make('state', initialState);
    store(s => s.object).patch({ property: 'xxx' });
    expect(store().read().object.property).toEqual('xxx');
    expect(store().read().object.property2 === initialState.object.property2).toBeTruthy();
  })

});
