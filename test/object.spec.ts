import { libState } from '../src';
import { createStore } from '../src/core';
import { connectOlikDevtoolsToStore } from '../src/devtools';
import { resetLibraryState } from '../src/utility';
import { test, expect, beforeEach } from 'vitest';

const state = { num: 0, str: '', bool: false };

beforeEach(() => {
  resetLibraryState();
  connectOlikDevtoolsToStore();
})

test('should replace an object property', () => {
  const store = createStore(state);
  const payload = 1;
  store.num
    .$set(payload);
  expect(libState.currentAction).toEqual({ type: 'num.$set()', payload });
  expect(store.num.$state).toEqual(1);
})

test('should toggle an object property', () => {
  const store = createStore(state);
  store.bool
    .$toggle();
  expect(libState.currentAction).toEqual({ type: 'bool.$toggle()' });
  expect(store.bool.$state).toEqual(true);
})

test('should patch an object', () => {
  const store = createStore(state);
  const payload = { bool: true, str: 'x' };
  store.$patch({ bool: true, str: 'x' });
  expect(libState.currentAction).toEqual({ type: '$patch()', payload });
  expect(store.$state).toEqual({ ...state, ...payload });
})

test('should deep merge an object', () => {
  const state = { num: 0, obj: { num: 0, str: '', arr: [{ id: 1, num: 1 }] } };
  const store = createStore(state);
  store.$patchDeep({ num: 9, obj: { str: 'x', arr: [{ num: 4 }] } });
  expect(store.$state).toEqual({ num: 9, obj: { num: 0, str: 'x', arr: [{ num: 4 }] } });
})

test('should increment an object property', () => {
  const store = createStore(state);
  const payload = 1;
  store.num
    .$add(payload);
  expect(libState.currentAction).toEqual({ type: 'num.$add()', payload });
  expect(store.num.$state).toEqual(1);
})

test('should remove an object property', () => {
  const store = createStore(state);
  store.num
    .$delete();
  expect(store.$state).toEqual({ str: '', bool: false });
})

test('should listen to onChange events correctly', () => {
  const state = { num1: 0, num2: 0 };
  const store = createStore(state);
  let rootChangeCount = 0;
  let num1ChangeCount = 0;
  let num2ChangeCount = 0;
  store.$onChange(() => rootChangeCount++);
  const l1 = store.num1.$onChange(() => num1ChangeCount++);
  store.num2.$onChange(() => num2ChangeCount++);
  store.num1.$add(1);
  expect(num1ChangeCount).toEqual(1);
  expect(num2ChangeCount).toEqual(0);
  store.num2.$add(2);
  expect(num1ChangeCount).toEqual(1);
  expect(num2ChangeCount).toEqual(1);
  expect(rootChangeCount).toEqual(2);
  l1.unsubscribe();
  store.num1.$add(1);
  expect(num1ChangeCount).toEqual(1);
})

test('should fire onChange correctly when updating an array element', () => {
  const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] };
  const store = createStore(state);
  let changeCount = 0;
  store.arr.$find.id.$eq(1).$onChange(() => changeCount++);
  store.arr.$find.id.$eq(2).num.$add(1);
  expect(changeCount).toEqual(0);
  store.arr.$find.id.$eq(1).num.$add(1);
  expect(changeCount).toEqual(1);
})

test('should filter array elements correctly', () => {
  const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] };
  const select = createStore(state);
  expect(select.arr.$filter.id.$eq(1).$or.num.$eq(2).id.$state).toEqual([1, 2]);
})

test('should filter array elements and increment their property', () => {
  const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] };
  const select = createStore(state);
  select.arr
    .$filter.id.$eq(1).$or.num.$eq(2)
    .id.$add(1);
  expect(select.arr.$state).toEqual([{ id: 2, num: 1 }, { id: 3, num: 2 }]);
})

test('should patch all elements in an array', () => {
  const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] };
  const select = createStore(state);
  select.arr.$patch({ num: 9 });
  expect(select.arr.$state).toEqual([{ id: 1, num: 9 }, { id: 2, num: 9 }]);
})

test('should insert a node', () => {
  const store = createStore({ one: '' });
  store.$setNew({ two: 1 })
  expect(store.$state).toEqual({ one: '', two: 1 });
})

test('should insert a node sub property', () => {
  const store = createStore({ one: {} });
  store.one.$setNew({ two: 1 })
  expect(store.$state).toEqual({ one: { two: 1 } });
})
