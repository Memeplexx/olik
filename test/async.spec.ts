
import { createApplicationStore, libState, testState } from '../src/index';

const resolve = <T>(data: T, timeout = 10) => () => new Promise<T>(resolve => setTimeout(() => resolve(data), timeout));
const reject = <T>(rejection: any, timeout = 10) => () => new Promise<T>((resolve, reject) => setTimeout(() => reject(rejection), timeout));

describe('Async', () => {

  beforeEach(() => {
    libState.appStates = {};
    testState.logLevel = 'none';
  })

  it('should perform a basic async update', async () => {
    const select = createApplicationStore({ num: 0 });
    const replacement = 1;
    const asyncResult = await select.num
      .replace(resolve(replacement));
    expect(select.num.read()).toEqual(replacement);
    expect(asyncResult).toEqual(replacement);
    expect(libState.currentAction).toEqual({ type: 'num.replace()', replacement });
  })

  it('should be able to update state before the promise has settled', done => {
    const select = createApplicationStore({ num: 0 });
    const asyncResult = 1;
    const syncResult = 2;
    select.num
      .replace(resolve(asyncResult))
      .then(r => {
        expect(r).toEqual(asyncResult);
        expect(select.num.read()).toEqual(asyncResult);
        done();
      });
    select.num.replace(syncResult);
    expect(select.num.read()).toEqual(syncResult);
  })

  it('should support caching', done => {
    const select = createApplicationStore({ num: 0, cache: { num: '' } });
    const replacement = 1;
    const replacement2 = 2;
    select.num
      .replace(resolve(replacement), { cacheFor: 1000 })
      .then(() => {
        expect(libState.currentAction.type).toEqual('cache.num.replace()');
        expect(select.num.read()).toEqual(replacement);
        select.num.replace(resolve(replacement2))
          .then(result => {
            expect(result).toEqual(replacement);
            expect(select.num.read()).toEqual(replacement);
            expect(select.cache.num.read()).toBeTruthy();
            select.num.invalidateCache();
            expect(select.cache.read()).toEqual({});
            select.num.replace(resolve(replacement2))
              .then(() => {
                expect(select.num.read()).toEqual(replacement2);
                done();
              })
          });
      });
  })

  it('should support optimistic updates', done => {
    const select = createApplicationStore({ num: 0 });
    const replacement = 1;
    const optimisticallyUpdateWith = 9;
    select.num
      .replace(resolve(replacement), { optimisticallyUpdateWith })
      .then(() => {
        expect(select.num.read()).toEqual(replacement);
        done();
      });
    expect(select.num.read()).toEqual(optimisticallyUpdateWith);
  })

  it('should rollback optimistic updates upon failure', done => {
    const select = createApplicationStore({ num: 0 });
    const optimisticallyUpdateWith = 9;
    const error = 'Test';
    select.num
      .replace(reject<number>(error), { optimisticallyUpdateWith })
      .catch(e => {
        expect(e).toEqual(error);
        expect(select.num.read()).toEqual(0);
        done();
      });
    expect(select.num.read()).toEqual(optimisticallyUpdateWith);
  });

  it('should automatically expire caches appropriately', done => {
    const select = createApplicationStore({ num: 0 });
    const replacement = 1;
    const replacement2 = 2;
    select.num
      .replace(resolve(replacement), { cacheFor: 10 })
      .then(() => select.num
        .replace(resolve(replacement2))
        .then(() => expect(select.num.read()).toEqual(replacement)));
    setTimeout(() => {
      select.num
        .replace(resolve(replacement2))
        .then(() => expect(select.num.read()).toEqual(replacement2))
        .then(() => done());
    }, 100);
  })

  it('should be able to remove an array element', async () => {
    const select = createApplicationStore({ arr: [1, 2, 3] });
    await select.arr.find.eq(3).remove(resolve(null));
    expect(select.arr.read()).toEqual([1, 2]);
  })

  it('should be able to remove all elements from an array', async () => {
    const select = createApplicationStore({ arr: [1, 2, 3] });
    await select.arr.removeAll(resolve(null));
    expect(select.arr.read()).toEqual([]);
  })

  it('should be able to remove an object property', async () => {
    const select = createApplicationStore({ num: 0 });
    await select.num.remove(resolve(null));
    expect(select.read()).toEqual({});
  })

  it('should be able to replace an array element', async () => {
    const select = createApplicationStore({ arr: [1, 2, 3] });
    await select.arr.find.eq(2).replace(resolve(4));
    expect(select.arr.read()).toEqual([1, 4, 3]);
  })

  it('should be able to insert one array element', async () => {
    const select = createApplicationStore({ arr: [1, 2, 3] });
    await select.arr.insertOne(resolve(4));
    expect(select.arr.read()).toEqual([1, 2, 3, 4]);
  })

  it('should be able to insert many array elements', async () => {
    const select = createApplicationStore({ arr: [1, 2, 3] });
    await select.arr.insertMany(resolve([4, 5]));
    expect(select.arr.read()).toEqual([1, 2, 3, 4, 5]);
  })

  it('should upsert one array element where a match could be found', async () => {
    const initialState = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] };
    const select = createApplicationStore(initialState);
    const withOne = { id: 1, val: 5 };
    await select.arr
      .upsertMatching.id
      .withOne(resolve(withOne));
    expect(libState.currentAction).toEqual({ type: 'arr.upsertMatching.id.withOne()', withOne });
    expect(select.arr.read()).toEqual([withOne, initialState.arr[1], initialState.arr[2]]);
  })

  it('should upsert one array element where a match could not be found', async () => {
    const initialState = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] };
    const select = createApplicationStore(initialState);
    const withOne = { id: 4, val: 5 };
    await select.arr
      .upsertMatching.id
      .withOne(resolve(withOne));
    expect(libState.currentAction).toEqual({ type: 'arr.upsertMatching.id.withOne()', withOne });
    expect(select.arr.read()).toEqual([...initialState.arr, withOne]);
  })

  it('should upsert array elements where one matches and another does not', async () => {
    const initialState = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }, { id: 3, num: 3 }] };
    const select = createApplicationStore(initialState);
    const withMany = [{ id: 1, val: 5 }, { id: 5, val: 5 }];
    await select.arr
      .upsertMatching.id
      .withMany(resolve(withMany));
    expect(libState.currentAction).toEqual({ type: 'arr.upsertMatching.id.withMany()', withMany });
    expect(select.arr.read()).toEqual([withMany[0], initialState.arr[1], initialState.arr[2], withMany[1]]);
  })

});
