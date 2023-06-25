import { errorMessages } from '../src/constant';
import { createStore } from '../src/core';
import { resetLibraryState } from '../src/utility';
import { defineQuery, importOlikAsyncModule } from '../src/write-async';
import { currentAction } from './_utility';


const resolve = <T>(data: T, timeout = 10) => () => new Promise<T>(resolve => setTimeout(() => resolve(data), timeout));
const reject = <T>(rejection: any, timeout = 10) => () => new Promise<T>((resolve, reject) => setTimeout(() => reject(rejection), timeout));

describe('async', () => {

  beforeEach(() => {
    resetLibraryState();
    importOlikAsyncModule();
  })

  it('should perform a basic async update', async () => {
    const state = { num: 0 };
    const store = createStore({ state });
    const payload = 1;
    const asyncResult = await store.num
      .$replace(resolve(payload));
    expect(store.num.$state).toEqual(payload);
    expect(asyncResult).toEqual(payload);
    expect(currentAction(store)).toEqual({ type: 'num.replace()', payload });
  })

  it('should catch a rejection', done => {
    const state = { num: 0 };
    const store = createStore({ state });
    const rejection = 'test';
    store.num
      .$replace(reject<number>(rejection))
      .catch(e => expect(e).toEqual(rejection))
      .finally(done)
  })

  it('should only invoke promise functions once if caching is involved', async () => {
    const state = { num: 0 };
    const store = createStore({ state });
    const payload = 1;
    let promiseCount = 0;
    const promise = () => {
      promiseCount++;
      return new Promise<number>(resolve => setTimeout(() => resolve(payload), 10));
    }
    await store.num
      .$replace(promise, { cache: 1000 });
    await store.num
      .$replace(promise);
    expect(promiseCount).toEqual(1);
  })

  it('should be able to invalidate a cache even if one does not yet exist', () => {
    const state = { num: 0 };
    const store = createStore({ state });
    store.num
      .$invalidateCache();
  })

  it('should be able to update state before the promise has settled', done => {
    const state = { num: 0 };
    const store = createStore({ state });
    const asyncResult = 1;
    const syncResult = 2;
    store.num
      .$replace(resolve(asyncResult))
      .then(r => {
        expect(r).toEqual(asyncResult);
        expect(store.num.$state).toEqual(asyncResult);
        done();
      });
    store.num.$replace(syncResult);
    expect(store.num.$state).toEqual(syncResult);
  })

  it('should support caching', done => {
    const state = { num: 0, cache: { num: '' } };
    const store = createStore({ state });
    const replacement = 1;
    const replacement2 = 2;
    store.num
      .$replace(resolve(replacement), { cache: 1000 })
      .then(() => {
        expect(currentAction(store).type).toEqual('cache.num.replace()');
        expect(store.num.$state).toEqual(replacement);
        store.num.$replace(resolve(replacement2))
          .then(result => {
            expect(result).toEqual(replacement);
            expect(store.num.$state).toEqual(replacement);
            expect(store.cache.num.$state).toBeTruthy();
            store.num.$invalidateCache();
            expect(store.cache.$state).toEqual({});
            store.num.$replace(resolve(replacement2))
              .then(() => {
                expect(store.num.$state).toEqual(replacement2);
                done();
              })
          });
      });
  })

  it('should support optimistic updates', done => {
    const state = { num: 0 };
    const store = createStore({ state });
    const replacement = 1;
    const eager = 9;
    store.num
      .$replace(resolve(replacement), { eager })
      .then(() => {
        expect(store.num.$state).toEqual(replacement);
        done();
      });
    expect(store.num.$state).toEqual(eager);
  })

  it('should rollback optimistic updates upon failure', done => {
    const state = { num: 0 };
    const store = createStore({ state });
    const eager = 9;
    const error = 'Test';
    store.num
      .$replace(reject<number>(error), { eager })
      .catch(e => {
        expect(e).toEqual(error);
        expect(store.num.$state).toEqual(0);
        done();
      });
    expect(store.num.$state).toEqual(eager);
  });

  it('should automatically expire caches appropriately', done => {
    const state = { num: 0 };
    const store = createStore({ state });
    const replacement = 1;
    const replacement2 = 2;
    store.num
      .$replace(resolve(replacement), { cache: 10 })
      .then(() => store.num
        .$replace(resolve(replacement2))
        .then(() => expect(store.num.$state).toEqual(replacement)));
    setTimeout(() => {
      store.num
        .$replace(resolve(replacement2))
        .then(() => expect(store.num.$state).toEqual(replacement2))
        .then(() => done());
    }, 100);
  })

  it('should be able to remove an array element', async () => {
    const state = { arr: [1, 2, 3] };
    const store = createStore({ state });
    await store.arr.$find.$eq(3).$remove(resolve(null));
    expect(store.arr.$state).toEqual([1, 2]);
  })

  it('should be able to remove all elements from an array', async () => {
    const state = { arr: [1, 2, 3] };
    const store = createStore({ state });
    await store.arr.$clear(resolve(null));
    expect(store.arr.$state).toEqual([]);
  })

  it('should be able to remove an object property', async () => {
    const state = { num: 0 };
    const store = createStore({ state });
    await store.num.$remove(resolve(null));
    expect(store.$state).toEqual({});
  })

  it('should be able to replace an array element', async () => {
    const state = { arr: [1, 2, 3] };
    const store = createStore({ state });
    await store.arr.$find.$eq(2).$replace(resolve(4));
    expect(store.arr.$state).toEqual([1, 4, 3]);
  })

  it('should be able to insert one array element', async () => {
    const state = { arr: [1, 2, 3] };
    const store = createStore({ state });
    await store.arr.$insertOne(resolve(4));
    expect(store.arr.$state).toEqual([1, 2, 3, 4]);
  })

  it('should be able to insert many array elements', async () => {
    const state = { arr: [1, 2, 3] };
    const store = createStore({ state });
    await store.arr.$insertMany(resolve([4, 5]));
    expect(store.arr.$state).toEqual([1, 2, 3, 4, 5]);
  })

  it('should repsert one array element where a match could be found', async () => {
    const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] };
    const store = createStore({ state });
    const payload = { id: 1, num: 5 };
    await store.arr
      .$repsertMatching.id
      .$withOne(resolve(payload));
    expect(currentAction(store)).toEqual({ type: 'arr.repsertMatching.id.withOne()', payload });
    expect(store.arr.$state).toEqual([payload, state.arr[1], state.arr[2]]);
  })

  it('should repsert one array element where a match could not be found', async () => {
    const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] };
    const store = createStore({ state });
    const payload = { id: 4, num: 5 };
    await store.arr
      .$repsertMatching.id
      .$withOne(resolve(payload));
    expect(currentAction(store)).toEqual({ type: 'arr.repsertMatching.id.withOne()', payload });
    expect(store.arr.$state).toEqual([...state.arr, payload]);
  })

  it('should repsert array elements where one matches and another does not', async () => {
    const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] };
    const store = createStore({ state });
    const payload = [{ id: 1, num: 5 }, { id: 5, num: 5 }];
    await store.arr
      .$repsertMatching.id
      .$withMany(resolve(payload));
    expect(currentAction(store)).toEqual({ type: 'arr.repsertMatching.id.withMany()', payload });
    expect(store.arr.$state).toEqual([payload[0], state.arr[1], state.arr[2], payload[1]]);
  })

  it('should throw an error if an array element could not be found', async () => {
    const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] };
    const store = createStore({ state });
    await store.arr
      .$find.id.$eq(4)
      .$replace(resolve({ id: 4, num: 4 }))
      .catch(e => expect(e.message).toEqual(errorMessages.FIND_RETURNS_NO_MATCHES))
  })

  it('should remove stale cache references', async () => {
    const store = createStore({ state: { num: 0 } });
    await store.num.$replace(resolve(1), { cache: 10 });
    expect((store.$state as any).cache.num).toBeTruthy();
    await new Promise(resolve => setTimeout(() => resolve(null), 20));
    expect(store.$state).toEqual({ num: 1, cache: {} });
  })

  it('should support externally defined query with an eager update', async () => {
    const store = createStore({ state: { num: 0 } });
    const updateNum = (arg: number) => defineQuery({
      query: resolve(arg),
      eager: arg
    });
    store.num.$replace(...updateNum(3)).then(() => expect(store.num.$state).toEqual(3));
    expect(store.num.$state).toEqual(3)
  })

});

