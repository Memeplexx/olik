import { errorMessages } from '../src/shared-consts';
import { libState, testState } from '../src/shared-state';
import { createComponentStore, createApplicationStore, createApplicationStoreEnforcingTags } from '../src/store-creators';
import { transact } from '../src/transact';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

const resolve = <T>(data: T, timeout = 10) => () => new Promise<T>(resolve => setTimeout(() => resolve(data), timeout));
const reject = (rejection: any, timeout = 10) => () => new Promise((resolve, reject) => setTimeout(() => reject(rejection), timeout));

describe('async', () => {

  beforeAll(() => {
    testState.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  });

  beforeEach(() => {
    libState.applicationStore = null;
    libState.cacheInvalidators = {};
  });

  const initialState = {
    object: { property: '', property2: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    paginated: {} as { [key: string]: [{ id: number, value: string }] },
    // cache: {} as { [key: string]: string },
  };

  it('should automatically then() a promise', done => {
    const select = createApplicationStore(initialState);
    const payload = [{ id: 1, value: 'test' }];
    select(s => s.array)
      .replaceAll(resolve(payload));
    setTimeout(() => {
      expect(select(s => s.array).read()).toEqual(payload);
      done();
    }, 100);
  })

  it('should automatically catch() a promise', done => {
    const select = createApplicationStore(initialState);
    const rejection = 'whoa!';
    select(s => s.array)
      .replaceAll(reject(rejection))
      .catch(e => {
        expect(e).toEqual(rejection);
        done();
      });
  })

  it('should automatically finally() a promise', done => {
    const select = createApplicationStore(initialState);
    const payload = [{ id: 1, value: 'test' }];
    select(s => s.array)
      .replaceAll(resolve(payload))
      .finally(() => done());
  })

  it('should only invoke promise functions once if caching is involved', async done => {
    const select = createApplicationStore(initialState);
    const payload = [{ id: 1, value: 'test' }];
    let promiseCount = 0;
    const promise = () => {
      promiseCount++;
      return new Promise(resolve => setTimeout(() => resolve(payload), 10));
    }
    await select(s => s.array)
      .replaceAll(promise, { cacheFor: 1000 });
    await select(s => s.array)
      .replaceAll(promise);
    expect(promiseCount).toEqual(1);
    done();
  })

  it('should be able to invalidate a cache even if once does not yet exist', () => {
    const select = createApplicationStore(initialState);
    select(s => s.array)
      .invalidateCache();
  })

  it('should work with replaceAll()', async done => {
    const select = createApplicationStore(initialState);
    const payload = [{ id: 1, value: 'test' }];
    const res = await select(s => s.array)
      .replaceAll(resolve(payload), { cacheFor: 1000 });
    expect(res).toEqual(select().read().array);
    expect(select().read().array).toEqual(payload);
    const payload2 = [{ id: 1, value: 'testy' }];
    await select(s => s.array)
      .replaceAll(resolve(payload2));
    expect(select().read().array).toEqual(payload);
    select(s => s.array).invalidateCache();
    await select(s => s.array)
      .replaceAll(resolve(payload2));
    expect(select().read().array).toEqual(payload2);
    done();
  })

  it('should work with removeAll()', async done => {
    const select = createApplicationStore(initialState);
    const res = await select(s => s.array)
      .removeAll(resolve(null));
    expect(res).toEqual(select().read().array);
    expect(select().read().array).toEqual([]);
    done();
  })

  it('should work with insertOne()', async done => {
    const select = createApplicationStore(initialState);
    const payload = { id: 1, value: 'test' };
    const res = await select(s => s.array)
      .insertOne(resolve(payload), { cacheFor: 1000 });
    expect(res).toEqual(select().read().array);
    expect(select().read().array).toEqual([...initialState.array, payload]);
    const payload2 = { id: 1, value: 'testy' };
    await select(s => s.array)
      .insertOne(resolve(payload2));
    expect(select().read().array).toEqual([...initialState.array, payload]);
    select(s => s.array).invalidateCache();
    await select(s => s.array)
      .insertOne(resolve(payload2));
    expect(select().read().array).toEqual([...initialState.array, payload, payload2]);
    done();
  })

  it('should work with replace()', async done => {
    const select = createApplicationStore(initialState);
    const payload = { property: 'xxx', property2: 'yyy' };
    const res = await select(s => s.object)
      .replace(resolve(payload), { cacheFor: 1000 })
    expect(res).toEqual(select().read().object);
    expect(select().read().object).toEqual(payload);
    const payload2 = { property: 'xxx2', property2: 'yyy2' };
    await select(s => s.object)
      .replace(resolve(payload2))
    expect(select().read().object).toEqual(payload);
    select(s => s.object).invalidateCache();
    await select(s => s.object)
      .replace(resolve(payload2))
    expect(select().read().object).toEqual(payload2);
    done();
  })

  it('should work with patch()', async done => {
    const select = createApplicationStore(initialState);
    const payload = { property: 'xxx' };
    const res = await select(s => s.object)
      .patch(resolve(payload), { cacheFor: 1000 })
    expect(res).toEqual(select().read().object);
    expect(select().read().object).toEqual({ ...initialState.object, ...payload });
    const payload2 = { property: 'yyy' };
    await select(s => s.object)
      .patch(resolve(payload2))
    expect(select().read().object).toEqual({ ...initialState.object, ...payload });
    select(s => s.object).invalidateCache();
    await select(s => s.object)
      .patch(resolve(payload2))
    expect(select().read().object).toEqual({ ...initialState.object, ...payload2 });
    done();
  })

  it('should work with remove()', async done => {
    const select = createApplicationStore(initialState);
    await select(s => s.object.property2)
      .remove(resolve(undefined))
    expect(select().read().object).toEqual({ property: '' });
    done();
  })

  it('should work with upsertMatching().withOne()', async done => {
    const select = createApplicationStore(initialState);
    const payload = { id: 1, value: 'test' };
    const res = await select(s => s.array)
      .upsertMatching(s => s.id)
      .withOne(resolve(payload), { cacheFor: 1000 })
    expect(res).toEqual(select().read().array);
    expect(select().read().array).toEqual([payload, initialState.array[1], initialState.array[2]]);
    const payload2 = { id: 1, value: 'testt' };
    await select(s => s.array)
      .upsertMatching(s => s.id)
      .withOne(resolve(payload2))
    expect(select().read().array).toEqual([payload, initialState.array[1], initialState.array[2]]);
    select(s => s.array).invalidateCache();
    await select(s => s.array)
      .upsertMatching(s => s.id)
      .withOne(resolve(payload2))
    expect(select().read().array).toEqual([payload2, initialState.array[1], initialState.array[2]]);
    done();
  })

  it('should work with find().replace()', async done => {
    const select = createApplicationStore(initialState);
    const payload = { id: 2, value: 'twooo' };
    const res = await select(s => s.array)
      .find(s => s.id).eq(2)
      .replace(resolve(payload), { cacheFor: 1000 })
    expect(res).toEqual(select().read().array.find(e => e.id === 2));
    expect(select().read().array).toEqual([initialState.array[0], payload, initialState.array[2]]);
    const payload2 = { id: 2, value: 'twooo' };
    await select(s => s.array)
      .find(s => s.id).eq(2)
      .replace(resolve(payload2))
    expect(select().read().array).toEqual([initialState.array[0], payload, initialState.array[2]]);
    select(s => s.array)
      .find(s => s.id).eq(2)
      .invalidateCache();
    await select(s => s.array)
      .find(s => s.id).eq(2)
      .replace(resolve(payload2))
    expect(select().read().array).toEqual([initialState.array[0], payload2, initialState.array[2]]);
    done();
  })

  it('should work with find().patch()', async done => {
    const select = createApplicationStore(initialState);
    const payload = { value: 'twooo' };
    const res = await select(s => s.array)
      .find(s => s.id).eq(2)
      .patch(resolve(payload), { cacheFor: 1000 })
    expect(res).toEqual(select().read().array.find(e => e.id === 2));
    expect(select().read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
    const payload2 = { value: 'twoooz' };
    await select(s => s.array)
      .find(s => s.id).eq(2)
      .patch(resolve(payload2))
    expect(select().read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
    select(s => s.array)
      .find(s => s.id).eq(2)
      .invalidateCache();
    await select(s => s.array)
      .find(s => s.id).eq(2)
      .patch(resolve(payload2))
    expect(select().read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload2 }, initialState.array[2]]);
    done();
  })

  it('should work with find().remove()', async done => {
    const select = createApplicationStore(initialState);
    const res = await select(s => s.array)
      .find(s => s.id).eq(2)
      .remove(resolve(null))
    expect(res).toEqual(select().read().array.find(e => e.id === 2));
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[2]]);
    done();
  })

  it('should work with filter().replaceAll()', async done => {
    const select = createApplicationStore(initialState);
    const payload = { id: 2, value: 'twooo' };
    const res = await select(s => s.array)
      .filter(s => s.id).eq(2)
      .replaceAll(resolve(payload) as (() => Promise<typeof payload>), { cacheFor: 1000 }) // WTF do I need this typecast?
    expect(res).toEqual(select().read().array.filter(e => e.id === 2));
    expect(select().read().array).toEqual([initialState.array[0], payload, initialState.array[2]]);
    const payload2 = { id: 2, value: 'twooo' };
    await select(s => s.array)
      .filter(s => s.id).eq(2)
      .replaceAll(resolve(payload2))
    expect(select().read().array).toEqual([initialState.array[0], payload, initialState.array[2]]);
    select(s => s.array)
      .filter(s => s.id).eq(2)
      .invalidateCache();
    await select(s => s.array)
      .filter(s => s.id).eq(2)
      .replaceAll(resolve(payload2))
    expect(select().read().array).toEqual([initialState.array[0], payload2, initialState.array[2]]);
    done();
  })

  it('should work with filter().patchAll()', async done => {
    const select = createApplicationStore(initialState);
    const payload = { value: 'twooo' };
    const res = await select(s => s.array)
      .filter(s => s.id).eq(2)
      .patchAll(resolve(payload), { cacheFor: 1000 });
    expect(res).toEqual(select().read().array.filter(e => e.id === 2));
    expect(select().read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
    const payload2 = { value: 'twoooz' };
    await select(s => s.array)
      .filter(s => s.id).eq(2)
      .patchAll(resolve(payload2))
    expect(select().read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
    select(s => s.array)
      .filter(s => s.id).eq(2)
      .invalidateCache();
    await select(s => s.array)
      .filter(s => s.id).eq(2)
      .patchAll(resolve(payload2))
    expect(select().read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload2 }, initialState.array[2]]);
    done();
  })

  it('should work with filter().removeAll()', async done => {
    const select = createApplicationStore(initialState);
    const res = await select(s => s.array)
      .filter(s => s.id).eq(2)
      .removeAll(resolve(null))
    expect(res).toEqual([]);
    expect(select().read().array).toEqual([initialState.array[0], initialState.array[2]]);
    done();
  })

  it('should handle a promise rejection', async done => {
    const select = createApplicationStore(initialState);
    const rejection = 'test';
    try {
      await select(s => s.array)
        .replaceAll(reject(rejection), { cacheFor: 1000 })
    } catch (err) {
      expect(err).toEqual(rejection);
      done();
    }
  })

  it('should support tags in type', async done => {
    const select = createApplicationStore(initialState, { actionTypesToIncludeTag: true });
    const replacement = [{ id: 1, value: 'one' }];
    const tag = 'MyComponent';
    await select(s => s.array)
      .replaceAll(resolve(replacement), { tag })
    expect(testState.currentAction).toEqual({
      type: `array.replaceAll() [${tag}]`,
      replacement,
    });
    done();
  })

  it('should support tags in payload', async done => {
    const select = createApplicationStoreEnforcingTags(initialState, { actionTypesToIncludeTag: false });
    const replacement = [{ id: 1, value: 'one' }];
    const tag = 'MyComponent';
    await select(s => s.array)
      .replaceAll(resolve(replacement), { tag })
    expect(testState.currentAction).toEqual({
      type: 'array.replaceAll()',
      replacement,
      tag
    });
    done();
  })

  it('should not be able to support transactions', () => {
    const select = createApplicationStore(initialState);
    expect(() => transact(
      () => select(s => s.array).replaceAll(resolve([])),
      () => select(s => s.array).find(s => s.id).eq(1).replace(resolve({ id: 1, value: 'XXX' })),
    )).toThrowError(errorMessages.PROMISES_NOT_ALLOWED_IN_TRANSACTIONS);
  })

  it('should not be able to support top-level stores', () => {
    const select = createApplicationStore(0);
    expect(() => select().replace(resolve(1), { cacheFor: 1000 }))
      .toThrowError(errorMessages.INVALID_CONTAINER_FOR_CACHED_DATA);
  })

  it('should automatically clear up expired cache keys', async done => {
    const select = createApplicationStore(initialState);
    const payload = [{ id: 1, value: 'test' }];
    select(s => s.object)
      .replace(resolve({ property: 'fdfd', property2: 'fdfd' }), { cacheFor: 1000 });
    await select(s => s.array)
      .replaceAll(resolve(payload), { cacheFor: 10 })
    setTimeout(() => {
      expect(testState.currentAction).toEqual({ type: 'cache.array.replaceAll().remove()' });
      done();
    }, 100);
  })

  it('should work with nested stores', async done => {
    const select = createApplicationStore(initialState);
    const nested = createComponentStore({ prop: '' }, { componentName: 'hello', instanceName: 'test' });
    const payload = 'test';
    await nested(s => s.prop)
      .replace(resolve(payload), { cacheFor: 1000 })
    expect(nested().read().prop).toEqual(payload);
    done();
  })

  // it('should de-duplicate simultaneous requests', async done => {
  //   const select = createApplicationStore(initialState);
  //   select(s => s.array)
  //     .replaceAll(resolve([{ id: 1, value: 'test' }]));
  //   setTimeout(async () => {
  //     await select(s => s.array)
  //       .replaceAll(resolve([{ id: 2, value: 'testy' }]))
  //     expect(select().read().array).toEqual([{ id: 1, value: 'test' }]);
  //     done();
  //   }, 5)
  // })

  it('should be able to paginate', async done => {
    const todos = new Array(50).fill(null).map((e, i) => ({ id: i + 1, value: `value ${i + 1}` }));
    const select = createApplicationStore(initialState);
    await select(s => s.paginated[0])
      .replaceAll(resolve(todos.slice(0, 10)));
    expect(select().read().paginated[0]).toEqual(todos.slice(0, 10));
    await select(s => s.paginated[1])
      .replaceAll(resolve(todos.slice(10, 20)));
    expect(select().read().paginated[0]).toEqual(todos.slice(0, 10));
    await select(s => s.paginated[1])
      .replaceAll(resolve(todos.slice(10, 20)));
    expect(select().read().paginated[1]).toEqual(todos.slice(10, 20));
    select(s => s.paginated)
      .replace({});
    expect(select().read().paginated).toEqual({});
    done();
  })

  it('should not bypass a promise if it has been rejected', async done => {
    const select = createApplicationStore(initialState);
    const payload = [{ id: 1, value: 'one' }];
    try {
      await select(s => s.array)
        .replaceAll(reject('test'), { cacheFor: 1000 })
    } catch (error) {
      const res = await select(s => s.array)
        .replaceAll(resolve(payload), { cacheFor: 1000 })
      expect(res).toEqual(select().read().array);
      expect(select().read().array).toEqual(payload);
      done();
    }
  })

  it('should be able to perform an optimistic update', async done => {
    const select = createApplicationStore(initialState);
    const optimisticValue = [{ id: 6, value: 'six' }];
    const resolvedValue = [{ id: 7, value: 'seven' }];
    select(s => s.array)
      .replaceAll(resolve(resolvedValue), { optimisticallyUpdateWith: optimisticValue })
      .then(() => {
        expect(select().read().array).toEqual(resolvedValue);
        done();
      });
    expect(select().read().array).toEqual(optimisticValue);
  })

  it('should revert an optimistic update if there is an error', async done => {
    const select = createApplicationStore(initialState);
    const optimisticValue = [{ id: 6, value: 'six' }];
    select(s => s.array)
      .replaceAll(reject('test'), { optimisticallyUpdateWith: optimisticValue })
      .catch(() => {
        expect(select().read().array).toEqual(initialState.array);
        done();
      });
    expect(select().read().array).toEqual(optimisticValue);
  })

  it('should invalidate caches for replaceAll() independently of replace()', async done => {
    const select = createApplicationStore(initialState);
    const fetchTodos = resolve([{ id: 1, value: 'test' }]);
    const fetchTodo = resolve({ id: 1, value: 'testy' });
    const fetchTodo2 = resolve({ id: 1, value: 'testyy' });
    await select(s => s.array)
      .replaceAll(fetchTodos, { cacheFor: 1000 });
    await select(s => s.array)
      .find(s => s.id).eq(1)
      .replace(fetchTodo, { cacheFor: 1000 });
    await select(s => s.array)
      .replaceAll(fetchTodos); 0
    await select(s => s.array)
      .find(s => s.id).eq(1).replace(fetchTodo2);
    expect(select().read().array).toEqual([{ id: 1, value: 'testy' }]);
    select(s => s.array)
      .find(s => s.id).eq(1)
      .invalidateCache();
    await select(s => s.array)
      .find(s => s.id).eq(1)
      .replace(fetchTodo2);
    expect(select().read().array).toEqual([{ id: 1, value: 'testyy' }]);
      done();
  })

  it('should recover correctly when an error is thrown and an optimistic update is set and store value is none', done => {
    const select = createApplicationStore({ value: {} as { [key: string]: string } });
    select(s => s.value[0])
      .replace(reject(undefined), { optimisticallyUpdateWith: 'X' })
      .catch(() => {
        expect(select(s => s.value[0]).read()).toEqual(null);
        done();
      });
    expect(select(s => s.value[0]).read()).toEqual('X');
  })

  it('can perform a then() on a cached response', async done => {
    const select = createApplicationStore(initialState);
    await select(s => s.array)
      .replaceAll(resolve([{ id: 1, value: 'onee' }]), { cacheFor: 1000 });
    await select(s => s.array)
      .replaceAll(resolve([{ id: 1, value: 'oneee' }]))
      .then(() => done());
  })

  it('can getFutureState() off an un-cached response before async call', done => {
    const select = createApplicationStore(initialState);
    const f = select(s => s.array)
      .replaceAll(resolve([{ id: 1, value: 'onee' }]));
    expect(f.getFutureState()).toEqual({
      storeValue: initialState.array,
      error: null,
      wasResolved: false,
      isLoading: true,
      wasRejected: false
    });
    done();
  })

  it('can getFutureState() off an un-cached response after async call', async done => {
    const select = createApplicationStore(initialState);
    const f = select(s => s.array)
      .replaceAll(resolve([{ id: 1, value: 'onee' }]));
    await f;
    expect(f.getFutureState()).toEqual({
      storeValue: [{ id: 1, value: 'onee' }],
      error: null,
      wasResolved: true,
      isLoading: false,
      wasRejected: false
    });
    done();
  })

  it('can getFutureState() off a cached response', async done => {
    const select = createApplicationStore(initialState);
    await select(s => s.array)
      .replaceAll(resolve([{ id: 1, value: 'onee' }]), { cacheFor: 1000 });
    const f = await select(s => s.array)
      .replaceAll(resolve([{ id: 1, value: 'oneee' }]))
      .getFutureState();
    expect(f).toEqual({
      storeValue: [{ id: 1, value: 'onee' }],
      error: null,
      wasResolved: true,
      isLoading: false,
      wasRejected: false
    });
    done();
  })

});

