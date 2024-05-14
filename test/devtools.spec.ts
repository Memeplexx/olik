import { beforeEach, expect, test } from 'vitest';
import { testState } from '../src';
import { createStore } from '../src/core';
import { configureDevtools } from '../src/devtools';
import { resetLibraryState } from '../src/utility';

beforeEach(() => {
  resetLibraryState();
  configureDevtools();
})

test('should load', async () => {
  expect(testState.fakeDevtoolsMessage).toEqual({ actionType: '$load()', stateActions: [] });
  createStore({});
})
