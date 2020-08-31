import { make, tests } from "../src";

describe('Object', () => {

  it('should REPLACE a node', () => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const getStore = make('state', initialState);
    const payload = 'hey';
    getStore(s => s.object.property).replaceWith(payload);
    expect(getStore().read().object.property).toEqual('hey');
    expect(getStore().read().object.property2 === initialState.object.property2).toBeTruthy();
    expect(tests.currentAction.type).toEqual('object.property.replaceWith()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(getStore().read());
  })

  it('should PATCH an node', () => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const getStore = make('state', initialState);
    const payload = { property: 'xxx' };
    getStore(s => s.object).patchWith(payload);
    expect(getStore().read().object.property).toEqual(payload.property);
    expect(getStore().read().object.property2 === initialState.object.property2).toBeTruthy();
    expect(tests.currentAction.type).toEqual('object.patchWith()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(getStore().read());
  })

  it('should RESET a node', () => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const getStore = make('state', initialState);
    getStore(s => s.object.property).replaceWith('hey');
    expect(getStore(s => s.object.property).read()).toEqual('hey');
    expect(tests.currentMutableState).toEqual(getStore().read());
    getStore(s => s.object.property).reset();
    expect(getStore(s => s.object.property).read()).toEqual('hello');
    expect(tests.currentMutableState).toEqual(getStore().read());
    getStore().replaceWith({ object: { property: 'xx', property2: 'yy' } });
    expect(getStore().read()).toEqual({ object: { property: 'xx', property2: 'yy' } });
    expect(tests.currentMutableState).toEqual(getStore().read());
    getStore().reset();
    expect(getStore().read()).toEqual(initialState);
    expect(tests.currentMutableState).toEqual(getStore().read());
  })

});
