import { errorMessages } from '../src/constant';
import { createStore } from '../src/core';
import { resetLibraryState } from '../src/utility';
import { test, expect, beforeEach } from 'vitest';


beforeEach(() => {
  resetLibraryState();
})

test('should throw an error if a user uses a dollar prop in their state', () => {
  expect(() => createStore({ state: { $hello: 'world' } })).toThrow(errorMessages.DOLLAR_USED_IN_STATE);
})

