import { createStore } from '../src/core';
import { resetLibraryState } from '../src/utility';
import { test, expect, beforeEach } from 'vitest';


beforeEach(() => {
  resetLibraryState();
})

const state = {
  object: { property: 'one', property2: 'two' },
  arr: [{ id: 1, name: 'a' }],
};

test('should not be able to modify an object payload', () => {
  const store = createStore({ state });
  const payload = { property: 'a', property2: 'b' };
  store.object.$set(payload);
  expect(() => payload.property = 'x').toThrow();
})

test('should not be able to modify an array element payload', () => {
  const store = createStore({ state });
  const payload = { id: 2, name: 'hey' };
  store.arr.$find.id.$eq(1).$set(payload);
  expect(() => payload.name = 'XXX').toThrow();
})

test('should not be able to modify the payload root', () => {
  const store = createStore({ state });
  const payload = { id: 2, name: 'hey' };
  store.arr.$find.id.$eq(1).$set(payload);
  expect(() => store.$state.arr = []).toThrow();
})
