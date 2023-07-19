import { createStore } from '../src/core';
import { resetLibraryState } from '../src/utility';
import { currentAction } from './_utility';
import { test, expect, beforeEach } from 'vitest';

const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] }

beforeEach(() => {
  resetLibraryState();
})

test('should find an element with one clause and another and replace it', () => {
  const store = createStore({ state });
  const payload = { id: 4, num: 4 };
  store.arr
    .$find.id.$eq(1).$and.id.$lt(2)
    .$set(payload);
  expect(store.$state).toEqual({ ...state, arr: [payload, state.arr[1], state.arr[2]] })
});

test('should find an element with one clause and another and patch it', () => {
  const store = createStore({ state });
  const payload = { num: 4 };
  store.arr
    .$find.id.$eq(1).$and.id.$lt(2)
    .$setSome(payload);
  expect(store.$state).toEqual({ ...state, arr: [{ ...state.arr[0], ...payload }, state.arr[1], state.arr[2]] })
});

test('should find an element with one clause and another and remove it', () => {
  const store = createStore({ state });
  store.arr
    .$find.id.$eq(1).$and.id.$lt(2)
    .$delete();
  expect(store.$state).toEqual({ ...state, arr: [state.arr[1], state.arr[2]] })
});

test('should find an element with one clause or another and replace it', () => {
  const store = createStore({ state });
  const payload = { id: 4, num: 4 };
  store.arr
    .$find.id.$eq(1).$or.id.$lt(2)
    .$set(payload);
  expect(store.$state).toEqual({ ...state, arr: [payload, state.arr[1], state.arr[2]] })
});

test('should find an element with one clause or another and patch it', () => {
  const store = createStore({ state });
  const payload = { num: 4 };
  store.arr
    .$find.id.$eq(1).$or.id.$lt(2)
    .$setSome(payload);
  expect(store.$state).toEqual({ ...state, arr: [{ ...state.arr[0], ...payload }, state.arr[1], state.arr[2]] })
});

test('should find an element with one clause or another and remove it', () => {
  const store = createStore({ state });
  store.arr
    .$find.id.$eq(1).$or.id.$lt(2)
    .$delete();
  expect(store.$state).toEqual({ ...state, arr: [state.arr[1], state.arr[2]] })
});

test('should filter elements with one clause and another and patch them', () => {
  const store = createStore({ state });
  const payload = { num: 4 };
  store.arr
    .$filter.id.$eq(1).$and.id.$lt(3)
    .$setSome(payload);
  expect(store.$state).toEqual({ ...state, arr: [{ ...state.arr[0], ...payload }, state.arr[1], state.arr[2]] })
});

test('should filter elements with one clause and another and remove them', () => {
  const store = createStore({ state });
  store.arr
    .$filter.id.$eq(1).$and.id.$lt(3)
    .$delete();
  expect(store.$state).toEqual({ ...state, arr: [state.arr[1], state.arr[2]] })
});

test('should filter elements with one clause or another and patch them', () => {
  const store = createStore({ state });
  const payload = { num: 4 };
  store.arr
    .$filter.id.$eq(1).$or.id.$lt(3)
    .$setSome(payload);
  expect(store.$state).toEqual({ ...state, arr: [{ ...state.arr[0], ...payload }, { ...state.arr[1], ...payload }, state.arr[2]] })
});

test('should filter elements with one clause or another and remove them', () => {
  const store = createStore({ state });
  store.arr
    .$filter.id.$eq(1).$or.id.$lt(3)
    .$delete();
  expect(store.$state).toEqual({ ...state, arr: [state.arr[2]] })
});

test('should find an element by a clause and a clause or a clause, and then replace it', () => {
  const store = createStore({ state });
  const payload = { id: 4, num: 4 };
  store.arr
    .$find.id.$eq(1)
    .$and.id.$eq(2)
    .$or.id.$eq(3)
    .$set(payload);
  expect(currentAction(store)).toEqual({
    type: `arr.find.id.eq(1).and.id.eq(2).or.id.eq(3).set()`,
    payload,
  });
  expect(store.$state).toEqual({ arr: [state.arr[0], state.arr[1], payload] });
})

test('should find an element by a clause and a clause or a clause, and then remove it', () => {
  const store = createStore({ state });
  store.arr
    .$find.id.$eq(1)
    .$and.id.$eq(2)
    .$or.id.$eq(3)
    .$delete();
  expect(currentAction(store)).toEqual({
    type: `arr.find.id.eq(1).and.id.eq(2).or.id.eq(3).delete()`,
  });
  expect(store.$state).toEqual({ arr: [state.arr[0], state.arr[1]] });
})

test('should find an element by a clause or a clause and a clause, and then replace it', () => {
  const store = createStore({ state });
  const payload = { id: 4, num: 4 };
  store.arr
    .$find.id.$eq(4)
    .$or.id.$eq(3)
    .$and.num.$eq(3)
    .$set(payload);
  expect(currentAction(store)).toEqual({
    type: `arr.find.id.eq(4).or.id.eq(3).and.num.eq(3).set()`,
    payload,
  });
  expect(store.$state).toEqual({ arr: [state.arr[0], state.arr[1], payload] });
})

test('should find an element by a clause or a clause and a clause, and then remove it', () => {
  const store = createStore({ state });
  store.arr
    .$find.id.$eq(4)
    .$or.id.$eq(3)
    .$and.num.$eq(3)
    .$delete();
  expect(currentAction(store)).toEqual({
    type: `arr.find.id.eq(4).or.id.eq(3).and.num.eq(3).delete()`,
  });
  expect(store.$state).toEqual({ arr: [state.arr[0], state.arr[1]] });
})

test('should find an element by a clause and a clause or a clause and a clause, and then replace it', () => {
  const store = createStore({ state });
  const payload = { id: 4, num: 4 };
  store.arr
    .$find.id.$eq(1)
    .$and.num.$eq(1)
    .$or.id.$eq(3)
    .$and.num.$eq(3)
    .$set(payload);
  expect(currentAction(store)).toEqual({
    type: `arr.find.id.eq(1).and.num.eq(1).or.id.eq(3).and.num.eq(3).set()`,
    payload,
  });
  expect(store.$state).toEqual({ arr: [payload, state.arr[1], state.arr[2]] });
})

test('should find an element by a clause and a clause or a clause and a clause, and then remove it', () => {
  const store = createStore({ state });
  store.arr
    .$find.id.$eq(1)
    .$and.num.$eq(1)
    .$or.id.$eq(3)
    .$and.num.$eq(3)
    .$delete();
  expect(currentAction(store)).toEqual({
    type: `arr.find.id.eq(1).and.num.eq(1).or.id.eq(3).and.num.eq(3).delete()`,
  });
  expect(store.$state).toEqual({ arr: [state.arr[1], state.arr[2]] });
})