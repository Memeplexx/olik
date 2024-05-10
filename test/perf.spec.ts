import { produce } from 'immer';
import { fromJS, Map } from 'immutable';
import { beforeEach, test } from 'vitest';
import { createStore } from '../src/core';
import { resetLibraryState } from '../src/utility';

beforeEach(() => {
  resetLibraryState();
})

test('Immer Perf', () => {
  let state = { num: 0, str: '' };
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    state = produce(state, draftState => {
      draftState.num = i;
    })
  }
  console.log(`Immer Perf: ${performance.now() - before}`);
})

test('Immutable Perf', () => {
  const state = Map({ num: 0, str: '' });
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    state.set('num', i);
    state.toJS();
  }
  console.log(`Immutable Perf: ${performance.now() - before}`);
})

test('Olik Perf set', () => {
  const state = { num: 0, str: '' };
  const store = createStore(state);
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    // const listener = store.num.$onChange(() => {});
    store.num.$set(i);
    store.$state;
    // listener.unsubscribe();
  }
  console.log(`Olik Perf set: ${performance.now() - before}`);
})

test('Olik Perf add', () => {
  const state = { num: 0, str: '' };
  const store = createStore(state);
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    store.num.$add(1);
    store.$state;
  }
  console.log(`Olik Perf add: ${performance.now() - before}`);
})

test('Olik Perf setKey', () => {
  const state = { num: 0, str: '' };
  const store = createStore(state);
  const before = performance.now();
  const arr = (new Array(1000)).fill(0).map((e, i) => i.toString());
  for (const e of arr) {
    store.num.$setKey(e);
    store.$state;
  }
  console.log(`Olik Perf setKey: ${performance.now() - before}`);
})

test('Olik Perf merge', () => {
  const state = { nums: [1, 2, 3] };
  const store = createStore(state);
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    store.nums.$merge(i)
    store.$state;
  }
  console.log(`Olik Perf merge: ${performance.now() - before}`);
})

test('Native Perf', () => {
  let state = { num: 0, str: '' };
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    state = { ...state, num: i };
  }
  console.log(`Native Perf: ${performance.now() - before}`);
})

test('Immer Perf (deep)', () => {
  const arr = (new Array(100)).fill(0).map((e, i) => ({ id: i, val: '', obj: { num: 0 } }));
  let state = { arr };
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    state = produce(state, draftState => {
      draftState.arr[state.arr.findIndex(e => e.val === '')].id = i;
    })
  }
  console.log(`Immer Perf (deep): ${performance.now() - before}`);
})

test('Immutable Perf (deep)', () => {
  const arr = (new Array(100)).fill(0).map((e, i) => ({ id: i, val: '', obj: { num: 0 } }));
  const state = fromJS({ arr });
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    state.updateIn(['arr', '0', 'id'], () => i)
    state.toJS();
  }
  console.log(`Immutable Perf (deep): ${performance.now() - before}`);
})

test('Olik Perf (deep)', () => {
  const arr = (new Array(100)).fill(0).map((e, i) => ({ id: i, val: '', obj: { num: 0 } }));
  const state = { arr };
  const store = createStore(state);
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    store.arr
      .$find.val.$eq('').id
      .$set(i);
    store.$state;
  }
  console.log(`Olik Perf (deep): ${performance.now() - before}`);
})

test('Native Perf (deep)', () => {
  let state = { arr: [{ id: 1, val: '', obj: { num: 0 } }, { id: 2, val: '', obj: { num: 0 } }, { id: 3, val: '', obj: { num: 0 } }] };
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    state = {
      ...state,
      arr: [
        state.arr.find(e => e.val === '')!,
        ...state.arr.slice(1)
      ]
    };
  }
  console.log(`Native Perf (deep): ${performance.now() - before}`);
})
