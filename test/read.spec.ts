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