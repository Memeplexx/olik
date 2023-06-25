import { errorMessages, libState, testState } from '../src/constant';
import { createStore } from '../src/core';
import { Store } from '../src/type';
import { resetLibraryState } from '../src/utility';

describe('inner store', () => {

  const key = 'inner';
  const innerState = { hello: 'world', num: 0 };

  const state = {
    object: { property: 'one', property2: 'two' },
    arr: [{ id: 1, name: 'a' }],
  };

  beforeEach(() => {
    resetLibraryState();
  })

  it('should be able to perform a basic update', () => {
    const store = createStore({ state });
    const inner = createStore({ state: innerState, key });
    expect(store.$state).toEqual({ ...state, [key]: innerState });
    inner.hello.$replace('another');
    expect(store.$state).toEqual({ ...state, [key]: { ...innerState, hello: 'another' } });
  })

  it('root store should be able to receive onChange events', () => {
    const store = createStore({ state });
    const inner = createStore({ state: innerState, key });
    let numChanges = 0;
    store.$onChange(change => numChanges++);
    inner.hello.$replace('another');
    expect(numChanges).toEqual(1);
  })

  it('inner store should be able to receive onChange events', () => {
    const store = createStore({ state });
    const inner = createStore({ state: innerState, key });
    let numChanges = 0;
    inner.$onChange(change => {
      expect(change).toEqual({ ...innerState, hello: 'another' });
      numChanges++;
    });
    inner.hello.$replace('another');
    expect(numChanges).toEqual(1);
  })

  it('should be able to detach an inner store', () => {
    const store = createStore({ state });
    const inner = createStore({ state: innerState, key });
    let numChanges = 0;
    store.$onChange(change => {
      numChanges++;
    });
    inner.$detachStore();
    expect(store.$state).toEqual(state);
    expect(numChanges).toEqual(1);
  })

  it('should be able to update the inner store from the outer store', () => {
    const store = createStore({ state });
    const inner = createStore({ state: innerState, key });
    const storeTyped = store as Store<typeof state & { inner: typeof innerState }>;
    storeTyped.inner.hello.$replace('another');
    expect(store.$state).toEqual({ ...state, [key]: { ...innerState, hello: 'another' } });
  });

  it('should be able to create a detached store', () => {
    const inner = createStore({ state: innerState, key });
    expect(libState.store.$state).toEqual({[key]: innerState});
  })

  it('should throw an error if the user attempts to override an existing store', () => {
    const store = createStore({ state });
    const store2 = createStore({ state: innerState });
    expect(store.$state).toEqual({ ...state, ...innerState });
    expect(store2.$state).toEqual({ ...state, ...innerState });
  })

  it('should throw an error if the containing stores state is a primitive', () => {
    createStore({ state: 0 });
    testState.logLevel = 'debug';
    expect(() => createStore({ state: 0, key }))
      .toThrow(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
  })

  it('should throw an error if the containing stores state is an array', () => {
    createStore({ state: new Array<string>() });
    expect(() => createStore({ state: 0, key }))
      .toThrow(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
  })

  it('should throw an error if the user tries to create an inner store with a key that already exists in the outer store', () => {
    createStore({ state: { test: '' } });
    expect(() => createStore({ state: {}, key: 'test' }))
      .toThrow(errorMessages.KEY_ALREADY_IN_USE('test'));
  })

});
