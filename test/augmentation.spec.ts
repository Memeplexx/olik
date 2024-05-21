
import { beforeEach, expect, test } from 'vitest';
import { augment } from '../src/augment';
import { createStore } from '../src/core';
import { configureDevtools } from '../src/devtools';
import { resetLibraryState } from '../src/utility';

beforeEach(() => {
  resetLibraryState();
  configureDevtools();
})

test('should be able to augment a selection', () => {
  augment({
    selection: {
      myThing: input => () => input.$state,
    }
  })
  const state = { num: 42 };
  const store = createStore(state);
  const res = (store.num as unknown as { myThing: () => unknown }).myThing();
  expect(res).toEqual(42);
})

test('should be able to augment a selection on an array action', () => {
  augment({
    selection: {
      myThing: input => () => input.$state,
    }
  })
  const state = { array: [42] };
  const store = createStore(state);
  const res = (store.array as unknown as { myThing: () => unknown }).myThing();
  expect(res).toEqual([42]);
})

test('should be able to augment a selection on an array element action', () => {
  augment({
    selection: {
      myThing: input => () => input.$state,
    }
  })
  const state = { array: [42] };
  const store = createStore(state);
  const res = (store.array.$find.$eq(42) as unknown as { myThing: () => unknown }).myThing();
  expect(res).toEqual(42);
})
