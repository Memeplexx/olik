import { beforeEach, expect, test } from 'vitest';
import { testState } from '../src';
import { createStore } from '../src/core';
import { derive } from '../src/derive';
import { configureDevtools } from '../src/devtools';
import { resetLibraryState } from '../src/utility';

beforeEach(() => {
  resetLibraryState();
  configureDevtools();
})

test('should support derivations', () => {
  const state = {
    array: ['1', '2'],
    counter: 3,
  };
  const store = createStore(state);
  const mem = derive(
    store.array,
    store.counter,
  ).$with((arr, counter) => {
    return arr.concat(counter.toString())
  });
  const result = mem.$state;
  expect(result).toEqual(['1', '2', '3']);
})

test('should derive on specific array element', () => {
  const state = {
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    object: { hello: 'world' },
  };
  const store = createStore(state);
  let recalculating = 0;
  const mem = derive(
    store.array.$find.id.$eq(2)
  ).$with(() => {
    recalculating++;
    return '';
  });
  store.array
    .$find.id.$eq(2)
    .$patch({ value: 'twoo' });
  mem.$state;
  store.array
    .$find.id.$eq(1)
    .$patch({ value: 'onee' });
  mem.$state;
  expect(recalculating).toEqual(1);
})

test('should be able to derive from using a derivation as an argument', () => { ///////// DOUBLE CHECK
  const state = { num: 0, str: 'x' };
  const store = createStore(state);
  let originalMemoCalcCount = 0;
  const mem = derive(
    store.num,
    store.str,
  ).$with((num, str) => {
    originalMemoCalcCount++;
    return str + num;
  });
  const mem2 = derive(
    store.str,
    mem,
  ).$with((s1, s2) => {
    return s1 + s2;
  });
  expect(mem2.$state).toEqual('xx0');
  expect(originalMemoCalcCount).toEqual(1);
})

test('should derive with a find', () => {
  const state = {
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };
  const store = createStore(state);
  let memoCalcCount = 0;
  const mem = derive(
    store.array.$find.id.$eq(2),
  ).$with(thing => {
    memoCalcCount++;
    return thing;
  });
  mem.$state;
  mem.$state;
  store.array.$find.id.$eq(1).$patch({ value: 'xxx' });
  expect(memoCalcCount).toEqual(1);
  store.array.$find.id.$eq(2).$patch({ value: 'xxx' });
  mem.$state;
  expect(memoCalcCount).toEqual(2);
})

test('should derive with a filter', () => {
  const state = {
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };
  const store = createStore(state);
  let memoCalcCount = 0;
  const mem = derive(
    store.array.$filter.id.$lte(2),
  ).$with(thing => {
    memoCalcCount++;
    return thing;
  });
  mem.$state;
  mem.$state;
  expect(memoCalcCount).toEqual(1);
  store.array.$find.id.$eq(1).$patch({ value: 'xxx' });
  mem.$state;
  mem.$state;
  expect(memoCalcCount).toEqual(2);
  store.array.$find.id.$eq(2).$patch({ value: 'xxx' });
  mem.$state;
  mem.$state;
  expect(memoCalcCount).toEqual(3);
})

test('should invalidate a derivation', () => {
  const store = createStore({
    num: 0,
    str: '',
  });
  let memoCalcCount = 0;
  const mem = derive(
    store.num,
  ).$with(thing => {
    memoCalcCount++;
    return thing;
  });
  mem.$state;
  mem.$state;
  expect(memoCalcCount).toEqual(1);
  mem.$invalidate();
  mem.$state;
  mem.$state;
  expect(memoCalcCount).toEqual(2);
  testState.logLevel = 'none';
})

test('should work with async', async () => {
  const store = createStore({
    num: 0,
    str: ''
  });
  let calcCount = 0;
  let changeCount = 0;
  const derivation = derive(
    store.num,
    store.str,
  ).$with((num, str) => {
    calcCount++;
    return str + num;
  });
  derivation.$onChange(() => {
    changeCount++;
  });
  store.num.$add(1);
  store.str.$set('x');
  store.str.$set('y');
  store.str.$set('z');
  await Promise.resolve();
  expect(calcCount).toEqual(1);
  expect(changeCount).toEqual(1);
  expect(derivation.$state).toEqual('z1');
  store.num.$add(1);
  store.str.$set('p');
  store.num.$add(1);
  await Promise.resolve();
  expect(calcCount).toEqual(2);
  expect(changeCount).toEqual(2);
  expect(derivation.$state).toEqual('p3');
})
