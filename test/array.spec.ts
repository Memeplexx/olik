import { errorMessages } from '../src/consts';
import { make, makeEnforceTags } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Array', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should addAfter() with an array as payload', () => {
    const initialState = {
      array: [{ id: 1, value: 'one' }],
      object: { property: '' },
    };
    const get = make(initialState);
    const payload = [{ id: 2, value: 'two' }, { id: 3, value: 'three' }];
    get(s => s.array).addAfter(payload);
    expect(get(s => s.array).read()).toEqual([...initialState.array, ...payload]);
    expect(tests.currentAction.type).toEqual('array.addAfter()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should addAfter() with a single item as payload', () => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }],
      object: { property: '' },
    };
    const get = make(initialState);
    const payload = { id: 3, value: 'three' };
    get(s => s.array).addAfter(payload);
    expect(get(s => s.array).read()).toEqual([...initialState.array, payload]);
    expect(tests.currentAction.type).toEqual('array.addAfter()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should addBefore() with an array as payload', () => {
    const initialState = {
      array: [{ id: 3, value: 'three' }],
      object: { property: '' },
    };
    const get = make(initialState);
    const payload = [{ id: 1, value: 'one' }, { id: 2, value: 'two' }];
    get(s => s.array).addBefore(payload);
    expect(get(s => s.array).read()).toEqual([...payload, ...initialState.array]);
    expect(tests.currentAction.type).toEqual('array.addBefore()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should addBefore() with a single item as payload', () => {
    const initialState = {
      array: [{ id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { property: '' },
    };
    const get = make(initialState);
    const payload = { id: 1, value: 'one' };
    get(s => s.array).addBefore(payload);
    expect(get(s => s.array).read()).toEqual([payload, ...initialState.array]);
    expect(tests.currentAction.type).toEqual('array.addBefore()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should patchWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = make(initialState);
    const payload = { value: 'test' };
    get(s => s.array).patchWhere(e => e.value.startsWith('t')).with(payload);
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'test' }, { id: 3, value: 'test' }]);
    expect(tests.currentAction.type).toEqual('array.1,2.patchWhere()');
    expect(tests.currentAction.payload.patch).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should removeWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = make(initialState);
    get(s => s.array).removeWhere(a => a.id === 2);
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 3, value: 'three' }]);
    expect(tests.currentAction.type).toEqual('array.1.removeWhere()');
    expect(tests.currentAction.payload.toRemove).toEqual([{ id: 2, value: 'two' }]);
    expect(tests.currentMutableState).toEqual(get().read());
    expect(initialState.array === get(s => s.array).read()).toBeFalsy();
  })

  it('should replaceWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = make(initialState);
    const payload = { id: 5, value: 'hey' };
    get(s => s.array).replaceWhere(a => a.id === 2).with(payload);
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, payload, { id: 3, value: 'three' }]);
    expect(tests.currentAction.type).toEqual('array.1.replaceWhere()');
    expect(tests.currentAction.payload.replacement).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should upsertWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = make(initialState);
    const payload = { id: 1, value: 'one updated' };
    get(s => s.array).upsertWhere(e => e.id === 1).with(payload);
    expect(get(s => s.array).read()).toEqual([payload, { id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    expect(tests.currentAction.type).toEqual('array.0.upsertWhere()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
    const payload2 = { id: 4, value: 'four inserted' };
    get(s => s.array).upsertWhere(e => e.id === 4).with(payload2);
    expect(get(s => s.array).read()).toEqual([payload, { id: 2, value: 'two' }, { id: 3, value: 'three' }, payload2]);
    expect(tests.currentAction.type).toEqual('array.upsertWhere()');
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should fail to upsertWhere() should more than one element match the where clause', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = make(initialState);
    expect(() => get(s => s.array).upsertWhere(e => e.value.startsWith('t')).with({ id: 0, value: 'x' })).toThrowError(errorMessages.UPSERT_MORE_THAN_ONE_MATCH);
  })

  it('should removeAll()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }]
    };
    const get = make(initialState);
    get(s => s.array).removeAll();
    expect(get(s => s.array).read()).toEqual([]);
    expect(tests.currentAction.type).toEqual('array.removeAll()');
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should removeFirst()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = make(initialState);
    get(s => s.array).removeFirst();
    expect(get(s => s.array).read()).toEqual([{ id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    expect(tests.currentAction.type).toEqual('array.removeFirst()');
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should removeLast()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = make(initialState);
    get(s => s.array).removeLast();
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }]);
    expect(tests.currentAction.type).toEqual('array.removeLast()');
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replaceAll()', () => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { property: '' },
    };
    const get = make(initialState);
    const payload = [{ id: 4, value: 'four' }, { id: 5, value: 'five' }];
    get(s => s.array).replaceAll(payload);
    expect(get(s => s.array).read()).toEqual([{ id: 4, value: 'four' }, { id: 5, value: 'five' }]);
    expect(tests.currentAction.type).toEqual('array.replaceAll()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should be able to find() an array element and replace one of its properties', () => {
    const get = make({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { hello: 'world' },
    });
    get(s => s.array.find(e => e.id === 2)!.value).replace('twoo');
    expect(tests.currentAction.type).toEqual('array.1.value.replace()');
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'twoo' }, { id: 3, value: 'three' }]);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should be able to find() an array element and patch one of its properties', () => {
    const get = make({
      array: [{ id: 1, value: { a: 'one', b: 'one' } }, { id: 2, value: { a: 'two', b: 'two' } }, { id: 3, value: { a: 'three', b: 'three' } }],
      object: { hello: 'world' },
    });
    get(s => s.array.find(e => e.id === 2)!.value).patch({ b: 'twoo' });
    expect(tests.currentAction.type).toEqual('array.1.value.patch()');
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: { a: 'one', b: 'one' } }, { id: 2, value: { a: 'two', b: 'twoo' } }, { id: 3, value: { a: 'three', b: 'three' } }]);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should be able to mergeWhere()', () => {
    const get = make({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { hello: 'world' },
    });
    get(s => s.array).mergeWhere((e0, e1) => e0.id === e1.id).with([{ id: 2, value: 'twoo' }, { id: 3, value: 'threee' }, { id: 4, value: 'four' }, { id: 5, value: 'five' }]);
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'twoo' }, { id: 3, value: 'threee' }, { id: 4, value: 'four' }, { id: 5, value: 'five' }]);
    expect(tests.currentAction.type).toEqual('array.mergeWhere()');
    expect(tests.currentMutableState).toEqual(get().read());


    const thing = get();
    const ee = thing.read();
  })

});
