import { createStore } from '../src/core';
import { test, expect, beforeEach } from 'vitest';
import { resetLibraryState } from '../src/utility';
import { testState } from '../src';
import { Brand } from '../src/type';
import { configureDevtools } from '../src/devtools';


beforeEach(() => {
  resetLibraryState();
  configureDevtools();
})

test('should merge a number', () => {
  const store = createStore({ nums: [1, 4, 5] });
  store.nums.$merge(2);
  expect(testState.currentActionType).toEqual('nums.$merge()');
  expect(testState.currentActionPayload).toEqual(2);
  expect(store.$state).toEqual({ nums: [1, 4, 5, 2] });
})

test('should merge a branded number', () => { ///////
  type BrandedNumber = Brand<number, 'number'>;
  const store = createStore({ nums: [1, 4, 5] as Array<BrandedNumber> });
  store.nums.$merge(2 as BrandedNumber);
  expect(testState.currentActionType).toEqual('nums.$merge()');
  expect(testState.currentActionPayload).toEqual(2);
  expect(store.$state).toEqual({ nums: [1, 4, 5, 2] });
})

test('should merge a number with duplicate', () => {
  const store = createStore({ nums: [1, 4, 5] });
  store.nums.$merge(4);
  expect(testState.currentActionType).toEqual('nums.$merge()');
  expect(testState.currentActionPayload).toEqual(4);
  expect(store.$state).toEqual({ nums: [1, 4, 5] });
})

test('should merge a number list', () => {
  const store = createStore({ nums: [1, 4, 5] });
  store.nums.$merge([2, 5, 7, 2]);
  expect(testState.currentActionType).toEqual('nums.$merge()');
  expect(testState.currentActionPayload).toEqual([2, 5, 7, 2]);
  expect(store.$state).toEqual({ nums: [1, 4, 5, 2, 7, 2] });
})

test('should merge a branded number list', () => {
  const store = createStore({ nums: [1, 4, 5] as Array<Brand<number, 'number'>> });
  store.nums.$merge([2, 5, 7, 2] as Array<Brand<number, 'number'>>);
  expect(testState.currentActionType).toEqual('nums.$merge()');
  expect(testState.currentActionPayload).toEqual([2, 5, 7, 2]);
  expect(store.$state).toEqual({ nums: [1, 4, 5, 2, 7, 2] });
})
