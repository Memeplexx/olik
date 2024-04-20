import { defineQuery } from '../src/async-query';
import { errorMessages, libState } from '../src/constant';
import { createStore } from '../src/core';
import { connectOlikDevtoolsToStore } from '../src/devtools';
import { resetLibraryState } from '../src/utility';
import { importOlikAsyncModule } from '../src/write-async';
import { test, expect, beforeEach } from 'vitest';

const resolve = <T>(data: T, timeout = 10) => () => new Promise<T>(resolve => setTimeout(() => resolve(data), timeout));
const reject = <T>(rejection: unknown, timeout = 10) => () => new Promise<T>((_, reject) => setTimeout(() => reject(rejection), timeout));

beforeEach(() => {
  resetLibraryState();
  connectOlikDevtoolsToStore();
  importOlikAsyncModule();
})

test('should perform a basic async update', async () => {
  const state = { num: 0 };
  const store = createStore(state);
  const payload = 1;
  const asyncResult = await store.num
    .$set(resolve(payload));
  expect(store.num.$state).toEqual(payload);
  expect(asyncResult).toEqual(payload);
  expect(libState.currentAction).toEqual({ type: 'num.$set()', payload });
})

test('should catch a rejection', async () => {
  const state = { num: 0 };
  const store = createStore(state);
  const rejection = 'test';
  store.num
    .$set(reject<number>(rejection))
    .catch(e => expect(e).toEqual(rejection))
})

test('should only invoke promise functions once if caching is involved', async () => {
  const state = { num: 0 };
  const store = createStore(state);
  const payload = 1;
  let promiseCount = 0;
  const promise = () => {
    promiseCount++;
    return new Promise<number>(resolve => setTimeout(() => resolve(payload), 10));
  }
  await store.num
    .$set(promise, { cache: 1000 });
  await store.num
    .$set(promise);
  expect(promiseCount).toEqual(1);
})

test('should be able to invalidate a cache even if one does not yet exist', () => {
  const state = { num: 0 };
  const store = createStore(state);
  store.num
    .$invalidateCache();
})

test('should be able to update state before the promise has settled', () => {
  const state = { num: 0 };
  const store = createStore(state);
  const asyncResult = 1;
  const syncResult = 2;
  return store.num
    .$set(resolve(asyncResult))
    .then(r => {
      expect(r).toEqual(asyncResult);
      expect(store.num.$state).toEqual(asyncResult);
      store.num.$set(syncResult);
      expect(store.num.$state).toEqual(syncResult);
    });
})

test('should support caching', () => {
  const state = { num: 0, cache: { num: '' } };
  const store = createStore(state);
  const replacement = 1;
  const replacement2 = 2;
  return store.num
    .$set(resolve(replacement), { cache: 1000 })
    .then(() => {
      expect(libState.currentAction!.type).toEqual('cache.num.$set()');
      expect(store.num.$state).toEqual(replacement);
      return store.num.$set(resolve(replacement2));
    })
    .then(result => {
      expect(result).toEqual(replacement);
      expect(store.num.$state).toEqual(replacement);
      expect(store.cache.num.$state).toBeTruthy();
      store.num.$invalidateCache();
      expect(store.cache.$state).toEqual({});
      return store.num.$set(resolve(replacement2));
    })
    .then(() => {
      expect(store.num.$state).toEqual(replacement2);
    })
})

test('should support optimistic updates', () => {
  const state = { num: 0 };
  const store = createStore(state);
  const replacement = 1;
  const eager = 9;
  setTimeout(() => expect(store.num.$state).toEqual(eager));
  return store.num
    .$set(resolve(replacement), { eager })
    .then(() => {
      expect(store.num.$state).toEqual(replacement);
    });
})

test('should rollback optimistic updates upon failure', async () => {
  const state = { num: 0 };
  const store = createStore(state);
  const eager = 9;
  const error = 'Test';
  setTimeout(() => expect(store.num.$state).toEqual(eager));
  return store.num
    .$set(reject<number>(error), { eager })
    .catch(e => {
      expect(e).toEqual(error);
      expect(store.num.$state).toEqual(0);
    });
});

test('should automatically expire caches appropriately', () => {
  const state = { num: 0 };
  const store = createStore(state);
  const replacement = 1;
  const replacement2 = 2;
  store.num
    .$set(resolve(replacement), { cache: 10 })
    .then(() => store.num
      .$set(resolve(replacement2)))
    .then(() => expect(store.num.$state).toEqual(replacement));
  return new Promise(resolve => setTimeout(resolve, 100))
    .then(() => store.num
      .$set(resolve(replacement2))
      .then(() => expect(store.num.$state).toEqual(replacement2)))
})

test('should be able to remove an array element', async () => {
  const state = { arr: [1, 2, 3] };
  const store = createStore(state);
  await store.arr.$find.$eq(3).$delete(resolve(null));
  expect(store.arr.$state).toEqual([1, 2]);
})

test('should be able to remove all elements from an array', async () => {
  const state = { arr: [1, 2, 3] };
  const store = createStore(state);
  await store.arr.$clear(resolve(null));
  expect(store.arr.$state).toEqual([]);
})

test('should be able to remove an object property', async () => {
  const state = { num: 0 };
  const store = createStore(state);
  await store.num.$delete(resolve(null));
  expect(store.$state).toEqual({});
})

test('should be able to replace an array element', async () => {
  const state = { arr: [1, 2, 3] };
  const store = createStore(state);
  await store.arr.$find.$eq(2).$set(resolve(4));
  expect(store.arr.$state).toEqual([1, 4, 3]);
})

test('should be able to insert one array element', async () => {
  const state = { arr: [1, 2, 3] };
  const store = createStore(state);
  await store.arr.$push(resolve(4));
  expect(store.arr.$state).toEqual([1, 2, 3, 4]);
})

test('should be able to insert many array elements', async () => {
  const state = { arr: [1, 2, 3] };
  const store = createStore(state);
  await store.arr.$pushMany(resolve([4, 5]));
  expect(store.arr.$state).toEqual([1, 2, 3, 4, 5]);
})

// https://stackoverflow.com/questions/50065486/partial-type-in-function-return-value-not-as-strict-as-expected
// test('', async () => { ///////////////////////////////////////////////////////
//   const state = { str: '', num : 2 };
//   const store = createStore(state);
//   const r = store.$patch(resolve({ num: 3 }));
//   // const r = store.$patch(() => ({ num: 3, str: '' }));
// })

test('should repsert one array element where a match could be found', async () => {
  const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] };
  const store = createStore(state);
  const payload = { id: 1, num: 5 };
  await store.arr
    .$mergeMatching.id
    .$with(resolve(payload));
  expect(libState.currentAction).toEqual({ type: 'arr.$mergeMatching.id.$with()', payload });
  expect(store.arr.$state).toEqual([payload, state.arr[1], state.arr[2]]);
})

test('should repsert one array element where a match could not be found', async () => {
  const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] };
  const store = createStore(state);
  const payload = { id: 4, num: 5 };
  await store.arr
    .$mergeMatching.id
    .$with(resolve(payload));
  expect(libState.currentAction).toEqual({ type: 'arr.$mergeMatching.id.$with()', payload });
  expect(store.arr.$state).toEqual([...state.arr, payload]);
})

test('should repsert array elements where one matches and another does not', async () => {
  const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] };
  const store = createStore(state);
  const payload = [{ id: 1, num: 5 }, { id: 5, num: 5 }];
  await store.arr
    .$mergeMatching.id
    .$with(resolve(payload));
  expect(libState.currentAction).toEqual({ type: 'arr.$mergeMatching.id.$with()', payload });
  expect(store.arr.$state).toEqual([payload[0], state.arr[1], state.arr[2], payload[1]]);
})

test('should throw an error if an array element could not be found', async () => {
  const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] };
  const store = createStore(state);
  await store.arr
    .$find.id.$eq(4)
    .$set(resolve({ id: 4, num: 4 }))
    .catch(e => expect(e.message).toEqual(errorMessages.FIND_RETURNS_NO_MATCHES))
})

test('should remove stale cache references', async () => {
  const store = createStore<{ num: number, cache?: { num: string } }>({ num: 0 });
  await store.num.$set(resolve(1), { cache: 10 });
  expect(store.$state.cache!.num).toBeTruthy();
  await new Promise(resolve => setTimeout(() => resolve(null), 20));
  expect(store.$state).toEqual({ num: 1, cache: {} });
})

test('should support externally defined query with an eager update', async () => {
  const store = createStore({ num: 0 });
  const updateNum = ((arg: number) => defineQuery({
    query: resolve(arg),
    eager: arg
  }));
  store.num.$set(...updateNum(3)).then(() => expect(store.num.$state).toEqual(3));
  expect(store.num.$state).toEqual(3)
})
