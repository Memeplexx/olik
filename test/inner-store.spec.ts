import { libState } from '../src/constant';
import { createInnerStore, createStore } from '../src/core';
import { connectOlikDevtoolsToStore } from '../src/devtools';
import { Store } from '../src/type';
import { resetLibraryState } from '../src/utility';
import { test, expect, beforeEach } from 'vitest';


const key = 'inner';
const innerState = { hello: 'world', num: 0 };

const state = {
  object: { property: 'one', property2: 'two' },
  arr: [{ id: 1, name: 'a' }],
};

beforeEach(() => {
  resetLibraryState();
  connectOlikDevtoolsToStore();
})

test('should be able to perform a basic update', () => {
  const store = createStore(state);
  const inner = createInnerStore({ [key]: innerState }).usingAccessor(s => s[key]);
  expect(store.$state).toEqual({ ...state, [key]: innerState });
  inner.hello.$set('another');
  expect(store.$state).toEqual({ ...state, [key]: { ...innerState, hello: 'another' } });
})

test('root store should be able to receive onChange events', () => {
  const store = createStore(state);
  const inner = createInnerStore({ [key]: innerState }).usingAccessor(s => s[key]);
  let numChanges = 0;
  store.$onChange(() => numChanges++);
  inner.hello.$set('another');
  expect(numChanges).toEqual(1);
})

test('inner store should be able to receive onChange events', () => {
  createStore(state);
  const inner = createInnerStore({ [key]: innerState }).usingAccessor(s => s[key]);
  let numChanges = 0;
  inner.$onChange(change => {
    expect(change).toEqual({ ...innerState, hello: 'another' });
    numChanges++;
  });
  inner.hello.$set('another');
  expect(numChanges).toEqual(1);
})

test('should be able to detach an inner store', () => {
  createStore(state);
  const inner = createInnerStore({ [key]: innerState }).usingAccessor(s => s[key]);
  inner.$delete();
})

test('should be able to update the inner store from the outer store', () => {
  const store = createStore(state);
  createInnerStore({ [key]: innerState }).usingAccessor(s => s[key]);
  const storeTyped = store as Store<typeof state & { inner: typeof innerState }>;
  storeTyped.inner.hello.$set('another');
  expect(store.$state).toEqual({ ...state, [key]: { ...innerState, hello: 'another' } });
});

test('should be able to create a detached store', () => {
  createInnerStore({ [key]: innerState }).usingAccessor(s => s[key]);
  expect(libState.store!.$state).toEqual({ [key]: innerState });
})

test('should cancel all onChange events', () => {
  const store = createStore(state);
  const inner = createInnerStore({ [key]: innerState }).usingAccessor(s => s[key]);
  let numChanges = 0;
  store.object.$onChange(() => {
    numChanges++;
  })
  inner.$onChange(() => {
    numChanges++;
  });
  inner.$delete();
  expect(numChanges).toEqual(0);
  store.object.property.$set('ddd');
  expect(numChanges).toEqual(1);
})
