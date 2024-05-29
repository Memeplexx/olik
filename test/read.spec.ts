/* eslint-disable @typescript-eslint/no-explicit-any */
import { createStore } from '../src/core';
import { configureDevtools } from '../src/devtools';
import { resetLibraryState } from '../src/utility';
import { test, expect, beforeEach } from 'vitest';


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
  const store  = createStore({ arr: [{ id: 1, text: 'hello' }], obj: { one: 'two' } });
  expect((store.arr as any).i.$state).toEqual([{ id: 1, text: 'hello' }]);
  expect((store.obj as any).o.$state).toEqual({ one: 'two' });
  expect(store.arr.$at(9).$state).toEqual([{ id: 1, text: 'hello' }]);
  expect(store.arr.$find.id.$eq(9).$state).toEqual([{ id: 1, text: 'hello' }]);
  expect(store.arr.$filter.id.$eq(9).$state).toEqual([]);
  expect((store.arr.$find.id.$eq(1) as any).i.$state).toEqual({ id: 1, text: 'hello' });
  expect((store.arr.$filter.id.$eq(1) as any).i.$state).toEqual([{ id: 1, text: 'hello' }]);
})

test('should react to $onChangeImmediate', () => {
  const store  = createStore({ arr: [{ id: 1, text: 'hello' }], obj: { one: 'two' } });
  let count = 0;
  let val = '';
  store.obj.one.$onChangeImmediate(e => {
    count++;
    val = e;
  });
  expect(count).toBe(1);
  expect(val).toBe('two');
})

test('should $onChange with previous state', () => {
  const store  = createStore({ arr: [{ id: 1, text: 'hello' }], obj: { one: 'two' } });
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