import { libState } from '../src/shared-state';
import { set } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Object', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: 'one', property2: 'two' },
  };

  it('should replace()', () => {
    const select = set(initialState);
    const payload = 'hey';
    select(s => s.object.property)
      .replace(payload);
    expect(libState.currentAction).toEqual({
      type: 'object.property.replace()',
      replacement: payload,
    });
    expect(select(s => s.object.property).read()).toEqual('hey');
    expect(select(s => s.object.property2).read() === initialState.object.property2).toBeTruthy();
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should patch()', () => {
    const select = set(initialState);
    const payload = { property: 'xxx' };
    select(s => s.object)
      .patch(payload);
    expect(libState.currentAction).toEqual({
      type: 'object.patch()',
      patch: payload,
    });
    expect(select(s => s.object.property).read()).toEqual(payload.property);
    expect(select(s => s.object.property2).read() === initialState.object.property2).toBeTruthy();
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should reset()', () => {
    const select = set(initialState);
    select(s => s.object.property)
      .replace('hey');
    expect(select(s => s.object.property).read()).toEqual('hey');
    expect(libState.currentMutableState).toEqual(select().read());
    select(s => s.object.property)
      .reset();
    expect(select(s => s.object.property).read()).toEqual('one');
    expect(libState.currentMutableState).toEqual(select().read());
    select()
      .replace({ object: { property: 'xx', property2: 'yy' } });
    expect(select().read()).toEqual({ object: { property: 'xx', property2: 'yy' } });
    expect(libState.currentMutableState).toEqual(select().read());
    select()
      .reset();
    expect(libState.currentAction).toEqual({
      type: 'reset()',
      replacement: initialState,
    })
    expect(select().read()).toEqual(initialState);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should be able to add a new property onto an object', () => {
    const select = set({} as { [key: string]: string });
    const payload = { hello: 'world' };
    select().patch(payload);
    expect(libState.currentAction).toEqual({
      type: 'patch()',
      patch: payload,
    });
    expect(select().read()).toEqual({ hello: 'world' });
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should be able to remove a key', () => {
    const select = set({ hello: 'one', world: 'two', another: 'three' });
    const payload = ['hello', 'another'] as Array<any>;
    select().removeKeys(payload);
    expect(libState.currentAction).toEqual({
      type: 'removeKeys()',
      keysToRemove: payload,
    });
    expect(select().read()).toEqual({ world: 'two' });
    expect(libState.currentMutableState).toEqual(select().read());
  })

});
