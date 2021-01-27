import { errorMessages } from '../src/consts';
import { set } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Array', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should filterCustom().patch()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = set(initialState);
    const payload = { value: 'test' };
    get(s => s.array).filterCustom(e => e.value.startsWith('t')).patch(payload);
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'test' }, { id: 3, value: 'test' }]);
    expect(tests.currentAction.type).toEqual('array.filterCustom().patch()');
    expect(tests.currentAction.payload.patch).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should filterCustom().remove()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = set(initialState);
    get(s => s.array).filterCustom(a => a.id === 2).remove();
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 3, value: 'three' }]);
    expect(tests.currentAction.type).toEqual('array.filterCustom().remove()');
    expect(tests.currentAction.payload.toRemove).toEqual([{ id: 2, value: 'two' }]);
    expect(tests.currentMutableState).toEqual(get().read());
    expect(initialState.array === get(s => s.array).read()).toBeFalsy();
  });

  it('should filterCustom().replace()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = set(initialState);
    const payload = { id: 5, value: 'hey' };
    get(s => s.array).filterCustom(a => a.id === 2).replace(payload);
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, payload, { id: 3, value: 'three' }]);
    expect(tests.currentAction.type).toEqual('array.filterCustom().replace()');
    expect(tests.currentAction.payload.replacement).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should upsert().match()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = set(initialState);
    const payload = { id: 1, value: 'one updated' };
    get(s => s.array).upsert(payload).match(s => s.id);
    expect(get(s => s.array).read()).toEqual([payload, { id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    expect(tests.currentAction.type).toEqual('array.upsert().match(id)');
    expect(tests.currentAction.payload.argument).toEqual(payload);
    expect(tests.currentAction.payload.found).toEqual(true);
    expect(tests.currentMutableState).toEqual(get().read());
    const payload2 = { id: 4, value: 'four inserted' };
    get(s => s.array).upsert(payload2).match(s => s.id);
    expect(get(s => s.array).read()).toEqual([payload, { id: 2, value: 'two' }, { id: 3, value: 'three' }, payload2]);
    expect(tests.currentAction.type).toEqual('array.upsert().match(id)');
    expect(tests.currentAction.payload.found).toEqual(false);
    expect(tests.currentAction.payload.argument).toEqual(payload2);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should upsert().match(), but fail due to more than one match being found', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 1, value: 'two' }, { id: 3, value: 'three' }],
    };
    const get = set(initialState);
    expect(() => get(s => s.array).upsert({ id: 1, value: 'x' }).match(e => e.id)).toThrowError(errorMessages.UPSERT_MORE_THAN_ONE_MATCH);
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

  it('should be able to merge()', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { hello: 'world' },
    });
    get(s => s.array)
      .merge([{ id: 2, value: 'twoo' }, { id: 3, value: 'threee' }, { id: 4, value: 'four' }, { id: 5, value: 'five' }])
      .match(e => e.id);
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'twoo' }, { id: 3, value: 'threee' }, { id: 4, value: 'four' }, { id: 5, value: 'five' }]);
    expect(tests.currentAction.type).toEqual('array.merge().match(id)');
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to replaceWhere() using an eq predicate', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .filter(e => e.id).eq(3)
      .replace({ id: 4, value: 'four' });
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 4, value: 'four' }]);
    expect(tests.currentAction.payload).toEqual({ where: 'id === 3', replacement: { id: 4, value: 'four' } });
  });

  it('should be able to replaceWhere() using a ne predicate', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .filter(e => e.id).ne(3)
      .replace({ id: 4, value: 'four' });
    expect(get(s => s.array).read()).toEqual([{ id: 4, value: 'four' }, { id: 4, value: 'four' }, { id: 3, value: 'three' }]);
    expect(tests.currentAction.payload).toEqual({ where: 'id !== 3', replacement: { id: 4, value: 'four' } });
  });

  it('should be able to replaceWhere() using an in predicate', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .filter(e => e.id).in([2, 3])
      .replace({ id: 4, value: 'four' });
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 4, value: 'four' }, { id: 4, value: 'four' }]);
    expect(tests.currentAction.payload).toEqual({ where: '[2, 3].includes(id)', replacement: { id: 4, value: 'four' } });
  });

  it('should be able to replaceWhere() using an ni predicate', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .filter(e => e.id).ni([2, 3])
      .replace({ id: 4, value: 'four' });
    expect(get(s => s.array).read()).toEqual([{ id: 4, value: 'four' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    expect(tests.currentAction.payload).toEqual({ where: '![2, 3].includes(id)', replacement: { id: 4, value: 'four' } });
  });

  it('should be able to replaceWhere() using a predicate and an or clause', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .filter(e => e.id).eq(1).or(e => e.id).eq(3)
      .replace({ id: 4, value: 'four' });
    expect(get(s => s.array).read()).toEqual([{ id: 4, value: 'four' }, { id: 2, value: 'two' }, { id: 4, value: 'four' }]);
    expect(tests.currentAction.payload).toEqual({ where: 'id === 1 || id === 3', replacement: { id: 4, value: 'four' } });
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to replaceWhere() using a predicate and an empty array', () => {
    const get = set({
      array: new Array<{ prop: { thing: number } }>(),
    });
    get(s => s.array)
      .filter(e => e.prop.thing).eq(1)
      .replace({ prop: { thing: 0 } });
    expect(tests.currentAction.payload).toEqual({ where: 'prop.thing === 1', replacement: { prop: { thing: 0 } } });
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to patchWhere() using a predicate', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .filter(e => e.id).eq(3)
      .patch({ value: 'four' });
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'four' }]);
    expect(tests.currentAction.payload).toEqual({ where: 'id === 3', patch: { value: 'four' } });
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to removeWhere() using a predicate', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .filter(e => e.id).eq(3)
      .remove();
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }]);
    expect(tests.currentAction.payload).toEqual({ where: 'id === 3', toRemove: [{ id: 3, value: 'three' }] });
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to removeWhere() using a lt predicate', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .filter(e => e.id).lt(3)
      .remove();
    expect(get(s => s.array).read()).toEqual([{ id: 3, value: 'three' }]);
    expect(tests.currentAction.payload).toEqual({ where: 'id < 3', toRemove: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }] });
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should combine find() with onChange()', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .find(e => e.id).eq(3)
      .onChange(e => expect(e.value).toEqual('threee'));
    get(s => s.array)
      .filter(e => e.id).eq(3)
      .patch({ value: 'threee' });
  })

  it('should combine findCustom() with onChange()', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    get(s => s.array)
      .findCustom(e => e.id === 3)
      .onChange(e => expect(e.value).toEqual('xx'));
    get(s => s.array)
      .filterCustom(e => e.id === 3)
      .patch({ value: 'xx' })
  })

  it('should only update up to one element when using find()', () => {
    const get = set({
      array: [{ id: 1, value: 'one', status: 'done' }, { id: 2, value: 'two', status: 'done' }, { id: 3, value: 'three', status: 'todo' }] as Array<{ id: number, value: string, status: 'done' | 'todo' }>,
    });
    get(s => s.array)
      .find(e => e.value).match(/^t/)
      .patch({ value: 'new' });
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one', status: 'done' }, { id: 2, value: 'new', status: 'done' }, { id: 3, value: 'three', status: 'todo' }]);
  })

  it('should only patch() the first element in an array using findCustom()', () => {
    const get = set({
      array: [{ id: 1, value: 'one', status: 'done' }, { id: 2, value: 'two', status: 'done' }, { id: 3, value: 'three', status: 'todo' }] as Array<{ id: number, value: string, status: 'done' | 'todo' }>,
    });
    get(s => s.array)
      .findCustom(e => e.value.startsWith('t'))
      .patch({ value: 'test' });
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one', status: 'done' }, { id: 2, value: 'test', status: 'done' }, { id: 3, value: 'three', status: 'todo' }]);
  })

  it('should only replace() the first element in an array using findCustom()', () => {
    const get = set({
      array: [{ id: 1, value: 'one', status: 'done' }, { id: 2, value: 'two', status: 'done' }, { id: 3, value: 'three', status: 'todo' }] as Array<{ id: number, value: string, status: 'done' | 'todo' }>,
    });
    get(s => s.array)
      .findCustom(e => e.value.startsWith('t'))
      .replace({ id: 2, value: 'test', status: 'done' });
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one', status: 'done' }, { id: 2, value: 'test', status: 'done' }, { id: 3, value: 'three', status: 'todo' }]);
  })

  it('should only remove() the first element in an array using findCustom()', () => {
    const get = set({
      array: [{ id: 1, value: 'one', status: 'done' }, { id: 2, value: 'two', status: 'done' }, { id: 3, value: 'three', status: 'todo' }] as Array<{ id: number, value: string, status: 'done' | 'todo' }>,
    });
    get(s => s.array)
      .findCustom(e => e.value.startsWith('t'))
      .remove();
    expect(get().read()).toEqual({ array: [{ id: 1, value: 'one', status: 'done' }, { id: 3, value: 'three', status: 'todo' }] });
    expect(tests.currentMutableState).toEqual({ array: [{ id: 1, value: 'one', status: 'done' }, { id: 3, value: 'three', status: 'todo' }] });
  })

});
