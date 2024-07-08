/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, expect, test } from 'vitest';
import { DeepReadonlyArray } from '../src';
import { createStore } from '../src/core';
import { configureDevtools } from '../src/devtools';
import { resetLibraryState } from '../src/utility';


beforeEach(() => {
  resetLibraryState();
  configureDevtools();
})

test('should read deep array element properties', () => {
  const state = { arr: [{ id: 1, val: 0, obj: { num: 1 } }, { id: 2, val: 0, obj: { num: 2 } }] };
  const store = createStore(state);
  expect(store.arr.obj.num.$state).toEqual([1, 2]);
})

test('', () => {
  const store = createStore({ arr: [{ id: 1, text: 'hello' }], obj: { one: 'two' } });
  expect((store.arr as any).i.$state).toEqual([{ id: 1, text: 'hello' }]);
  expect((store.obj as any).o.$state).toEqual({ one: 'two' });
  expect(store.arr.$at(9).$state).toEqual([{ id: 1, text: 'hello' }]);
  expect(store.arr.$find.id.$eq(9).$state).toEqual([{ id: 1, text: 'hello' }]);
  expect(store.arr.$filter.id.$eq(9).$state).toEqual([]);
  expect((store.arr.$find.id.$eq(1) as any).i.$state).toEqual({ id: 1, text: 'hello' });
  expect((store.arr.$filter.id.$eq(1) as any).i.$state).toEqual([{ id: 1, text: 'hello' }]);
})

test('should react to $onChangeImmediate', () => {
  const store = createStore({ arr: [{ id: 1, text: 'hello' }], obj: { one: 'two' } });
  let count = 0;
  let val = '';
  store.obj.one.$onChange(e => {
    count++;
    val = e;
  }, { fireImmediately: true });
  expect(count).toBe(1);
  expect(val).toBe('two');
})

test('should $onChange with previous state', () => {
  const store = createStore({ arr: [{ id: 1, text: 'hello' }], obj: { one: 'two' } });
  let count = 0;
  let curr = '';
  let prev = '';
  store.obj.one.$onChange((e, p) => {
    count++;
    curr = e;
    prev = p;
  });
  store.obj.one.$set('three');
  expect(count).toBe(1);
  expect(prev).toBe('two');
  expect(curr).toBe('three');
})

test('should react to onInsert events on push', () => {
  const store = createStore({ arr: [{ id: 1, text: 'hello' }], obj: { one: 'two' } });
  let inserted!: DeepReadonlyArray<{ id: number, text: string }>;
  store.arr.$onArray.$insert(e => {
    inserted = e;
  });
  store.arr.$push({ id: 2, text: 'world' });
  expect(inserted).toEqual([{ id: 2, text: 'world' }]);
})

test('should react to onInsert events on merge', () => {
  const store = createStore({ arr: [1, 2, 3, 4], obj: { one: 'two' } });
  let inserted!: DeepReadonlyArray<number>;
  store.arr.$onArray.$insert(e => {
    inserted = e;
  });
  store.arr.$merge([3, 4, 5, 6]);
  expect(inserted).toEqual([5, 6]);
});

test('should react to onInsert and update events on merge matching', () => {
  const store = createStore({ arr: [{ id: 1, text: 'hello' }], obj: { one: 'two' } });
  let inserted!: DeepReadonlyArray<{ id: number, text: string }>;
  store.arr.$onArray.$insert(e => {
    inserted = e;
  });
  let updated!: DeepReadonlyArray<{ id: number, text: string }>;
  store.arr.$onArray.$update(e => {
    updated = e;
  });
  store.arr.$mergeMatching.id.$with([{ id: 1, text: 'thing' }, { id: 9, text: 'hello' }]);
  expect(inserted).toEqual([{ id: 9, text: 'hello' }]);
  expect(updated).toEqual([{ id: 1, text: 'thing' }]);
});

test('should react to onUpdate when filtered', () => {
  const store = createStore({ arr: [{ id: 1, text: 'one' }, { id: 2, text: 'two' }], obj: { one: 'two' } });
  let updated!: DeepReadonlyArray<{ id: number, text: string }>;
  store.arr.$onArray.$update(e => {
    updated = e;
  });
  store.arr.$filter.id.$eq(2).$set([{ id: 2, text: 'three' }]);
  expect(updated).toEqual([{ id: 2, text: 'three' }]);
})

test('should react to onUpdate when find', () => {
  const store = createStore({ arr: [{ id: 1, text: 'one' }, { id: 2, text: 'two' }], obj: { one: 'two' } });
  let updated!: DeepReadonlyArray<{ id: number, text: string }>;
  store.arr.$onArray.$update(e => {
    updated = e;
  });
  store.arr.$find.id.$eq(2).$set({ id: 2, text: 'three' });
  expect(updated).toEqual([{ id: 2, text: 'three' }]);
})

test('should react to onUpdate when find object property', () => {
  const store = createStore({ arr: [{ id: 1, text: 'one' }, { id: 2, text: 'two' }], obj: { one: 'two' } });
  let updated!: DeepReadonlyArray<{ id: number, text: string }>;
  store.arr.$onArray.$update(e => {
    updated = e;
  });
  store.arr.$find.id.$eq(2).text.$set('three');
  expect(updated).toEqual([{ id: 2, text: 'three' }]);
})

test('should react to onUpdate when filtered object property', () => {
  const store = createStore({ arr: [{ id: 1, text: 'one' }, { id: 2, text: 'two' }], obj: { one: 'two' } });
  let updated!: DeepReadonlyArray<{ id: number, text: string }>;
  store.arr.$onArray.$update(e => {
    updated = e;
  });
  store.arr.$filter.id.$eq(2).text.$set('three');
  expect(updated).toEqual([{ id: 2, text: 'three' }]);
})

test('should react to deleted elements when filtered', () => {
  const store = createStore({ arr: [{ id: 1, text: 'one' }, { id: 2, text: 'two' }], obj: { one: 'two' } });
  let deleted!: DeepReadonlyArray<{ id: number, text: string }>;
  store.arr.$onArray.$delete(e => {
    deleted = e;
  });
  store.arr.$filter.id.$eq(2).$delete();
  expect(deleted).toEqual([{ id: 2, text: 'two' }]);
})

test('should react to deleted elements when found', () => {
  const store = createStore({ arr: [{ id: 1, text: 'one' }, { id: 2, text: 'two' }], obj: { one: 'two' } });
  let deleted!: DeepReadonlyArray<{ id: number, text: string }>;
  store.arr.$onArray.$delete(e => {
    deleted = e;
  });
  store.arr.$find.id.$eq(2).$delete();
  expect(deleted).toEqual([{ id: 2, text: 'two' }]);
})

test('should react to deleted at', () => {
  const store = createStore({ arr: [{ id: 1, text: 'one' }, { id: 2, text: 'two' }], obj: { one: 'two' } });
  let deleted!: DeepReadonlyArray<{ id: number, text: string }>;
  store.arr.$onArray.$delete(e => {
    deleted = e;
  });
  store.arr.$at(1).$delete();
  expect(deleted).toEqual([{ id: 2, text: 'two' }]);
})

test('should react to updated at', () => {
  const store = createStore({ arr: [{ id: 1, text: 'one' }, { id: 2, text: 'two' }], obj: { one: 'two' } });
  let updated!: DeepReadonlyArray<{ id: number, text: string }>;
  store.arr.$onArray.$update(e => {
    updated = e;
  });
  store.arr.$at(1).text.$set('three');
  expect(updated).toEqual([{ id: 2, text: 'three' }]);
})

test('should react to clear', () => {
  const store = createStore({ arr: [{ id: 1, text: 'one' }, { id: 2, text: 'two' }], obj: { one: 'two' } });
  let deleted!: DeepReadonlyArray<{ id: number, text: string }>;
  store.arr.$onArray.$delete(e => {
    deleted = e;
  });
  store.arr.$clear();
  expect(deleted).toEqual([{ id: 1, text: 'one' }, { id: 2, text: 'two' }]);
})