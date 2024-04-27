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
  const arr = (new Array(100)).fill(0).map((e, i) => ({ id: i, val: '', obj: { num: 0 } }));
  let state = { arr };
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    state = produce(state, draftState => {
      draftState.arr[draftState.arr.findIndex(e => e.val === '')].id = i;
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
  let state = { arr: [{ id: 1, val: '', obj: { num: 0 } }, { id: 2, val: '', obj: { num: 0 } }, { id: 3, val: '', obj: { num: 0 } } ] };
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    state = { ...state, arr: state.arr.map(e => e.val === '' ? { ...e, id: i } : e) };
  }
  console.log(`Native Perf (deep): ${performance.now() - before}`);
})





// test('array lookup', () => {
//   const items = (new Array(1000)).fill(0).map((e, i) => {
//     return i.toString();
//   });
//   const before = performance.now();
//   for (let i = 0; i < 1000; i++) {
//     is.libArg(items[i]);
//   }
//   console.log(`${performance.now() - before}`);
// })

// test('set lookup', () => {
//   const items = (new Array(1000)).fill(0).map((e, i) => {
//     return i.toString();
//   });
//   const set = new Set(anyLibProp);
//   const before = performance.now();
//   for (let i = 0; i < 1000; i++) {
//     set.has(items[i]);
//   }
//   console.log(`${performance.now() - before}`);
// })

// test('map lookup', () => {
//   const items = (new Array(1000)).fill(0).map((e, i) => {
//     return i.toString();
//   });
//   const map = new Map(anyLibProp.map(e => [e, true]));
//   const before = performance.now();
//   for (let i = 0; i < 1000; i++) {
//     map.has(items[i]);
//   }
//   console.log(`${performance.now() - before}`);
// })

// test('object lookup', () => {
//   const items = (new Array(1000)).fill(0).map((e, i) => {
//     return i.toString();
//   });
//   const obj = anyLibProp.reduce((acc, e) => Object.assign(acc, {[e]: true}), {});
//   const before = performance.now();
//   for (let i = 0; i < 1000; i++) {
//     if (items[i] in obj) {
//       // do nothing
//     }
//   }
//   console.log(`${performance.now() - before}`);
// })