import { beforeEach, expect, test } from 'vitest';
import { testState } from '../src';
import { createStore } from '../src/core';
import { connectOlikDevtoolsToStore } from '../src/devtools';
import { resetLibraryState } from '../src/utility';

beforeEach(() => {
  resetLibraryState();
  connectOlikDevtoolsToStore();
})

test('should load', async () => {
  expect(testState.fakeDevtoolsMessage).toEqual({ action: { type: '$load()' }, stateActions: [], changedIndices: [] });
  createStore({});
})

const objArray = [{ id: 1, text: 'one' }, { id: 2, text: 'two' }, { id: 3, text: 'three' }, { id: 4, text: 'four' }, { id: 5, text: 'five' }, { id: 6, text: 'six' }]

test('find then set property', () => {
  const store = createStore({
    objArray,
  });
  store.objArray.$find.id.$eq(2).text.$set('xxx');
  expect(testState.fakeDevtoolsMessage!.changedIndices).toEqual(['objArray.1.text']);
})

test('find then delete one', () => {
  const store = createStore({
    objArray,
  });
  store.objArray.$find.id.$eq(4).$delete();
  expect(testState.fakeDevtoolsMessage!.changedIndices).toEqual(['objArray.3']);
})

test('filter then delete one', () => {
  const store = createStore({
    objArray,
  });
  store.objArray.$filter.id.$eq(4).$delete();
  expect(testState.fakeDevtoolsMessage!.changedIndices).toEqual(['objArray.3']);
})

test('filter then delete many', () => {
  const store = createStore({
    objArray,
  });
  store.objArray.$filter.id.$lt(4).$delete();
  expect(testState.fakeDevtoolsMessage!.changedIndices).toEqual(['objArray.0', 'objArray.1', 'objArray.2']);
})

test('filter then set array', () => {
  const store = createStore({
    objArray,
  });
  store.objArray.$filter.id.$lt(3).$set([{ id: 5, text: 'five' }]);
  expect(testState.fakeDevtoolsMessage!.changedIndices).toEqual(['objArray.0', 'objArray.1']);
})

test('filter then set property', () => {
  const store = createStore({
    objArray,
  });
  store.objArray.$filter.id.$gt(4).text.$set('yyy');
  expect(testState.fakeDevtoolsMessage!.changedIndices).toEqual(['objArray.4.text', 'objArray.5.text']);
})

test('update deep object', () => {
  const store = createStore({
    obj: { one: { two: 'three' } }
  });
  store.obj.one.two.$set('four');
  expect(testState.fakeDevtoolsMessage!.changedIndices).toEqual(['obj.one.two']);
})

test('filter then set property', () => {
  const store = createStore({
    objArray,
  });
  store.objArray.$filter.id.$in([1, 2]).text.$set('xxx');
  expect(testState.fakeDevtoolsMessage!.changedIndices).toEqual(['objArray.0.text', 'objArray.1.text']);
})

test('merge existing element', () => {
  const store = createStore({
    objArray,
  });
  store.objArray.$mergeMatching.id.$with({ id: 2, text: 'xxx' });
  expect(testState.fakeDevtoolsMessage!.changedIndices).toEqual(['objArray.1']);
})

test('merge existing array', () => {
  const store = createStore({
    objArray,
  });
  store.objArray.$mergeMatching.id.$with([{ id: 1, text: 'xxx' }, { id: 2, text: 'xxx' }]);
  expect(testState.fakeDevtoolsMessage!.changedIndices).toEqual(['objArray.0', 'objArray.1']);
})

test('merge existing and new', () => {
  const store = createStore({
    objArray,
  });
  store.objArray.$mergeMatching.id.$with([{ id: 6, text: 'xxx' }, { id: 7, text: 'xxx' }]);
  expect(testState.fakeDevtoolsMessage!.changedIndices).toEqual(['objArray.5', 'objArray.6']);
})

test('merge new', () => {
  const store = createStore({
    objArray,
  });
  store.objArray.$mergeMatching.id.$with([{ id: 7, text: 'xxx' }, { id: 8, text: 'xxx' }]);
  expect(testState.fakeDevtoolsMessage!.changedIndices).toEqual(['objArray.6', 'objArray.7']);
})