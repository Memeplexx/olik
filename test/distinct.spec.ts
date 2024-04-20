
import { beforeEach, expect, test } from 'vitest';
import { createStore } from '../src/core';
import { resetLibraryState } from '../src/utility';
import { libState } from '../src';
import { connectOlikDevtoolsToStore } from '../src/devtools';

beforeEach(() => {
  resetLibraryState();
  connectOlikDevtoolsToStore();
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

test('shoud de duplicate strings', () => {
  const store = createStore({
    array: [1, 2, 3],
  });
  const payload = [3, 4, 1, 3, 7, 4, 3, 1];
  store.array.$setUnique(payload);
  expect(store.array.$state).toEqual([3, 4, 1, 7]);
  expect(libState.currentAction).toEqual({ type: 'array.$setUnique()', payload });
})
