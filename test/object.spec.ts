import { make, makeEnforceTags } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Object', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should REPLACE a node', () => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const get = make(initialState);
    const payload = 'hey';
    get(s => s.object.property).replace(payload);
    expect(get(s => s.object.property).read()).toEqual('hey');
    expect(get(s => s.object.property2).read() === initialState.object.property2).toBeTruthy();
    expect(tests.currentAction.type).toEqual('object.property.replace()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should PATCH an node', () => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const get = make(initialState);
    const payload = { property: 'xxx' };
    get(s => s.object).patch(payload);
    expect(get(s => s.object.property).read()).toEqual(payload.property);
    expect(get(s => s.object.property2).read() === initialState.object.property2).toBeTruthy();
    expect(tests.currentAction.type).toEqual('object.patch()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should RESET a node', () => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const get = make(initialState);
    get(s => s.object.property).replace('hey');
    expect(get(s => s.object.property).read()).toEqual('hey');
    expect(tests.currentMutableState).toEqual(get().read());
    get(s => s.object.property).reset();
    expect(get(s => s.object.property).read()).toEqual('hello');
    expect(tests.currentMutableState).toEqual(get().read());
    get().replace({ object: { property: 'xx', property2: 'yy' } });
    expect(get().read()).toEqual({ object: { property: 'xx', property2: 'yy' } });
    expect(tests.currentMutableState).toEqual(get().read());
    get().reset();
    expect(get().read()).toEqual(initialState);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should work with tags correctly', () => {
    const get = makeEnforceTags({
      object: { property: 'hello', property2: 'two' },
    });
    const payload = 'hey';
    const tag = 'mytag';
    get(s => s.object.property).replace(payload, tag);
    expect(tests.currentAction.type).toEqual(`object.property.replace() [${tag}]`);
    expect(get(s => s.object.property).read()).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should sanitize tags correctly', () => {
    const get = makeEnforceTags({
      test: '',
    }, {
      tagSanitizer: (tag) => tag + 'x',
    });
    const tag = 'mytag';
    get(s => s.test).replace('test', tag);
    expect(tests.currentAction.type).toEqual(`test.replace() [${tag}x]`);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should be able to add a new property onto an object', () => {
    const get = make({} as { [key: string]: string });
    get().patch({ hello: 'world' });
    expect(get().read()).toEqual({ hello: 'world' });
    expect(tests.currentMutableState).toEqual(get().read());
  })

});
