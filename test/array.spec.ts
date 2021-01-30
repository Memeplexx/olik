import { errorMessages } from '../src/consts';
import { set } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Array', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should be able to find() an array element and replace one of its properties', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { hello: 'world' },
    });
    const payload = 'twoo';
    get(s => s.array.find(e => e.id === 2)!.value).replace(payload);
    expect(tests.currentAction).toEqual({
      type: 'array.1.value.replace()',
      payload: {
        replacement: payload
      }
    })
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'twoo' }, { id: 3, value: 'three' }]);
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to find() an array element and patch one of its properties', () => {
    const get = set({
      array: [{ id: 1, value: { a: 'one', b: 'one' } }, { id: 2, value: { a: 'two', b: 'two' } }, { id: 3, value: { a: 'three', b: 'three' } }],
      object: { hello: 'world' },
    });
    const payload = { b: 'twoo' }
    get(s => s.array.find(e => e.id === 2)!.value).patch(payload);
    expect(tests.currentAction).toEqual({
      type: 'array.1.value.patch()',
      payload: {
        patch: payload,
      }
    });
    expect(get(s => s.array).read()).toEqual([{ id: 1, value: { a: 'one', b: 'one' } }, { id: 2, value: { a: 'two', b: 'twoo' } }, { id: 3, value: { a: 'three', b: 'three' } }]);
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


});
