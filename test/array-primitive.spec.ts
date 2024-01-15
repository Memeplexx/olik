import { createStore } from '../src/core';
import { test, expect, beforeEach } from 'vitest';
import { resetLibraryState } from '../src/utility';
import { libState } from '../src';


beforeEach(() => {
  resetLibraryState();
})

test('should merge a number', () => {
  const store = createStore({ nums: [1, 4, 5] });
  store.nums.$merge(2);
  expect(libState.currentAction).toEqual({ type: 'nums.$merge()', payload: 2 });
  expect(store.$state).toEqual({ nums: [1, 4, 5, 2] });
})

test('should merge a number with duplicate', () => {
  const store = createStore({ nums: [1, 4, 5] });
  store.nums.$merge(4);
  expect(libState.currentAction).toEqual({ type: 'nums.$merge()', payload: 4 });
  expect(store.$state).toEqual({ nums: [1, 4, 5] });
})

test('should merge a number list', () => {
  const store = createStore({ nums: [1, 4, 5] });
  store.nums.$merge([2, 5, 7, 2]);
  expect(libState.currentAction).toEqual({ type: 'nums.$merge()', payload: [2, 5, 7, 2] });
  expect(store.$state).toEqual({ nums: [1, 4, 5, 2, 7, 2] });
})
