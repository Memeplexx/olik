import { set, setEnforceTags } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Object', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: 'one', property2: 'two' },
  };

  it('should replace()', () => {
    const get = set(initialState);
    const payload = 'hey';
    get(s => s.object.property)
      .replace(payload);
    expect(tests.currentAction).toEqual({
      type: 'object.property.replace()',
      replacement: payload,
    });
    expect(get(s => s.object.property).read()).toEqual('hey');
    expect(get(s => s.object.property2).read() === initialState.object.property2).toBeTruthy();
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should patch()', () => {
    const get = set(initialState);
    const payload = { property: 'xxx' };
    get(s => s.object)
      .patch(payload);
    expect(tests.currentAction).toEqual({
      type: 'object.patch()',
      patch: payload,
    });
    expect(get(s => s.object.property).read()).toEqual(payload.property);
    expect(get(s => s.object.property2).read() === initialState.object.property2).toBeTruthy();
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should reset()', () => {
    const get = set(initialState);
    get(s => s.object.property)
      .replace('hey');
    expect(get(s => s.object.property).read()).toEqual('hey');
    expect(tests.currentMutableState).toEqual(get().read());
    get(s => s.object.property)
      .reset();
    expect(get(s => s.object.property).read()).toEqual('one');
    expect(tests.currentMutableState).toEqual(get().read());
    get()
      .replace({ object: { property: 'xx', property2: 'yy' } });
    expect(get().read()).toEqual({ object: { property: 'xx', property2: 'yy' } });
    expect(tests.currentMutableState).toEqual(get().read());
    get()
      .reset();
    expect(tests.currentAction).toEqual({
      type: 'reset()',
      replacement: initialState,
    })
    expect(get().read()).toEqual(initialState);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replace() with a function', () => {
    const get = set({ prop: 'a' });
    get(s => s.prop)
      .replace(e => e + 'b');
    expect(tests.currentAction).toEqual({
      type: 'prop.replace()',
      replacement: 'ab',
    });
    expect(get().read()).toEqual({ prop: 'ab' });
    expect(tests.currentMutableState).toEqual({ prop: 'ab' });
  });

  it('should be able to add a new property onto an object', () => {
    const get = set({} as { [key: string]: string });
    const payload = { hello: 'world' };
    get().patch(payload);
    expect(tests.currentAction).toEqual({
      type: 'patch()',
      patch: payload,
    });
    expect(get().read()).toEqual({ hello: 'world' });
    expect(tests.currentMutableState).toEqual(get().read());
  })

});
