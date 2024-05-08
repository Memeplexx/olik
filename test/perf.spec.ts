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
  // store.num.$onChange(() => {});
  // store.num.$onChange(() => {});
  // store.num.$onChange(() => {});
  // store.num.$onChange(() => {});
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    store.num.$set(i);
    store.$state;
  }
  console.log(`Olik Perf set: ${performance.now() - before}`);
})

test('Olik Perf add', () => {
  const state = { num: 0, str: '' };
  const store = createStore(state);
  const before = performance.now();
  for (let i = 0; i < 1000; i++) {
    store.num.$add(i);
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




// test('One', () => {
//   const before = performance.now();
//   const thing = 'hello' as string;
//   for (let i = 0; i < 1000; i++) {
//     if (thing === 'one') {
//       return;
//     }
//     if (thing === 'two') {
//       return;
//     }
//     if (thing === 'three') {
//       return;
//     }
//     if (thing === 'for') {
//       return;
//     }
//   }
//   console.log(`One: ${performance.now() - before}`);
// })

// test('Two', () => {
//   const before = performance.now();
//   const thing = 'hello';
//   const map = {
//     one: true,
//     two: true,
//     three: true,
//     four: true,
//   } as Record<string, boolean>;
//   for (let i = 0; i < 1000; i++) {
//     if (map[thing]) {
//       return;
//     }
//     if (map[thing]) {
//       return;
//     }
//     if (map[thing]) {
//       return;
//     }
//     if (map[thing]) {
//       return;
//     }
//   }
//   console.log(`Two: ${performance.now() - before}`);
// })


// test('One', () => {
//   const val = 'hello';
//   const before = performance.now();
//   for (let i = 0; i < 1000; i++) {
//     if (val === 'hello'){}
//   }
//   console.log(`One: ${performance.now() - before}`);
// })

// test('Two', () => {
//   const val = 'hello';
//   const ref = 'hello';
//   const before = performance.now();
//   for (let i = 0; i < 1000; i++) {
//     if (val === ref){}
//   }
//   console.log(`Two: ${performance.now() - before}`);
// })


// test('Tail Factorial', () => {
//   function fibonacci (n: number, accumulator = 1): number {
//     if (n === 0) {
//       return accumulator;
//     }
//     return fibonacci(n - 1, n * accumulator);
//   }
//   const before = performance.now();
//   const result = fibonacci(100);
//   console.log(`Native Perf (deep): ${result} | ${performance.now() - before}`);
// })


// test('Trampoline', () => {
//   function fibo(x: number, a = 0) {
//     if (x < 2) return a;

//     return () => fibo(x - 1, x + a);
//   }
//   function trampoline(f: (...arg: number[]) => unknown, ...args: number[]) {
//     let x = f(...args);
//     while (typeof x === 'function') {
//       x = x();
//     }
//     return x;
//   }
//   const before = performance.now();
//   console.log(trampoline(fibo, 1000));
//   console.log(`Trampoline: ${performance.now() - before}`);
// })






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