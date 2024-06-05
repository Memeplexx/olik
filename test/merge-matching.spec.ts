
import { beforeEach, expect, test } from 'vitest';
import { createStore } from '../src/core';
import { configureDevtools } from '../src/devtools';
import { resetLibraryState } from '../src/utility';
import { testState } from '../src';

beforeEach(() => {
  resetLibraryState();
  configureDevtools();
})

test('should replace one array element where a match could be found', () => {
  const state = { arr: [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }] };
  const store = createStore(state);
  const payload = { id: 1, val: 5 };
  store.arr
    .$mergeMatching.id
    .$with(payload);
  expect(testState.currentActionType).toEqual('arr.$mergeMatching.id.$with()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.arr.$state).toEqual([payload, state.arr[1], state.arr[2]]);
})

test('should insert one array element where a match could not be found', () => {
  const state = { arr: [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }] };
  const store = createStore(state);
  const payload = { id: 4, val: 5 };
  store.arr
    .$mergeMatching.id
    .$with(payload);
  expect(testState.currentActionType).toEqual('arr.$mergeMatching.id.$with()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.arr.$state).toEqual([...state.arr, payload]);
})

test('should replace / insert array elements where one matches and another does not', () => {
  const state = { arr: [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }] };
  const store = createStore(state);
  const payload = [{ id: 1, val: 5 }, { id: 5, val: 5 }];
  store.arr
    .$mergeMatching.id
    .$with(payload);
  expect(testState.currentActionType).toEqual('arr.$mergeMatching.id.$with()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.arr.$state).toEqual([payload[0], state.arr[1], state.arr[2], payload[1]]);
})

test('should replace one array element where a match could be found', () => {
  const state = { arr: [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }] };
  const store = createStore(state);
  const payload = { id: 1, val: 5 };
  store.arr
    .$mergeMatching.id
    .$with(payload);
  expect(testState.currentActionType).toEqual('arr.$mergeMatching.id.$with()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([payload, state.arr[1], state.arr[2]]);
})

test('should insert one array element where a match could not be found', () => {
  const state = { arr: [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }] };
  const store = createStore(state);
  const payload = { id: 4, val: 5 };
  store.arr
    .$mergeMatching.id
    .$with(payload);
  expect(testState.currentActionType).toEqual('arr.$mergeMatching.id.$with()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([...state.arr, payload]);
})

test('should replace/insert array elements where one matches and another does not', () => {
  const state = { arr: [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }] };
  const store = createStore(state);
  const payload = [{ id: 1, val: 5 }, { id: 5, val: 5 }];
  store.arr
    .$mergeMatching.id
    .$with(payload);
  expect(testState.currentActionType).toEqual('arr.$mergeMatching.id.$with()');
  expect(testState.currentActionPayload).toEqual(payload);
  expect(store.$state.arr).toEqual([payload[0], state.arr[1], state.arr[2], payload[1]]);
})

test('mergeMatching with multiple primitives', () => {
  const store = createStore({
    arr: [{ fk1: 1, fk2: 'one', val: 'a' }, { fk1: 2, fk2: 'two', val: 'b' }, { fk1: 3, fk2: 'three', val: 'c' }],
  });
  store.arr.$mergeMatching.fk1.$and.fk2.$with({ fk1: 1, fk2: 'one', val: 'z' });
  expect(store.arr.$state).toEqual([{ fk1: 1, fk2: 'one', val: 'z' }, { fk1: 2, fk2: 'two', val: 'b' }, { fk1: 3, fk2: 'three', val: 'c' }]);
  expect(testState.currentActionType).toEqual('arr.$mergeMatching.fk1.$and.fk2.$with()');
})

test('mergeMatching with a primitive and an object', () => {
  const store = createStore({
    arr: [{ fk1: 1, fk2: { o: 'one' }, val: 'a' }, { fk1: 2, fk2: { o: 'two' }, val: 'b' }, { fk1: 3, fk2: { o: 'three' }, val: 'c' }],
  });
  store.arr.$mergeMatching.fk1.$and.fk2.o.$with({ fk1: 1, fk2: { o: 'one' }, val: 'z' });
  expect(store.arr.$state).toEqual([{ fk1: 1, fk2: { o: 'one' }, val: 'z' }, { fk1: 2, fk2: { o: 'two' }, val: 'b' }, { fk1: 3, fk2: { o: 'three' }, val: 'c' }]);
  expect(testState.currentActionType).toEqual('arr.$mergeMatching.fk1.$and.fk2.o.$with()');
})