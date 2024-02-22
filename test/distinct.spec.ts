
import { beforeEach, expect, test } from 'vitest';
import { createStore } from '../src/core';
import { resetLibraryState } from '../src/utility';

beforeEach(() => {
  resetLibraryState();
})

test('', () => {
  const store = createStore({
    more: [1, 2, 3, 4, 1, 3],
  });
  expect(store.more.$distinct.$state).toEqual([1, 2, 3, 4]);
})

