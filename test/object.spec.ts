import { make, makeEnforceTags } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Object', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should REPLACE a node', () => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const store = make(initialState);
    const payload = 'hey';
    store(s => s.object.property).replaceWith(payload);
    expect(store(s => s.object.property).read()).toEqual('hey');
    expect(store(s => s.object.property2).read() === initialState.object.property2).toBeTruthy();
    expect(tests.currentAction.type).toEqual('object.property.replaceWith()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should PATCH an node', () => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const store = make(initialState);
    const payload = { property: 'xxx' };
    store(s => s.object).patchWith(payload);
    expect(store(s => s.object.property).read()).toEqual(payload.property);
    expect(store(s => s.object.property2).read() === initialState.object.property2).toBeTruthy();
    expect(tests.currentAction.type).toEqual('object.patchWith()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should RESET a node', () => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const store = make(initialState);
    store(s => s.object.property).replaceWith('hey');
    expect(store(s => s.object.property).read()).toEqual('hey');
    expect(tests.currentMutableState).toEqual(store().read());
    store(s => s.object.property).reset();
    expect(store(s => s.object.property).read()).toEqual('hello');
    expect(tests.currentMutableState).toEqual(store().read());
    store().replaceWith({ object: { property: 'xx', property2: 'yy' } });
    expect(store().read()).toEqual({ object: { property: 'xx', property2: 'yy' } });
    expect(tests.currentMutableState).toEqual(store().read());
    store().reset();
    expect(store().read()).toEqual(initialState);
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should work with tags correctly', () => {
    const store = makeEnforceTags({
      object: { property: 'hello', property2: 'two' },
    });
    const payload = 'hey';
    const tag = 'mytag';
    store(s => s.object.property).replaceWith(payload, tag);
    expect(tests.currentAction.type).toEqual(`object.property.replaceWith() [${tag}]`);
    expect(store(s => s.object.property).read()).toEqual(payload);
  })

});
