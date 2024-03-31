import { beforeEach, expect, test } from 'vitest';
import { testState } from '../src';
import { createStore } from '../src/core';
import { connectOlikDevtoolsToStore } from '../src/devtools';
import { resetLibraryState } from '../src/utility';

beforeEach(() => {
  resetLibraryState();
  connectOlikDevtoolsToStore();
})

test('should load', async () => {
  expect(testState.fakeDevtoolsMessage).toEqual({ action: { type: '$load()' }, stateActions: [] });
  createStore({});
})
