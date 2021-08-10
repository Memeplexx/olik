import { testState } from '../src/shared-state';
import { createApplicationStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Object', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: 'one', property2: 'two' },
  };

  it('should replace()', () => {
    const select = createApplicationStore(initialState);
    const payload = 'hey';
    select(s => s.object.property)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'object.property.replace()',
      replacement: payload,
    });
    expect(select().read().object.property).toEqual('hey');
    expect(select().read().object.property2 === initialState.object.property2).toBeTruthy();
  })

  it('should patch()', () => {
    const select = createApplicationStore(initialState);
    const payload = { property: 'xxx' };
    select(s => s.object)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'object.patch()',
      patch: payload,
    });
    expect(select().read().object.property).toEqual(payload.property);
    expect(select().read().object.property2 === initialState.object.property2).toBeTruthy();
  })

  it('should reset()', () => {
    const select = createApplicationStore(initialState);
    select(s => s.object.property)
      .replace('hey');
    expect(select().read().object.property).toEqual('hey');
    select(s => s.object.property)
      .reset();
    expect(select().read().object.property).toEqual('one');
    select().replace({ object: { property: 'xx', property2: 'yy' } });
    expect(select().read()).toEqual({ object: { property: 'xx', property2: 'yy' } });
    select().reset();
    expect(testState.currentAction).toEqual({
      type: 'reset()',
      replacement: initialState,
    })
    expect(select().read()).toEqual(initialState);
  })

  it('should be able to add a new property onto an object', () => {
    const select = createApplicationStore({} as { [key: string]: string });
    const payload = { hello: 'world' };
    select().patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'patch()',
      patch: payload,
    });
    expect(select().read()).toEqual({ hello: 'world' });
  })

  it('should be able to remove a key', () => {
    const select = createApplicationStore({ hello: 'one', world: 'two', another: 'three' });
    const payload = 'world';
    select().remove(payload);
    expect(testState.currentAction).toEqual({
      type: 'remove()',
      toRemove: payload,
    });
    expect(select().read()).toEqual({ hello: 'one', another: 'three' });
  })

  it('should be able to insert properties', () => {
    const initState = { one: 'one' };
    const select = createApplicationStore(initState);
    const insertion = { hello: 'test', another: 'testy' };
    select().insert(insertion);
    expect(testState.currentAction).toEqual({
      type: 'insert()',
      insertion,
    });
    expect(select().read()).toEqual({ ...initState, ...insertion });
  })

});
