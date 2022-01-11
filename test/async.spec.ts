import { errorMessages, testState } from '../src/constant';
import { createStore } from '../src/core';
import { currentAction } from './_utility';
import { importOlikAsyncModule } from '../src/write-async';


const resolve = <T>(data: T, timeout = 10) => () => new Promise<T>(resolve => setTimeout(() => resolve(data), timeout));
const reject = <T>(rejection: any, timeout = 10) => () => new Promise<T>((resolve, reject) => setTimeout(() => reject(rejection), timeout));

describe('async', () => {

  const name = 'AppStore';

  beforeEach(() => {
    testState.logLevel = 'none';
    importOlikAsyncModule();
  })

  it('should perform a basic async update', async () => {
    const state = { num: 0 };
    const select = createStore({ name, state });
    const payload = 1;
    const asyncResult = await select.num
      .replace(resolve(payload));
    expect(select.num.state).toEqual(payload);
    expect(asyncResult).toEqual(payload);
    expect(currentAction(select)).toEqual({ type: 'num.replace()', payload });
  })

  it('should catch a rejection', done => {
    const state = { num: 0 };
    const select = createStore({ name, state });
    const rejection = 'test';
    select.num
      .replace(reject(rejection))
      .catch(e => expect(e).toEqual(rejection))
      .finally(done)
  })

  it('should only invoke promise functions once if caching is involved', async () => {
    const state = { num: 0 };
    const select = createStore({ name, state });
    const payload = 1;
    let promiseCount = 0;
    const promise = () => {
      promiseCount++;
      return new Promise(resolve => setTimeout(() => resolve(payload), 10));
    }
    await select.num
      .replace(promise, { cacheFor: 1000 });
    await select.num
      .replace(promise);
    expect(promiseCount).toEqual(1);
  })

  it('should be able to invalidate a cache even if one does not yet exist', () => {
    const state = { num: 0 };
    const select = createStore({ name, state });
    select.num
      .invalidateCache();
  })

  it('should be able to update state before the promise has settled', done => {
    const state = { num: 0 };
    const select = createStore({ name, state });
    const asyncResult = 1;
    const syncResult = 2;
    select.num
      .replace(resolve(asyncResult))
      .then(r => {
        expect(r).toEqual(asyncResult);
        expect(select.num.state).toEqual(asyncResult);
        done();
      });
    select.num.replace(syncResult);
    expect(select.num.state).toEqual(syncResult);
  })

  it('should support caching', done => {
    const state = { num: 0, cache: { num: '' } };
    const select = createStore({ name, state });
    const replacement = 1;
    const replacement2 = 2;
    select.num
      .replace(resolve(replacement), { cacheFor: 1000 })
      .then(() => {
        expect(currentAction(select).type).toEqual('cache.num.replace()');
        expect(select.num.state).toEqual(replacement);
        select.num.replace(resolve(replacement2))
          .then(result => {
            expect(result).toEqual(replacement);
            expect(select.num.state).toEqual(replacement);
            expect(select.cache.num.state).toBeTruthy();
            select.num.invalidateCache();
            expect(select.cache.state).toEqual({});
            select.num.replace(resolve(replacement2))
              .then(() => {
                expect(select.num.state).toEqual(replacement2);
                done();
              })
          });
      });
  })

  it('should support optimistic updates', done => {
    const state = { num: 0 };
    const select = createStore({ name, state });
    const replacement = 1;
    const optimisticallyUpdateWith = 9;
    select.num
      .replace(resolve(replacement), { optimisticallyUpdateWith })
      .then(() => {
        expect(select.num.state).toEqual(replacement);
        done();
      });
    expect(select.num.state).toEqual(optimisticallyUpdateWith);
  })

  it('should rollback optimistic updates upon failure', done => {
    const state = { num: 0 };
    const select = createStore({ name, state });
    const optimisticallyUpdateWith = 9;
    const error = 'Test';
    select.num
      .replace(reject<number>(error), { optimisticallyUpdateWith })
      .catch(e => {
        expect(e).toEqual(error);
        expect(select.num.state).toEqual(0);
        done();
      });
    expect(select.num.state).toEqual(optimisticallyUpdateWith);
  });

  it('should automatically expire caches appropriately', done => {
    const state = { num: 0 };
    const select = createStore({ name, state });
    const replacement = 1;
    const replacement2 = 2;
    select.num
      .replace(resolve(replacement), { cacheFor: 10 })
      .then(() => select.num
        .replace(resolve(replacement2))
        .then(() => expect(select.num.state).toEqual(replacement)));
    setTimeout(() => {
      select.num
        .replace(resolve(replacement2))
        .then(() => expect(select.num.state).toEqual(replacement2))
        .then(() => done());
    }, 100);
  })

  it('should be able to remove an array element', async () => {
    const state = { arr: [1, 2, 3] };
    const select = createStore({ name, state });
    await select.arr.find.eq(3).remove(resolve(null));
    expect(select.arr.state).toEqual([1, 2]);
  })

  it('should be able to remove all elements from an array', async () => {
    const state = { arr: [1, 2, 3] };
    const select = createStore({ name, state });
    await select.arr.removeAll(resolve(null));
    expect(select.arr.state).toEqual([]);
  })

  it('should be able to remove an object property', async () => {
    const state = { num: 0 };
    const select = createStore({ name, state });
    await select.num.remove(resolve(null));
    expect(select.state).toEqual({});
  })

  it('should be able to replace an array element', async () => {
    const state = { arr: [1, 2, 3] };
    const select = createStore({ name, state });
    await select.arr.find.eq(2).replace(resolve(4));
    expect(select.arr.state).toEqual([1, 4, 3]);
  })

  it('should be able to insert one array element', async () => {
    const state = { arr: [1, 2, 3] };
    const select = createStore({ name, state });
    await select.arr.insertOne(resolve(4));
    expect(select.arr.state).toEqual([1, 2, 3, 4]);
  })

  it('should be able to insert many array elements', async () => {
    const state = { arr: [1, 2, 3] };
    const select = createStore({ name, state });
    await select.arr.insertMany(resolve([4, 5]));
    expect(select.arr.state).toEqual([1, 2, 3, 4, 5]);
  })

  it('should upsert one array element where a match could be found', async () => {
    const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] };
    const select = createStore({ name, state });
    const payload = { id: 1, val: 5 };
    await select.arr
      .upsertMatching.id
      .withOne(resolve(payload));
    expect(currentAction(select)).toEqual({ type: 'arr.upsertMatching.id.withOne()', payload });
    expect(select.arr.state).toEqual([payload, state.arr[1], state.arr[2]]);
  })

  it('should upsert one array element where a match could not be found', async () => {
    const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] };
    const select = createStore({ name, state });
    const payload = { id: 4, val: 5 };
    await select.arr
      .upsertMatching.id
      .withOne(resolve(payload));
    expect(currentAction(select)).toEqual({ type: 'arr.upsertMatching.id.withOne()', payload });
    expect(select.arr.state).toEqual([...state.arr, payload]);
  })

  it('should upsert array elements where one matches and another does not', async () => {
    const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] };
    const select = createStore({ name, state });
    const payload = [{ id: 1, val: 5 }, { id: 5, val: 5 }];
    await select.arr
      .upsertMatching.id
      .withMany(resolve(payload));
    expect(currentAction(select)).toEqual({ type: 'arr.upsertMatching.id.withMany()', payload });
    expect(select.arr.state).toEqual([payload[0], state.arr[1], state.arr[2], payload[1]]);
  })

  it('should throw an error if an array element could not be found', async () => {
    const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] };
    const select = createStore({ name, state });
    await select.arr
      .find.id.eq(4)
      .replace(resolve({ id: 4, num: 4 }))
      .catch(e => expect(e.message).toEqual(errorMessages.FIND_RETURNS_NO_MATCHES))
  })

  it('should remove stale cache references', async () => {
    const select = createStore({ name, state: { num: 0 } });
    await select.num.replace(resolve(1), { cacheFor: 10 });
    expect((select.state as any).cache.num).toBeTruthy();
    await new Promise(resolve => setTimeout(() => resolve(null), 20));
    expect(select.state).toEqual({ num: 1, cache: {} });
  })

});
