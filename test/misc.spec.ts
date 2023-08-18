import { beforeEach, expect, test } from 'vitest';
import { errorMessages } from '../src/constant';
import { createInnerStore, createStore } from '../src/core';
import { resetLibraryState } from '../src/utility';


beforeEach(() => {
  resetLibraryState();
})

test('should throw an error if a user uses a dollar prop in their state', () => {
  expect(() => createStore({ state: { $hello: 'world' } })).toThrow(errorMessages.DOLLAR_USED_IN_STATE);
})

test('should allow dates', () => {
  const state = { date: new Date() };
  const store = createStore(state)
  expect(typeof store.$state.date).toEqual('object')
})

test('should support inner stores', () => {
  const rootStore = createStore({ string: '' })
  const accessor = createInnerStore({
    array: [{ id: 1, text: 'one' }]
  }).usingAccessor(s => s.array.$find.id.$eq(1))
  accessor.text.$set('hello');
  accessor.text.$set('world');
  expect(rootStore.$state).toEqual({ string: '', array: [{ id: 1, text: 'world' }] });
  expect(accessor.$state).toEqual({ id: 1, text: 'world' });
})