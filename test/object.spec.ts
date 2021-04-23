import { testState } from '../src/shared-state';
import { store } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Object', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: 'one', property2: 'two' },
  };

  it('should replace()', () => {
    const select = store(initialState);
    const payload = 'hey';
    select(s => s.object.property)
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'object.property.replace()',
      replacement: payload,
    });
    expect(select(s => s.object.property).read()).toEqual('hey');
    expect(select(s => s.object.property2).read() === initialState.object.property2).toBeTruthy();
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should patch()', () => {
    const select = store(initialState);
    const payload = { property: 'xxx' };
    select(s => s.object)
      .patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'object.patch()',
      patch: payload,
    });
    expect(select(s => s.object.property).read()).toEqual(payload.property);
    expect(select(s => s.object.property2).read() === initialState.object.property2).toBeTruthy();
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should reset()', () => {
    const select = store(initialState);
    select(s => s.object.property)
      .replace('hey');
    expect(select(s => s.object.property).read()).toEqual('hey');
    expect(testState.currentMutableState).toEqual(select().read());
    select(s => s.object.property)
      .reset();
    expect(select(s => s.object.property).read()).toEqual('one');
    expect(testState.currentMutableState).toEqual(select().read());
    select()
      .replace({ object: { property: 'xx', property2: 'yy' } });
    expect(select().read()).toEqual({ object: { property: 'xx', property2: 'yy' } });
    expect(testState.currentMutableState).toEqual(select().read());
    select()
      .reset();
    expect(testState.currentAction).toEqual({
      type: 'reset()',
      replacement: initialState,
    })
    expect(select().read()).toEqual(initialState);
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should be able to add a new property onto an object', () => {
    const select = store({} as { [key: string]: string });
    const payload = { hello: 'world' };
    select().patch(payload);
    expect(testState.currentAction).toEqual({
      type: 'patch()',
      patch: payload,
    });
    expect(select().read()).toEqual({ hello: 'world' });
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should be able to remove a key', () => {
    const select = store({ hello: 'one', world: 'two', another: 'three' });
    const payload = 'world';
    select().remove(payload);
    expect(testState.currentAction).toEqual({
      type: 'remove()',
      toRemove: payload,
    });
    expect(select().read()).toEqual({ hello: 'one', another: 'three' });
    expect(testState.currentMutableState).toEqual(select().read());
  })

  it('should be able to insert properties', () => {
    const initState = { one: 'one' };
    const select = store(initState);
    const insertion = { hello: 'test', another: 'testy' };
    select().insert(insertion);
    expect(testState.currentAction).toEqual({
      type: 'insert()',
      insertion,
    });
    expect(select().read()).toEqual({ ...initState, ...insertion });
    expect(testState.currentMutableState).toEqual(select().read());
  })




  // it('', () => {
  //   const select = store({ hello: { world: { one: 'one', two: 'two' } } });
  //   select(s => s.hello.world).remove('one');
  //   console.log('.........', select((select() as any).getSelector()).read());
  // })

});
