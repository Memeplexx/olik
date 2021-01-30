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
    get(s => s.object.property).replace(payload);
    expect(get(s => s.object.property).read()).toEqual('hey');
    expect(get(s => s.object.property2).read() === initialState.object.property2).toBeTruthy();
    expect(tests.currentAction).toEqual({
      type: 'object.property.replace()',
      payload: {
        replacement: payload,
      }
    })
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should patch()', () => {
    const get = set(initialState);
    const payload = { property: 'xxx' };
    get(s => s.object).patch(payload);
    expect(get(s => s.object.property).read()).toEqual(payload.property);
    expect(get(s => s.object.property2).read() === initialState.object.property2).toBeTruthy();
    expect(tests.currentAction).toEqual({
      type: 'object.patch()',
      payload: {
        patch: payload,
      }
    })
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should reset()', () => {
    const get = set(initialState);
    get(s => s.object.property).replace('hey');
    expect(get(s => s.object.property).read()).toEqual('hey');
    expect(tests.currentMutableState).toEqual(get().read());
    get(s => s.object.property).reset();
    expect(get(s => s.object.property).read()).toEqual('one');
    expect(tests.currentMutableState).toEqual(get().read());
    get().replace({ object: { property: 'xx', property2: 'yy' } });
    expect(get().read()).toEqual({ object: { property: 'xx', property2: 'yy' } });
    expect(tests.currentMutableState).toEqual(get().read());
    get().reset();
    expect(get().read()).toEqual(initialState);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replace() with a function', () => {
    const get = set({ prop: 'a' });
    get(s => s.prop).replace(e => e + 'b');
    expect(get().read()).toEqual({ prop: 'ab' });
    expect(tests.currentMutableState).toEqual({ prop: 'ab' });
    expect(tests.currentAction).toEqual({
      type: 'prop.replace()',
      payload: {
        replacement: 'ab',
      },
    });
  });

  it('should work with tags correctly', () => {
    const payload = 'hey';
    const tag = 'mytag';
    const get = setEnforceTags(initialState);
    get(s => s.object.property).replace(payload, tag);
    expect(tests.currentAction).toEqual({
      type: `object.property.replace() [${tag}]`,
      payload: {
        replacement: payload,
      }
    });
    expect(get(s => s.object.property).read()).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should sanitize tags correctly', () => {
    const get = setEnforceTags({
      test: '',
    }, {
      tagSanitizer: (tag) => tag + 'x',
    });
    const tag = 'mytag';
    const payload = 'test' ;
    get(s => s.test).replace(payload, tag);
    expect(tests.currentAction).toEqual({
      type: `test.replace() [${tag}x]`,
      payload: {
        replacement: payload,
      }
    });
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should be able to add a new property onto an object', () => {
    const get = set({} as { [key: string]: string });
    const payload = { hello: 'world' };
    get().patch(payload);
    expect(get().read()).toEqual({ hello: 'world' });
    expect(tests.currentAction).toEqual({
      type: 'patch()',
      payload: {
        patch: payload,
      }
    });
  })

});
