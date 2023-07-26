import { errorMessages, testState } from '../src/constant';
import { createStore } from '../src/core';
import { transact } from '../src/transact';
import { currentAction, currentActions } from './_utility';
import { importOlikAsyncModule } from '../src/write-async';
import { test, expect, beforeEach, afterAll } from 'vitest';
import { resetLibraryState } from '../src';

beforeEach(() => {
  resetLibraryState();
  testState.isTest = true;
})

afterAll(() => {
  testState.isTest = false;
})

test('should support transactions', () => {
  const state = { num: 0, str: '', bool: false };
  const store = createStore({ state });
  transact(
    () => store.num.$set(1),
    () => store.str.$set('x'),
  );
  expect(store.$state).toEqual({ num: 1, str: 'x', bool: false });
  expect(currentActions(store)).toEqual([
    { type: 'num.$set()', payload: 1 },
    { type: 'str.$set()', payload: 'x' },
  ])
})

test('should support transactions with only 1 action', () => {
  const state = { num: 0 };
  const store = createStore({ state });
  const payload = 1;
  transact(() => store.num.$set(payload));
  expect(store.num.$state).toEqual(payload);
  expect(currentAction(store)).toEqual({ type: 'num.$set()', payload })
})

test('should not support transactions if one of the actions has an async payload', () => {
  const state = { num: 0, str: '', bool: false };
  const store = createStore({ state });
  importOlikAsyncModule();
  expect(() => transact(
    () => store.num.$set(() => new Promise(resolve => resolve(1))),
    () => store.str.$set('x'),
  )).toThrow(errorMessages.ASYNC_PAYLOAD_INSIDE_TRANSACTION);
})


