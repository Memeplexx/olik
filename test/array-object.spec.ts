import { beforeEach, expect, test } from 'vitest';
import { testState } from '../src';
import { createStore } from '../src/core';
import { configureDevtools } from '../src/devtools';
import { resetLibraryState } from '../src/utility';


const state = { arr: [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }] };

beforeEach(() => {
  resetLibraryState();
  configureDevtools();
})

test('should replace all elements', () => {
  const store = createStore(state);
  const payload = [{ id: 5, val: 5 }, { id: 6, val: 6 }, { id: 7, val: 7 }];
  store.arr
    .$set(payload);
  expect(testState.currentActionType).toEqual('arr.$set()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual(payload);
})

test('should remove all elements', () => {
  const store = createStore(state);
  store.arr
    .$clear();
  expect(testState.currentActionType).toEqual('arr.$clear()');
  expect(store.$state.arr).toEqual([]);
})

test('should replace all elements properties', () => {
  const store = createStore(state);
  const payload = 9;
  store.arr.val
    .$set(payload);
  expect(testState.currentActionType).toEqual('arr.val.$set()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual(state.arr.map(s => ({ ...s, val: payload })));
})

test('should increment all elements properties', () => {
  const store = createStore(state);
  const payload = 1;
  store.arr.val
    .$add(payload);
  expect(testState.currentActionType).toEqual('arr.val.$add()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([{ id: 1, val: 2 }, { id: 2, val: 3 }, { id: 3, val: 4 }]);
})

test('should be able to insert one element', () => {
  const store = createStore(state);
  const payload = { id: 4, val: 4 };
  store.arr
    .$push(payload);
  expect(testState.currentActionType).toEqual('arr.$push()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([...state.arr, payload]);
})

test('should be able to insert many elements', () => {
  const store = createStore(state);
  const payload = [{ id: 4, val: 4 }, { id: 5, val: 5 }];
  store.arr
    .$pushMany(payload);
  expect(testState.currentActionType).toEqual('arr.$pushMany()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([...state.arr, ...payload]);
})

test('should find an element and replace it', () => {
  const store = createStore(state);
  const payload = { id: 4, val: 4 };
  store.arr
    .$find.id.$eq(2)
    .$set(payload);
  expect(testState.currentActionType).toEqual('arr.$find.id.$eq(2).$set()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([state.arr[0], payload, state.arr[2]]);
})

test('should find an element and remove it', () => {
  const store = createStore(state);
  store.arr
    .$find.id.$eq(2)
    .$delete();
  expect(testState.currentActionType).toEqual('arr.$find.id.$eq(2).$delete()');
  expect(store.$state.arr).toEqual([state.arr[0], state.arr[2]]);
})

test('should find an element property and increment it', () => {
  const store = createStore(state);
  const payload = 2;
  store.arr
    .$find.id.$eq(2).val
    .$add(payload);
  expect(testState.currentActionType).toEqual('arr.$find.id.$eq(2).val.$add()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([state.arr[0], { id: 2, val: 4 }, state.arr[2]]);
})

test('should find an element by one clause or another and replace it', () => {
  const store = createStore(state);
  const payload = { id: 9, val: 9 };
  store.arr
    .$find.id.$eq(1).$or.id.$eq(2)
    .$set(payload);
  expect(testState.currentActionType).toEqual('arr.$find.id.$eq(1).$or.id.$eq(2).$set()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([payload, state.arr[1], state.arr[2]]);
})

test('should find an element by one clause or another and remove it', () => {
  const store = createStore(state);
  store.arr
    .$find.id.$eq(1).$or.id.$eq(2)
    .$delete();
  expect(testState.currentActionType).toEqual('arr.$find.id.$eq(1).$or.id.$eq(2).$delete()');
  expect(store.$state.arr).toEqual([state.arr[1], state.arr[2]]);
})

test('should find an element by one clause or another and increment it', () => {
  const store = createStore(state);
  const payload = 1;
  store.arr
    .$find.id.$eq(1).$or.id.$eq(2).val
    .$add(1);
  expect(testState.currentActionType).toEqual('arr.$find.id.$eq(1).$or.id.$eq(2).val.$add()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([{ id: 1, val: 2 }, state.arr[1], state.arr[2]]);
})

test('should find an element by one clause and another and replace it', () => {
  const store = createStore(state);
  const payload = { id: 9, val: 9 };
  store.arr
    .$find.id.$gt(1).$and.id.$lt(3)
    .$set(payload);
  expect(testState.currentActionType).toEqual('arr.$find.id.$gt(1).$and.id.$lt(3).$set()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([state.arr[0], { id: 9, val: 9 }, state.arr[2]]);
})

test('should find an element by one clause and another and remove it', () => {
  const store = createStore(state);
  store.arr
    .$find.id.$gt(1).$and.id.$lt(3)
    .$delete();
  expect(testState.currentActionType).toEqual('arr.$find.id.$gt(1).$and.id.$lt(3).$delete()');
  expect(store.$state.arr).toEqual([state.arr[0], state.arr[2]]);
})

test('should find an element by one clause and another and increment it', () => {
  const store = createStore(state);
  const payload = 1;
  store.arr
    .$find.id.$eq(1).$and.id.$lt(2).val
    .$add(payload);
  expect(testState.currentActionType).toEqual('arr.$find.id.$eq(1).$and.id.$lt(2).val.$add()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([{ id: 1, val: 2 }, state.arr[1], state.arr[2]]);
})

test('should filter elements and remove them', () => {
  const store = createStore(state);
  store.arr
    .$filter.id.$gt(1)
    .$delete();
  expect(testState.currentActionType).toEqual('arr.$filter.id.$gt(1).$delete()');
  expect(store.$state.arr).toEqual([state.arr[0]]);
})

test('should filter elements and increment them', () => {
  const store = createStore(state);
  const payload = 1;
  store.arr
    .$filter.id.$gt(1).val
    .$add(1);
  expect(testState.currentActionType).toEqual('arr.$filter.id.$gt(1).val.$add()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([state.arr[0], { id: 2, val: 3 }, { id: 3, val: 4 }]);
})

test('should filter elements by one clause or another and remove them', () => {
  const store = createStore(state);
  store.arr
    .$filter.id.$eq(1).$or.id.$eq(2)
    .$delete();
  expect(testState.currentActionType).toEqual('arr.$filter.id.$eq(1).$or.id.$eq(2).$delete()');
  expect(store.$state.arr).toEqual([state.arr[2]]);
})

test('should filter elements by one clause or another and increment them', () => {
  const store = createStore(state);
  const payload = 1;
  store.arr
    .$filter.id.$eq(1).$or.id.$eq(2).val
    .$add(1);
  expect(testState.currentActionType).toEqual('arr.$filter.id.$eq(1).$or.id.$eq(2).val.$add()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([{ id: 1, val: 2 }, { id: 2, val: 3 }, state.arr[2]]);
})

test('should filter elements by one clause and another and remove them', () => {
  const store = createStore(state);
  store.arr
    .$filter.id.$gt(0).$and.id.$lt(3)
    .$delete();
  expect(testState.currentActionType).toEqual('arr.$filter.id.$gt(0).$and.id.$lt(3).$delete()');
  expect(store.$state.arr).toEqual([state.arr[2]]);
})

test('should filter elements by one clause and another and increment them', () => {
  const store = createStore(state);
  const payload = 1;
  store.arr
    .$filter.id.$gt(0).$and.id.$gt(1).val
    .$add(1);
  expect(testState.currentActionType).toEqual('arr.$filter.id.$gt(0).$and.id.$gt(1).val.$add()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([state.arr[0], { id: 2, val: 3 }, { id: 3, val: 4 }]);
})

test('should repsert one array element where a match could be found', () => {
  const store = createStore(state);
  const payload = { id: 1, val: 5 };
  store.arr
    .$mergeMatching.id
    .$with(payload);
  expect(testState.currentActionType).toEqual('arr.$mergeMatching.id.$with()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([payload, state.arr[1], state.arr[2]]);
})

test('should repsert one array element where a match could not be found', () => {
  const store = createStore(state);
  const payload = { id: 4, val: 5 };
  store.arr
    .$mergeMatching.id
    .$with(payload);
  expect(testState.currentActionType).toEqual('arr.$mergeMatching.id.$with()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([...state.arr, payload]);
})

test('should repsert array elements where one matches and another does not', () => {
  const store = createStore(state);
  const payload = [{ id: 1, val: 5 }, { id: 5, val: 5 }];
  store.arr
    .$mergeMatching.id
    .$with(payload);
  expect(testState.currentActionType).toEqual('arr.$mergeMatching.id.$with()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([payload[0], state.arr[1], state.arr[2], payload[1]]);
})
