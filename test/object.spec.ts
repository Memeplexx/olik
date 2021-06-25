import { testState } from '../src/shared-state';
import { createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Object', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: 'one', property2: 'two' },
  };

  it('should replace()', () => {
    const store = createGlobalStore(initialState);
    const payload = 'hey';
    store.get(s => s.object.property)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'object.property.replace()',
      replacement: payload,
    });
    expect(store.read().object.property).toEqual('hey');
    expect(store.read().object.property2 === initialState.object.property2).toBeTruthy();
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('should patch()', () => {
    const store = createGlobalStore(initialState);
    const payload = { property: 'xxx' };
    store.get(s => s.object)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'object.patch()',
      patch: payload,
    });
    expect(store.read().object.property).toEqual(payload.property);
    expect(store.read().object.property2 === initialState.object.property2).toBeTruthy();
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('should reset()', () => {
    const store = createGlobalStore(initialState);
    store.get(s => s.object.property)
      .replace('hey');
    expect(store.read().object.property).toEqual('hey');
    expect(testState.currentMutableState).toEqual(store.read());
    store.get(s => s.object.property)
      .reset();
    expect(store.read().object.property).toEqual('one');
    expect(testState.currentMutableState).toEqual(store.read());
    store.replace({ object: { property: 'xx', property2: 'yy' } });
    expect(store.read()).toEqual({ object: { property: 'xx', property2: 'yy' } });
    expect(testState.currentMutableState).toEqual(store.read());
    store.reset();
    expect(testState.currentAction).toEqual({
      type: 'reset()',
      replacement: initialState,
    })
    expect(store.read()).toEqual(initialState);
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('should be able to add a new property onto an object', () => {
    const store = createGlobalStore({} as { [key: string]: string });
    const payload = { hello: 'world' };
    store.patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'patch()',
      patch: payload,
    });
    expect(store.read()).toEqual({ hello: 'world' });
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('should be able to remove a key', () => {
    const store = createGlobalStore({ hello: 'one', world: 'two', another: 'three' });
    const payload = 'world';
    store.remove(payload);
    expect(testState.currentAction).toEqual({
      type: 'remove()',
      toRemove: payload,
    });
    expect(store.read()).toEqual({ hello: 'one', another: 'three' });
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('should be able to insert properties', () => {
    const initState = { one: 'one' };
    const store = createGlobalStore(initState);
    const insertion = { hello: 'test', another: 'testy' };
    store.insert(insertion);
    expect(testState.currentAction).toEqual({
      type: 'insert()',
      insertion,
    });
    expect(store.read()).toEqual({ ...initState, ...insertion });
    expect(testState.currentMutableState).toEqual(store.read());
  })

});
