import { testState } from '../src';
import { createStore } from '../src/core';
import { configureDevtools } from '../src/devtools';
import { resetLibraryState } from '../src/utility';
import { test, expect, beforeEach } from 'vitest';

const state = { arr: [1, 2, 3] };

beforeEach(() => {
  resetLibraryState();
  configureDevtools();
})

test('should replace all elements', () => {
  const store = createStore(state);
  const payload = [4, 5, 6];
  store.arr
    .$set(payload);
  expect(testState.currentActionType).toEqual('arr.$set()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state).toEqual({ arr: [4, 5, 6] });
})

test('should remove all elements', () => {
  const store = createStore(state);
  store.arr
    .$clear();
  expect(testState.currentActionType).toEqual('arr.$clear()');
  expect(store.$state).toEqual({ arr: [] });
})

test('should increment all elements', () => {
  const store = createStore(state);
  const payload = 1;
  store.arr
    .$add(payload);
  expect(testState.currentActionType).toEqual('arr.$add()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state).toEqual({ arr: [2, 3, 4] });
})

test('should be able to insert one primitive', () => {
  const store = createStore(state);
  const payload = 4;
  store.arr
    .$push(payload);
  expect(testState.currentActionType).toEqual('arr.$push()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state).toEqual({ arr: [1, 2, 3, 4] });
})

test('should be able to insert many primitives', () => {
  const store = createStore(state);
  const payload = [4, 5, 6];
  store.arr
    .$pushMany(payload);
  expect(testState.currentActionType).toEqual('arr.$pushMany()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state).toEqual({ arr: [1, 2, 3, 4, 5, 6] });
})

test('should be able to slice', () => {
  const store = createStore(state);
  store.arr
    .$slice({ start: 1, end: 2 })
  expect(testState.currentActionType).toEqual('arr.$slice()');
  expect(store.$state).toEqual({ arr: [2] });
})

test('should find an element and replace it', () => {
  const store = createStore(state);
  const payload = 9;
  store.arr
    .$find.$eq(2)
    .$set(payload);
  expect(testState.currentActionType).toEqual('arr.$find.$eq(2).$set()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state).toEqual({ arr: [1, 9, 3] });
})

test('should find an element and remove it', () => {
  const store = createStore(state);
  store.arr
    .$find.$eq(2)
    .$delete();
  expect(testState.currentActionType).toEqual('arr.$find.$eq(2).$delete()');
  expect(store.$state).toEqual({ arr: [1, 3] });
})

test('should find an element and increment it', () => {
  const store = createStore(state);
  const payload = 2;
  store.arr
    .$find.$eq(2)
    .$add(payload);
  expect(testState.currentActionType).toEqual('arr.$find.$eq(2).$add()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state).toEqual({ arr: [1, 4, 3] });
})

test('should find an element by one clause or another and replace it', () => {
  const store = createStore(state);
  const payload = 9;
  store.arr
    .$find.$eq(1).$or.$eq(2)
    .$set(payload);
  expect(testState.currentActionType).toEqual('arr.$find.$eq(1).$or.$eq(2).$set()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state).toEqual({ arr: [9, 2, 3] });
})

test('should find an element by one clause or another and remove it', () => {
  const store = createStore(state);
  store.arr
    .$find.$eq(1).$or.$eq(2)
    .$delete();
  expect(testState.currentActionType).toEqual('arr.$find.$eq(1).$or.$eq(2).$delete()');
  expect(store.$state).toEqual({ arr: [2, 3] });
})

test('should find an element by one clause or another and increment it', () => {
  const store = createStore(state);
  const payload = 1;
  store.arr
    .$find.$eq(1).$or.$eq(2)
    .$add(1);
  expect(testState.currentActionType).toEqual('arr.$find.$eq(1).$or.$eq(2).$add()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state).toEqual({ arr: [2, 2, 3] });
})

test('should find an element by one clause and another and replace it', () => {
  const store = createStore(state);
  const payload = 9;
  store.arr
    .$find.$gt(1).$and.$lt(3)
    .$set(payload);
  expect(testState.currentActionType).toEqual('arr.$find.$gt(1).$and.$lt(3).$set()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state).toEqual({ arr: [1, 9, 3] });
})

test('should find an element by one clause and another and remove it', () => {
  const store = createStore(state);
  store.arr
    .$find.$gt(1).$and.$lt(3)
    .$delete();
  expect(testState.currentActionType).toEqual('arr.$find.$gt(1).$and.$lt(3).$delete()');
  expect(store.$state).toEqual({ arr: [1, 3] });
})

test('should find an element by one clause and another and increment it', () => {
  const store = createStore(state);
  const payload = 1;
  store.arr
    .$find.$eq(1).$and.$lt(2)
    .$add(payload);
  expect(testState.currentActionType).toEqual('arr.$find.$eq(1).$and.$lt(2).$add()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state).toEqual({ arr: [2, 2, 3] });
})

test('should filter elements and remove them', () => {
  const store = createStore(state);
  store.arr
    .$filter.$gt(1)
    .$delete();
  expect(testState.currentActionType).toEqual('arr.$filter.$gt(1).$delete()');
  expect(store.$state).toEqual({ arr: [1] });
})

test('should filter elements and increment them', () => {
  const store = createStore(state);
  const payload = 1;
  store.arr
    .$filter.$gt(1)
    .$add(1);
  expect(testState.currentActionType).toEqual('arr.$filter.$gt(1).$add()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state).toEqual({ arr: [1, 3, 4] });
})

test('should filter elements by one clause or another and remove them', () => {
  const store = createStore(state);
  store.arr
    .$filter.$eq(1).$or.$eq(2)
    .$delete();
  expect(testState.currentActionType).toEqual('arr.$filter.$eq(1).$or.$eq(2).$delete()');
  expect(store.$state).toEqual({ arr: [3] });
})

test('should filter elements by one clause or another and increment them', () => {
  const store = createStore(state);
  const payload = 1;
  store.arr
    .$filter.$eq(1).$or.$eq(2)
    .$add(1);
  expect(testState.currentActionType).toEqual('arr.$filter.$eq(1).$or.$eq(2).$add()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state).toEqual({ arr: [2, 3, 3] });
})

test('should filter elements by one clause and another and remove them', () => {
  const store = createStore(state);
  store.arr
    .$filter.$gt(0).$and.$lt(3)
    .$delete();
  expect(testState.currentActionType).toEqual('arr.$filter.$gt(0).$and.$lt(3).$delete()');
  expect(store.$state).toEqual({ arr: [3] });
})

test('should filter elements by one clause and another and increment them', () => {
  const store = createStore(state);
  const payload = 1;
  store.arr
    .$filter.$gt(0).$and.$gt(1)
    .$add(1);
  expect(testState.currentActionType).toEqual('arr.$filter.$gt(0).$and.$gt(1).$add()');
  expect(testState.currentActionPayload).toEqual(payload);
})
