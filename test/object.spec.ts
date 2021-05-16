import { testState } from '../src/shared-state';
import { createAppStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Object', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: 'one', property2: 'two' },
  };

  it('should replace()', () => {
    const { select, read } = createAppStore(initialState);
    const payload = 'hey';
    select(s => s.object.property)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'object.property.replace()',
      replacement: payload,
    });
    expect(read().object.property).toEqual('hey');
    expect(read().object.property2 === initialState.object.property2).toBeTruthy();
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should patch()', () => {
    const { select, read } = createAppStore(initialState);
    const payload = { property: 'xxx' };
    select(s => s.object)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'object.patch()',
      patch: payload,
    });
    expect(read().object.property).toEqual(payload.property);
    expect(read().object.property2 === initialState.object.property2).toBeTruthy();
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should reset()', () => {
    const { select, read } = createAppStore(initialState);
    select(s => s.object.property)
      .replace('hey');
    expect(read().object.property).toEqual('hey');
    expect(testState.currentMutableState).toEqual(read());
    select(s => s.object.property)
      .reset();
    expect(read().object.property).toEqual('one');
    expect(testState.currentMutableState).toEqual(read());
    select()
      .replace({ object: { property: 'xx', property2: 'yy' } });
    expect(read()).toEqual({ object: { property: 'xx', property2: 'yy' } });
    expect(testState.currentMutableState).toEqual(read());
    select()
      .reset();
    expect(testState.currentAction).toEqual({
      type: 'reset()',
      replacement: initialState,
    })
    expect(read()).toEqual(initialState);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should be able to add a new property onto an object', () => {
    const { select, read } = createAppStore({} as { [key: string]: string });
    const payload = { hello: 'world' };
    select().patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'patch()',
      patch: payload,
    });
    expect(read()).toEqual({ hello: 'world' });
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should be able to remove a key', () => {
    const { select, read } = createAppStore({ hello: 'one', world: 'two', another: 'three' });
    const payload = 'world';
    select().remove(payload);
    expect(testState.currentAction).toEqual({
      type: 'remove()',
      toRemove: payload,
    });
    expect(read()).toEqual({ hello: 'one', another: 'three' });
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should be able to insert properties', () => {
    const initState = { one: 'one' };
    const { select, read } = createAppStore(initState);
    const insertion = { hello: 'test', another: 'testy' };
    select().insert(insertion);
    expect(testState.currentAction).toEqual({
      type: 'insert()',
      insertion,
    });
    expect(read()).toEqual({ ...initState, ...insertion });
    expect(testState.currentMutableState).toEqual(read());
  })

});
