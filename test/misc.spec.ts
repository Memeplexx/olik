import { beforeEach, expect, test } from 'vitest';
import { createStore } from '../src/core';
import { configureDevtools } from '../src/devtools';
import { resetLibraryState } from '../src/utility';


beforeEach(() => {
  resetLibraryState();
  configureDevtools();
})

test('should allow dates', () => {
  const state = { date: new Date() };
  const store = createStore(state)
  expect(typeof store.$state.date).toEqual('object')
})
