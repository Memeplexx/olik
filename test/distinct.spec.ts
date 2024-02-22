
import { beforeEach, expect, test } from 'vitest';
import { createStore } from '../src/core';
import { resetLibraryState } from '../src/utility';
import { libState } from '../src';

beforeEach(() => {
  resetLibraryState();
})

test('shoud de duplicate numbers', () => {
  const store = createStore({
    array: [1, 2, 3, 4, 1, 3],
  });
  store.array.$deDuplicate();
  expect(store.array.$state).toEqual([1, 2, 3, 4]);
  expect(libState.currentAction).toEqual({ type: 'array.$deDuplicate()' });
})

test('shoud de duplicate strings', () => {
  const store = createStore({
    array: ['1', '2', '3', '4', '1', '3'],
  });
  store.array.$deDuplicate();
  expect(store.array.$state).toEqual(['1', '2', '3', '4']);
  expect(libState.currentAction).toEqual({ type: 'array.$deDuplicate()' });
})
