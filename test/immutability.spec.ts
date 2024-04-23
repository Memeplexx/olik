import { createStore } from '../src/core';
import { connectOlikDevtoolsToStore } from '../src/devtools';
import { resetLibraryState } from '../src/utility';
import { test, expect, beforeEach } from 'vitest';


beforeEach(() => {
  resetLibraryState();
  connectOlikDevtoolsToStore();
})

const state = {
  object: { property: 'one', property2: 'two' },
  arr: [{ id: 1, name: 'a' }],
};

test('should not be able to modify the payload root', () => {
  const store = createStore(state);
  const payload = { id: 2, name: 'hey' };
  store.arr.$find.id.$eq(1).$set(payload);
  expect(() => store.$state.arr = []).toThrow();
})
