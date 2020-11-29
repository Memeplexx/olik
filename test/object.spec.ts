import { make, makeEnforceTags } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Object', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should REPLACE a node', () => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const select = make(initialState);
    const payload = 'hey';
    select(s => s.object.property).replaceWith(payload);
    expect(select(s => s.object.property).read()).toEqual('hey');
    expect(select(s => s.object.property2).read() === initialState.object.property2).toBeTruthy();
    expect(tests.currentAction.type).toEqual('object.property.replaceWith()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(select().read());
  })

  it('should PATCH an node', () => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const select = make(initialState);
    const payload = { property: 'xxx' };
    select(s => s.object).patchWith(payload);
    expect(select(s => s.object.property).read()).toEqual(payload.property);
    expect(select(s => s.object.property2).read() === initialState.object.property2).toBeTruthy();
    expect(tests.currentAction.type).toEqual('object.patchWith()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(select().read());
  })

  it('should RESET a node', () => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const select = make(initialState);
    select(s => s.object.property).replaceWith('hey');
    expect(select(s => s.object.property).read()).toEqual('hey');
    expect(tests.currentMutableState).toEqual(select().read());
    select(s => s.object.property).reset();
    expect(select(s => s.object.property).read()).toEqual('hello');
    expect(tests.currentMutableState).toEqual(select().read());
    select().replaceWith({ object: { property: 'xx', property2: 'yy' } });
    expect(select().read()).toEqual({ object: { property: 'xx', property2: 'yy' } });
    expect(tests.currentMutableState).toEqual(select().read());
    select().reset();
    expect(select().read()).toEqual(initialState);
    expect(tests.currentMutableState).toEqual(select().read());
  })

  it('should work with tags correctly', () => {
    const select = makeEnforceTags({
      object: { property: 'hello', property2: 'two' },
    });
    const payload = 'hey';
    const tag = 'mytag';
    select(s => s.object.property).replaceWith(payload, tag);
    expect(tests.currentAction.type).toEqual(`object.property.replaceWith() [${tag}]`);
    expect(select(s => s.object.property).read()).toEqual(payload);
  })

  it('should sanitize tags correctly', () => {
    const select = makeEnforceTags({
      test: '',
    }, {
      tagSanitizer: (tag) => tag + 'x',
    });
    const tag = 'mytag';
    select(s => s.test).replaceWith('test', tag);
    expect(tests.currentAction.type).toEqual(`test.replaceWith() [${tag}x]`);
  })

  it('should be able to add a new property onto an object', () => {
    const select = make({} as { [key: string]: string });
    select().patchWith({ hello: 'world' });
    expect(select().read()).toEqual({ hello: 'world' });
  })

});
