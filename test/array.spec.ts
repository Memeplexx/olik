import { errorMessages } from '../src/consts';
import { set } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Array', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should addAfter() with an array as payload', () => {
    const initialState = {
      array: [{ id: 1, value: 'one' }],
      object: { property: '' },
    };
    const get = set(initialState);
    const payload = [{ id: 2, value: 'two' }, { id: 3, value: 'three' }];
    get(s => s.array).addAfter(payload);
    expect(get(s => s.array).read()).toEqual([...initialState.array, ...payload]);
    expect(tests.currentAction.type).toEqual('array.addAfter()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should addAfter() with a single item as payload', () => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }],
      object: { property: '' },
    };
    const get = set(initialState);
    const payload = { id: 3, value: 'three' };
    get(s => s.array).addAfter(payload);
    expect(get(s => s.array).read()).toEqual([...initialState.array, payload]);
    expect(tests.currentAction.type).toEqual('array.addAfter()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should addBefore() with an array as payload', () => {
    const initialState = {
      array: [{ id: 3, value: 'three' }],
      object: { property: '' },
    };
    const get = set(initialState);
    const payload = [{ id: 1, value: 'one' }, { id: 2, value: 'two' }];
    get(s => s.array).addBefore(payload);
    expect(get(s => s.array).read()).toEqual([...payload, ...initialState.array]);
    expect(tests.currentAction.type).toEqual('array.addBefore()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should addBefore() with a single item as payload', () => {
    const initialState = {
      array: [{ id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { property: '' },
    };
    const get = set(initialState);
    const payload = { id: 1, value: 'one' };
    get(s => s.array).addBefore(payload);
    expect(get(s => s.array).read()).toEqual([payload, ...initialState.array]);
    expect(tests.currentAction.type).toEqual('array.addBefore()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should patchWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = set(initialState);
    const payload = { value: 'test' };
    get(s => s.array).updateWhereFn(e => e.value.startsWith('t')).patch(payload);
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'test' }, { id: 3, value: 'test' }]);
    expect(tests.currentAction.type).toEqual('array.patchWhere()');
    expect(tests.currentAction.payload.patch).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should removeWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = set(initialState);
    get(s => s.array).updateWhereFn(a => a.id === 2).remove();
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 3, value: 'three' }]);
    expect(tests.currentAction.type).toEqual('array.removeWhere()');
    expect(tests.currentAction.payload.toRemove).toEqual([{ id: 2, value: 'two' }]);
    expect(tests.currentMutableState).toEqual(get().read());
    expect(initialState.array === get(s => s.array).read()).toBeFalsy();
  });

  it('should replaceWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = set(initialState);
    const payload = { id: 5, value: 'hey' };
    get(s => s.array).updateWhereFn(a => a.id === 2).replace(payload);
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, payload, { id: 3, value: 'three' }]);
    expect(tests.currentAction.type).toEqual('array.replaceWhere()');
    expect(tests.currentAction.payload.replacement).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should upsertWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = set(initialState);
    const payload = { id: 1, value: 'one updated' };
    get(s => s.array).updateWhereFn(e => e.id === 1).upsert(payload);
    expect(get(s => s.array).read()).toEqual([payload, { id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    expect(tests.currentAction.type).toEqual('array.upsertWhere()');
    expect(tests.currentAction.payload.element).toEqual(payload);
    expect(tests.currentAction.payload.elementFound).toEqual(true);
    expect(tests.currentMutableState).toEqual(get().read());
    const payload2 = { id: 4, value: 'four inserted' };
    get(s => s.array).updateWhereFn(e => e.id === 4).upsert(payload2);
    expect(get(s => s.array).read()).toEqual([payload, { id: 2, value: 'two' }, { id: 3, value: 'three' }, payload2]);
    expect(tests.currentAction.type).toEqual('array.upsertWhere()');
    expect(tests.currentAction.payload.elementFound).toEqual(false);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should fail to upsertWhere() should more than one element match the where clause', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = set(initialState);
    expect(() => get(s => s.array).updateWhereFn(e => e.value.startsWith('t')).upsert({ id: 0, value: 'x' })).toThrowError(errorMessages.UPSERT_MORE_THAN_ONE_MATCH);
  });

  it('should removeAll()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }]
    };
    const get = set(initialState);
    get(s => s.array).removeAll();
    expect(get(s => s.array).read()).toEqual([]);
    expect(tests.currentAction.type).toEqual('array.removeAll()');
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should removeFirst()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = set(initialState);
    get(s => s.array).removeFirst();
    expect(get(s => s.array).read()).toEqual([{ id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    expect(tests.currentAction.type).toEqual('array.removeFirst()');
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should removeLast()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = set(initialState);
    get(s => s.array).removeLast();
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }]);
    expect(tests.currentAction.type).toEqual('array.removeLast()');
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should replaceAll()', () => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { property: '' },
    };
    const get = set(initialState);
    const payload = [{ id: 4, value: 'four' }, { id: 5, value: 'five' }];
    get(s => s.array).replaceAll(payload);
    expect(get(s => s.array).read()).toEqual([{ id: 4, value: 'four' }, { id: 5, value: 'five' }]);
    expect(tests.currentAction.type).toEqual('array.replaceAll()');
    expect(tests.currentAction.payload).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to find() an array element and replace one of its properties', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { hello: 'world' },
    });
    get(s => s.array.find(e => e.id === 2)!.value).replace('twoo');
    expect(tests.currentAction.type).toEqual('array.1.value.replace()');
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'twoo' }, { id: 3, value: 'three' }]);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to find() an array element and patch one of its properties', () => {
    const get = set({
      array: [{ id: 1, value: { a: 'one', b: 'one' } }, { id: 2, value: { a: 'two', b: 'two' } }, { id: 3, value: { a: 'three', b: 'three' } }],
      object: { hello: 'world' },
    });
    get(s => s.array.find(e => e.id === 2)!.value).patch({ b: 'twoo' });
    expect(tests.currentAction.type).toEqual('array.1.value.patch()');
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: { a: 'one', b: 'one' } }, { id: 2, value: { a: 'two', b: 'twoo' } }, { id: 3, value: { a: 'three', b: 'three' } }]);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to mergeMatching()', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { hello: 'world' },
    });
    get(s => s.array).merge(e => e.id).with([{ id: 2, value: 'twoo' }, { id: 3, value: 'threee' }, { id: 4, value: 'four' }, { id: 5, value: 'five' }]);
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'twoo' }, { id: 3, value: 'threee' }, { id: 4, value: 'four' }, { id: 5, value: 'five' }]);
    expect(tests.currentAction.type).toEqual('array.merge()');
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to replaceWhere() using an eq predicate', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .updateWhere(e => e.id).eq(3)
      .replace({ id: 4, value: 'four' });
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 4, value: 'four' }]);
    expect(tests.currentAction.payload).toEqual({ whereClause: 'id === 3', replacement: { id: 4, value: 'four' } });
  });

  it('should be able to replaceWhere() using a ne predicate', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .updateWhere(e => e.id).ne(3)
      .replace({ id: 4, value: 'four' });
    expect(get(s => s.array).read()).toEqual([{ id: 4, value: 'four' }, { id: 4, value: 'four' }, { id: 3, value: 'three' }]);
    expect(tests.currentAction.payload).toEqual({ whereClause: 'id !== 3', replacement: { id: 4, value: 'four' } });
  });

  it('should be able to replaceWhere() using an in predicate', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .updateWhere(e => e.id).in([2, 3])
      .replace({ id: 4, value: 'four' });
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 4, value: 'four' }, { id: 4, value: 'four' }]);
    expect(tests.currentAction.payload).toEqual({ whereClause: '[2, 3].includes(id)', replacement: { id: 4, value: 'four' } });
  });

  it('should be able to replaceWhere() using an ni predicate', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .updateWhere(e => e.id).ni([2, 3])
      .replace({ id: 4, value: 'four' });
    expect(get(s => s.array).read()).toEqual([{ id: 4, value: 'four' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    expect(tests.currentAction.payload).toEqual({ whereClause: '![2, 3].includes(id)', replacement: { id: 4, value: 'four' } });
  });

  it('should be able to replaceWhere() using a predicate and an or clause', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .updateWhere(e => e.id).eq(1).or(e => e.id).eq(3)
      .replace({ id: 4, value: 'four' });
    expect(get(s => s.array).read()).toEqual([{ id: 4, value: 'four' }, { id: 2, value: 'two' }, { id: 4, value: 'four' }]);
    expect(tests.currentAction.payload).toEqual({ whereClause: 'id === 1 || id === 3', replacement: { id: 4, value: 'four' } });
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to replaceWhere() using a predicate and an empty array', () => {
    const get = set({
      array: new Array<{ prop: { thing: number } }>(),
    });
    get(s => s.array)
      .updateWhere(e => e.prop.thing).eq(1)
      .replace({ prop: { thing: 0 } });
    expect(tests.currentAction.payload).toEqual({ whereClause: 'prop.thing === 1', replacement: { prop: { thing: 0 } } });
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to upsertWhere() using a predicate', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .updateWhere(e => e.id).eq(3)
      .upsert({ id: 4, value: 'four' });
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 4, value: 'four' }]);
    expect(tests.currentAction.payload).toEqual({ whereClause: 'id === 3', element: { id: 4, value: 'four' }, elementFound: true });
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to patchWhere() using a predicate', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .updateWhere(e => e.id).eq(3)
      .patch({ value: 'four' });
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'four' }]);
    expect(tests.currentAction.payload).toEqual({ whereClause: 'id === 3', patch: { value: 'four' } });
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to removeWhere() using a predicate', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .updateWhere(e => e.id).eq(3)
      .remove();
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }]);
    expect(tests.currentAction.payload).toEqual({ whereClause: 'id === 3', toRemove: [{ id: 3, value: 'three' }] });
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to removeWhere() using a lt predicate', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .updateWhere(e => e.id).lt(3)
      .remove();
    expect(get(s => s.array).read()).toEqual([{ id: 3, value: 'three' }]);
    expect(tests.currentAction.payload).toEqual({ whereClause: 'id < 3', toRemove: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }] });
    expect(tests.currentMutableState).toEqual(get().read());


    // get(s => s.array)
    //   .updateWhere(e => e.id).eq(3).and(e => e.value).eq('dd')
    //   .patch({ value: 'dd' });
    // console.log(tests.currentAction.payload)
    // type: 'array.patchWhere()'
    // payload: { where: 'id === 3 && value === 'dd', patch: { value: 'dd' } }

    // get(s => s.array)
    //   .find(e => e.id).eq(3)
    //   .filter(e => e.some.deep.prop).eq(3)
    //   .patch({ val: 'dd' })
  })

});
