import { produce } from 'immer';
import { fromJS, Map } from 'immutable';
import { beforeEach, test } from 'vitest';
import { createStore } from '../src/core';
import { resetLibraryState } from '../src/utility';

beforeEach(() => {
  resetLibraryState();
})

test('Immer Perf (shallow)', () => {
  let state = { num: 0, str: '' };
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    state = produce(state, draftState => {
      draftState.num = i;
    })
  }
  console.log(`Immer Perf (shallow): ${performance.now() - before}`);
})

test('Immutable Perf (shallow)', () => {
  const state = Map({ num: 0, str: '' });
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    state.set('num', i);
    state.toJS();
  }
  console.log(`Immutable Perf (shallow): ${performance.now() - before}`);
})

test('Olik Perf (shallow)', () => {
  const state = { num: 0, str: '' };
  const store = createStore(state);
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    store.num.$set(i);
    store.$state;
  }
  console.log(`Olik Perf (shallow): ${performance.now() - before}`);
})

test('Native Perf (shallow)', () => {
  let state = { num: 0, str: '' };
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    state = { ...state, num: i };
  }
  console.log(`Native Perf (shallow): ${performance.now() - before}`);
})

test('Immer Perf (deep)', () => {
  let state = { arr: [{ id: 1, val: '', obj: { num: 0 } }, { id: 2, val: '', obj: { num: 0 } }, { id: 3, val: '', obj: { num: 0 } }] };
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    state = produce(state, draftState => {
      draftState.arr[draftState.arr.findIndex(e => e.val === '')].id = i;
    })
  }
  console.log(`Immer Perf (deep): ${performance.now() - before}`);
})

test('Immutable Perf (deep)', () => {
  const state = fromJS({ arr: [{ id: 1, val: '', obj: { num: 0 } }, { id: 2, val: '', obj: { num: 0 } }, { id: 3, val: '', obj: { num: 0 } }] });
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    state.updateIn(['arr', '0', 'id'], () => i)
    state.toJS();
  }
  console.log(`Immutable Perf (deep): ${performance.now() - before}`);
})

test('Olik Perf (deep)', () => {
  const state = { arr: [{ id: 1, val: '', obj: { num: 0 } }, { id: 2, val: '', obj: { num: 0 } }, { id: 3, val: '', obj: { num: 0 } } ] };
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
  let state = { arr: [{ id: 1, val: '', obj: { num: 0 } }, { id: 2, val: '', obj: { num: 0 } }, { id: 3, val: '', obj: { num: 0 } } ] };
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    state = { ...state, arr: state.arr.map(e => e.val === '' ? { ...e, id: i } : e) };
  }
  console.log(`Native Perf (deep): ${performance.now() - before}`);
})
