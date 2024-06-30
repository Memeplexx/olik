import { beforeEach, expect, test } from 'vitest';
import { createStore } from '../src/core';
import { configureDevtools } from '../src/devtools';
import { resetLibraryState } from '../src/utility';
import { configureSortModule } from '../src/sort';


beforeEach(() => {
  resetLibraryState();
  configureDevtools();
  configureSortModule();
})

test('should sort array by number ascending', () => {
  const store = createStore({ arr: [3, 1, 2] });
  const sortedArr = store.arr.$deriveSortedList.$ascending();
  expect(sortedArr.$state).toEqual([1, 2, 3]);
  const sortedArr2 = store.arr.$deriveSortedList.$descending();
  expect(sortedArr2.$state).toEqual([3, 2, 1]);
  sortedArr2.$destroy();
  store.arr.$push(0);
  expect(sortedArr2.$state).toEqual([3, 2, 1]);
});

test('should read deep array element properties', () => {
  const state = { arr: [{ id: 1, val: 0, obj: { num: 1 } }, { id: 2, val: 0, obj: { num: 2 } }] };
  const store = createStore(state);
  const sortedArr = store.arr.$deriveSortedList.$withId.id.$sortedBy.id.$descending();
  expect(sortedArr.$state).toEqual([{ id: 2, val: 0, obj: { num: 2 } }, { id: 1, val: 0, obj: { num: 1 } }]);
})

test('should update correctly when element is pushed to ascending sort', () => {
  const state = { arr: [{ id: 4, val: 0, obj: { num: 1 } }, { id: 5, val: 0, obj: { num: 2 } }] };
  const store = createStore(state);
  const sortedArr = store.arr.$deriveSortedList.$withId.id.$sortedBy.id.$ascending();
  let changeCount = 0;
  sortedArr.$onChange(() => changeCount++);
  store.arr.$push({ id: 3, val: 0, obj: { num: 3 } });
  expect(sortedArr.$state).toEqual([{ id: 3, val: 0, obj: { num: 3 } }, { id: 4, val: 0, obj: { num: 1 } }, { id: 5, val: 0, obj: { num: 2 } }]);
  expect(changeCount).toBe(1);
})

test('should update correctly when element is pushed to descending sort', () => {
  const state = { arr: [{ id: 4, val: 0, obj: { num: 1 } }, { id: 5, val: 0, obj: { num: 2 } }] };
  const store = createStore(state);
  const sortedArr = store.arr.$deriveSortedList.$withId.id.$sortedBy.id.$descending();
  store.arr.$push({ id: 3, val: 0, obj: { num: 3 } });
  expect(sortedArr.$state).toEqual([{ id: 5, val: 0, obj: { num: 2 } }, { id: 4, val: 0, obj: { num: 1 } }, { id: 3, val: 0, obj: { num: 3 } }]);
})

test('should update correctly when element is updated from ascending sort', () => {
  const state = { arr: [{ id: 1, val: 0, obj: { num: 1 } }, { id: 2, val: 0, obj: { num: 2 } }, { id: 3, val: 0, obj: { num: 3 } }] };
  const store = createStore(state);
  const sortedArr = store.arr.$deriveSortedList.$withId.id.$sortedBy.id.$ascending();
  let changeCount = 0;
  sortedArr.$onChange(() => changeCount++);
  store.arr.$find.id.$eq(2).$delete();
  expect(sortedArr.$state).toEqual([{ id: 1, val: 0, obj: { num: 1 } }, { id: 3, val: 0, obj: { num: 3 } }]);
  expect(changeCount).toBe(1);
});

test('should sort by date correctly', () => {
  const store = createStore({ arr: [{ id: 1, date: new Date('2020-06-01') }, { id: 2, date: new Date('2020-02-01') }, { id: 3, date: new Date('2020-08-01') }] });
  const sortedArr = store.arr.$deriveSortedList.$withId.id.$sortedBy.date.$ascending();
  expect(sortedArr.$state).toEqual([{ id: 2, date: new Date('2020-02-01') }, { id: 1, date: new Date('2020-06-01') }, { id: 3, date: new Date('2020-08-01') }]);
  const sortedArr2 = store.arr.$deriveSortedList.$withId.id.$sortedBy.date.$descending();
  expect(sortedArr2.$state).toEqual([{ id: 3, date: new Date('2020-08-01') }, { id: 1, date: new Date('2020-06-01') }, { id: 2, date: new Date('2020-02-01') }]);
})

test('should sort array when entire array is replaced', () => {
  const state = { arr: [{ id: 4, val: 0 }, { id: 5, val: 0 }] };
  const store = createStore(state);
  const sort = store.arr.$deriveSortedList.$withId.id.$sortedBy.id.$ascending();
  store.arr.$set([{ id: 3, val: 0 }, { id: 5, val: 0 }, { id: 1, val: 0 }]);
  expect(sort.$state).toEqual([{ id: 1, val: 0 }, { id: 3, val: 0 }, { id: 5, val: 0 }]);
});

test('should sort array when an object containing an entire array is replaced', () => {
  const state = { arr: [{ id: 4, val: 0 }, { id: 5, val: 0 }] };
  const store = createStore(state);
  const sort = store.arr.$deriveSortedList.$withId.id.$sortedBy.id.$ascending();
  store.$set({ arr: [{ id: 3, val: 0 }, { id: 5, val: 0 }, { id: 1, val: 0 }] });
  expect(sort.$state).toEqual([{ id: 1, val: 0 }, { id: 3, val: 0 }, { id: 5, val: 0 }]);
});

test('should sort array when an object containing an entire array is patched', () => {
  const state = { arr: new Array<{ id: number, val: number }> };
  const store = createStore(state);
  const sort = store.arr.$deriveSortedList.$withId.id.$sortedBy.id.$ascending();
  store.$patch({ arr: [{ id: 3, val: 0 }, { id: 5, val: 0 }, { id: 1, val: 0 }] });
  expect(sort.$state).toEqual([{ id: 1, val: 0 }, { id: 3, val: 0 }, { id: 5, val: 0 }]);
});

test('', () => {
  const store = createStore({ arr: [{id: 1, val: 'one'}, {id: 2, val: 'two'}] });
  // const m = store.arr.$memoizeSortBy.id.$ascending();
  const m = store.arr.$deriveSortedList.$withId.id.$sortedBy.id.$ascending();
  // m.$onChange(() => {});
  store.arr.$find.id.$eq(1).val.$set('three');
  // store.arr.$find.id.$eq(1).$set({id: 1, val: 'three'});
  // store.arr.$set([{id: 3, val: 'three'}, {id: 1, val: 'one'}, {id: 2, val: 'two'}]);
  console.log(m.$state);
})


test('', () => {
  const store = createStore({ notes: [{id: 1, title: 'note 1', dateUpdated: new Date('2020-01-01')}, {id: 2, title: 'note 2', dateUpdated: new Date('2020-01-02')}] });
  const s1 = store.notes.$deriveSortedList.$withId.id.$sortedBy.dateUpdated.$ascending();
  store.notes.$find.id.$eq(1).dateUpdated.$set(new Date());
  console.log(s1.$state);
})


// test('', () => {
//   const store = createStore({
//     arr1: [1, 2, 3],
//     arr2: ['1', '2', '3']
//   });
//   // const arr1Before = store.arr1.$state; 
//   const s1 = store.arr1.$createSortedList.$ascending();
  
//   store.$set({
//     arr1: [],
//     arr2: []
//   });
// })
