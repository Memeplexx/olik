import { make } from "../src";

describe('Object', () => {

  it('should REPLACE a node', () => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const getStore = make('state', initialState);
    getStore(s => s.object.property).replaceWith('hey');
    expect(getStore().read().object.property).toEqual('hey');
    expect(getStore().read().object.property2 === initialState.object.property2).toBeTruthy();
  })

  it('should PATCH an node', () => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const getStore = make('state', initialState);
    getStore(s => s.object).patchWith({ property: 'xxx' });
    expect(getStore().read().object.property).toEqual('xxx');
    expect(getStore().read().object.property2 === initialState.object.property2).toBeTruthy();
  })

  it('should RESET a node', () => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const getStore = make('state', initialState);
    getStore(s => s.object.property).replaceWith('hey');
    expect(getStore(s => s.object.property).read()).toEqual('hey')
    getStore(s => s.object.property).reset();
    expect(getStore(s => s.object.property).read()).toEqual('hello');
    getStore().replaceWith({ object: { property: 'xx', property2: 'yy' } });
    expect(getStore().read()).toEqual({ object: { property: 'xx', property2: 'yy' } });
    getStore().reset();
    expect(getStore().read()).toEqual(initialState);
  })

});
