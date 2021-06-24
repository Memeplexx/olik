import { errorMessages } from '../src/shared-consts';
import { libState, testState } from '../src/shared-state';
import { createGlobalStore, createNestedStore, createGlobalStoreEnforcingTags } from '../src/store-creators';
import { transact } from '../src/transact';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('async', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  beforeEach(() => libState.nestedContainerStore = null);

  const initialState = {
    object: { property: '', property2: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    paginated: {} as { [key: string]: [{ id: number, value: string }] },
    promiseBypassTimes: {} as { [key: string]: string },
  }; 3

  it('should work with replaceAll()', async done => {
    const { get, read } = createGlobalStore(initialState);
    const payload = [{ id: 1, value: 'test' }];
    get(s => s.array)
      .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(read().array);
        expect(read().array).toEqual(payload);
        const payload2 = [{ id: 1, value: 'testy' }];
        get(s => s.array)
          .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(read().array).toEqual(payload);
            get(s => s.array).stopBypassingPromises();
            get(s => s.array)
              .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(read().array).toEqual(payload2);
                done();
              })
          })
      });
  })

  it('should work with insert()', done => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { id: 1, value: 'test' };
    get(s => s.array)
      .insert(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(read().array);
        expect(read().array).toEqual([...initialState.array, payload]);
        const payload2 = { id: 1, value: 'testy' };
        get(s => s.array)
          .insert(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(read().array).toEqual([...initialState.array, payload]);
            get(s => s.array).stopBypassingPromises();
            get(s => s.array)
              .insert(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(read().array).toEqual([...initialState.array, payload, payload2]);
                done();
              })
          })
      });
  })

  it('should work with patch()', done => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { property: 'xxx' };
    get(s => s.object)
      .patch(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(read().object);
        expect(read().object).toEqual({ ...initialState.object, ...payload });
        const payload2 = { property: 'yyy' };
        get(s => s.object)
          .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(read().object).toEqual({ ...initialState.object, ...payload });
            get(s => s.object).stopBypassingPromises();
            get(s => s.object)
              .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(read().object).toEqual({ ...initialState.object, ...payload2 });
                done();
              })
          })
      })
  })

  it('should work with replace()', done => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { property: 'xxx', property2: 'yyy' };
    get(s => s.object)
      .replace(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(read().object);
        expect(read().object).toEqual(payload);
        const payload2 = { property: 'xxx2', property2: 'yyy2' };
        get(s => s.object)
          .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(read().object).toEqual(payload);
            get(s => s.object).stopBypassingPromises();
            get(s => s.object)
              .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(read().object).toEqual(payload2);
                done();
              })
          })
      })
  })

  it('should work with upsertMatching()', done => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { id: 1, value: 'test' };
    get(s => s.array)
      .upsertMatching(s => s.id)
      .with(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(read().array);
        expect(read().array).toEqual([payload, initialState.array[1], initialState.array[2]]);
        const payload2 = { id: 1, value: 'testt' };
        get(s => s.array)
          .upsertMatching(s => s.id)
          .with(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(read().array).toEqual([payload, initialState.array[1], initialState.array[2]]);
            get(s => s.array).stopBypassingPromises();
            get(s => s.array)
              .upsertMatching(s => s.id)
              .with(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(read().array).toEqual([payload2, initialState.array[1], initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should work with findWhere().replace()', done => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { id: 2, value: 'twooo' };
    get(s => s.array)
      .findWhere(s => s.id).eq(2)
      .replace(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(read().array);
        expect(read().array).toEqual([initialState.array[0], payload, initialState.array[2]]);
        const payload2 = { id: 2, value: 'twooo' };
        get(s => s.array)
          .findWhere(s => s.id).eq(2)
          .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(read().array).toEqual([initialState.array[0], payload, initialState.array[2]]);
            get(s => s.array)
              .findWhere(s => s.id).eq(2)
              .stopBypassingPromises();
            get(s => s.array)
              .findWhere(s => s.id).eq(2)
              .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(read().array).toEqual([initialState.array[0], payload2, initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should work with filterWhere().replace()', done => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { id: 2, value: 'twooo' };
    get(s => s.array)
      .filterWhere(s => s.id).eq(2)
      .replace(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(read().array);
        expect(read().array).toEqual([initialState.array[0], payload, initialState.array[2]]);
        const payload2 = { id: 2, value: 'twooo' };
        get(s => s.array)
          .filterWhere(s => s.id).eq(2)
          .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(read().array).toEqual([initialState.array[0], payload, initialState.array[2]]);
            get(s => s.array)
              .filterWhere(s => s.id).eq(2)
              .stopBypassingPromises();
            get(s => s.array)
              .filterWhere(s => s.id).eq(2)
              .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(read().array).toEqual([initialState.array[0], payload2, initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should work with findWhere().patch()', done => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { value: 'twooo' };
    get(s => s.array)
      .findWhere(s => s.id).eq(2)
      .patch(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(read().array);
        expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
        const payload2 = { value: 'twoooz' };
        get(s => s.array)
          .findWhere(s => s.id).eq(2)
          .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
            get(s => s.array)
              .findWhere(s => s.id).eq(2)
              .stopBypassingPromises();
            get(s => s.array)
              .findWhere(s => s.id).eq(2)
              .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload2 }, initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should work with filterWhere().patch()', done => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { value: 'twooo' };
    get(s => s.array)
      .filterWhere(s => s.id).eq(2)
      .patch(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(read().array);
        expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
        const payload2 = { value: 'twoooz' };
        get(s => s.array)
          .filterWhere(s => s.id).eq(2)
          .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
            get(s => s.array)
              .filterWhere(s => s.id).eq(2)
              .stopBypassingPromises();
            get(s => s.array)
              .filterWhere(s => s.id).eq(2)
              .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload2 }, initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should work with findWhere().returnsTrue().replace()', done => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { id: 2, value: 'twooo' };
    get(s => s.array)
      .findWhere(s => s.id === 2).returnsTrue()
      .replace(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(read().array);
        expect(read().array).toEqual([initialState.array[0], payload, initialState.array[2]]);
        const payload2 = { id: 2, value: 'twooo' };
        get(s => s.array)
          .findWhere(s => s.id === 2).returnsTrue()
          .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(read().array).toEqual([initialState.array[0], payload, initialState.array[2]]);
            get(s => s.array)
              .findWhere(s => s.id === 2).returnsTrue()
              .stopBypassingPromises();
            get(s => s.array)
              .findWhere(s => s.id === 2).returnsTrue()
              .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(read().array).toEqual([initialState.array[0], payload2, initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should work with filterWhere().returnsTrue().replace()', done => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { id: 2, value: 'twooo' };
    get(s => s.array)
      .filterWhere(s => s.id === 2).returnsTrue()
      .replace(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(read().array);
        expect(read().array).toEqual([initialState.array[0], payload, initialState.array[2]]);
        const payload2 = { id: 2, value: 'twooo' };
        get(s => s.array)
          .filterWhere(s => s.id === 2).returnsTrue()
          .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(read().array).toEqual([initialState.array[0], payload, initialState.array[2]]);
            get(s => s.array)
              .filterWhere(s => s.id === 2).returnsTrue()
              .stopBypassingPromises();
            get(s => s.array)
              .filterWhere(s => s.id === 2).returnsTrue()
              .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(read().array).toEqual([initialState.array[0], payload2, initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should work with findWhere().returnsTrue().patch()', done => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { value: 'twooo' };
    get(s => s.array)
      .findWhere(s => s.id === 2).returnsTrue()
      .patch(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(read().array);
        expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
        const payload2 = { value: 'twoooz' };
        get(s => s.array)
          .findWhere(s => s.id === 2).returnsTrue()
          .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
            get(s => s.array)
              .findWhere(s => s.id === 2).returnsTrue()
              .stopBypassingPromises();
            get(s => s.array)
              .findWhere(s => s.id === 2).returnsTrue()
              .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload2 }, initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should work with filterWhere().returnsTrue().patch()', done => {
    const { get, read } = createGlobalStore(initialState);
    const payload = { value: 'twooo' };
    get(s => s.array)
      .filterWhere(s => s.id === 2).returnsTrue()
      .patch(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(read().array);
        expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
        const payload2 = { value: 'twoooz' };
        get(s => s.array)
          .filterWhere(s => s.id === 2).returnsTrue()
          .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
            get(s => s.array)
              .filterWhere(s => s.id === 2).returnsTrue()
              .stopBypassingPromises();
            get(s => s.array)
              .filterWhere(s => s.id === 2).returnsTrue()
              .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(read().array).toEqual([initialState.array[0], { ...initialState.array[1], ...payload2 }, initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should handle a promise rejection', done => {
    const { get, read } = createGlobalStore(initialState);
    const rejection = 'test';
    get(s => s.array)
      .replaceAll(() => new Promise((resolve, reject) => setTimeout(() => reject(rejection), 10)), { bypassPromiseFor: 1000 })
      .catch(err => {
        expect(err).toEqual(rejection);
        done();
      });
  })

  it('should support tags in type', done => {
    const { get, read } = createGlobalStoreEnforcingTags(initialState, { tagsToAppearInType: true });
    const replacement = [{ id: 1, value: 'one' }];
    const tag = 'MyComponent';
    get(s => s.array)
      .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(replacement))), { tag })
      .then(() => {
        expect(testState.currentAction).toEqual({
          type: `array.replaceAll() [${tag}]`,
          replacement,
        });
        done();
      });
  })

  it('should support tags in payload', done => {
    const { get, read } = createGlobalStoreEnforcingTags(initialState);
    const replacement = [{ id: 1, value: 'one' }];
    const tag = 'MyComponent';
    get(s => s.array)
      .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(replacement))), { tag })
      .then(() => {
        expect(testState.currentAction).toEqual({
          type: 'array.replaceAll()',
          replacement,
          tag
        });
        done();
      });
  })

  it('should not be able to support transactions', () => {
    const { get, read } = createGlobalStore(initialState);
    expect(() => transact(
      () => get(s => s.array).replaceAll(() => new Promise(resolve => setTimeout(() => resolve([]), 10))),
    )).toThrowError(errorMessages.PROMISES_NOT_ALLOWED_IN_TRANSACTIONS);
  })

  it('should not be able to support top-level stores', () => {
    const { get, read } = createGlobalStore(0);
    expect(() => get().replace(() => new Promise(resolve => setTimeout(() => resolve(1), 10)), { bypassPromiseFor: 1000 }))
      .toThrowError(errorMessages.INVALID_CONTAINER_FOR_CACHED_DATA);
  })

  it('should automatically clear up expired cache keys', done => {
    const { get, read } = createGlobalStore(initialState);
    const payload = [{ id: 1, value: 'test' }];
    get(s => s.object)
      .replace(() => new Promise(resolve => setTimeout(() => resolve({ property: 'fdfd', property2: 'fdfd' }), 10)), { bypassPromiseFor: 1000 })
    get(s => s.array)
      .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 10 })
      .then(() => {
        setTimeout(() => {
          expect(Object.keys(read().promiseBypassTimes)).toEqual(['object.replace()']);
          done();
        }, 100);
      });
  })

  it('should work with nested stores', done => {
    const { get, read } = createGlobalStore(initialState);
    const nested = createNestedStore({ prop: '' }, { componentName: 'hello', instanceName: 'test' });
    const payload = 'test';
    nested.get(s => s.prop)
      .replace(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(() => {
        expect(nested.read().prop).toEqual(payload);
        done();
      });
  })

  it('should de-duplicate simultaneous requests', done => {
    const { get, read } = createGlobalStore(initialState);
    get(s => s.array)
      .replaceAll(() => new Promise(resolve => setTimeout(() => resolve([{ id: 1, value: 'test' }]), 10)));
    setTimeout(() => {
      get(s => s.array)
        .replaceAll(() => new Promise(resolve => setTimeout(() => resolve([{ id: 2, value: 'testy' }]), 10)))
        .then(() => {
          expect(read().array).toEqual([{ id: 1, value: 'test' }]);
          done();
        });
    }, 5)
  })

  it('should be able to paginate', done => {
    const todos = new Array(50).fill(null).map((e, i) => ({ id: i + 1, value: `value ${i + 1}` }));
    const { get, read } = createGlobalStore(initialState);
    get(s => s.paginated[0])
      .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(todos.slice(0, 10)))))
      .then(() => {
        expect(read().paginated[0]).toEqual(todos.slice(0, 10));
        get(s => s.paginated[1])
          .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(todos.slice(10, 20)))))
          .then(() => {
            expect(read().paginated[1]).toEqual(todos.slice(10, 20));
            get(s => s.paginated)
              .replace({});
            expect(read().paginated).toEqual({});
            done();
          })
      })
  })

  it('should not bypass a promise if it has been rejected', done => {
    const { get, read } = createGlobalStore(initialState);
    const payload = [{ id: 1, value: 'one' }];
    get(s => s.array)
      .replaceAll(() => new Promise((resolve, reject) => setTimeout(() => reject('test'), 10)), { bypassPromiseFor: 1000 })
      .catch(error => {
        get(s => s.array)
          .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
          .then(res => {
            expect(res).toEqual(read().array);
            expect(read().array).toEqual(payload);
            done();
          });
      });
  })

  it('should be able to perform an optimistic update', done => {
    const { get, read } = createGlobalStore(initialState);
    const optimisticValue = [{ id: 6, value: 'six' }];
    const resolvedValue = [{ id: 7, value: 'seven' }];
    get(s => s.array)
      .replaceAll(() => new Promise(resolve => resolve(resolvedValue)), { optimisticallyUpdateWith: optimisticValue })
      .then(() => {
        expect(read().array).toEqual(resolvedValue);
        done();
      });
    expect(read().array).toEqual(optimisticValue);
  })

  it('should revert an optimistic update if there is an error', done => {
    const { get, read } = createGlobalStore(initialState);
    const optimisticValue = [{ id: 6, value: 'six' }];
    get(s => s.array)
      .replaceAll(() => new Promise((resolve, reject) => reject('test')), { optimisticallyUpdateWith: optimisticValue })
      .catch(() => {
        expect(read().array).toEqual(initialState.array);
        done();
      });
    expect(read().array).toEqual(optimisticValue);
  })


  it('should invalidate caches for replaceAll() independantly of replace()', done => {
    const { get, read } = createGlobalStore(initialState);
    const fetchTodos = () => new Promise<{ id: number, value: string }[]>(resolve => setTimeout(() => resolve([{ id: 1, value: 'test' }]), 10));
    const fetchTodo = () => new Promise<{ id: number, value: string }>(resolve => setTimeout(() => resolve({ id: 1, value: 'testy' })));
    const fetchTodo2 = () => new Promise<{ id: number, value: string }>(resolve => setTimeout(() => resolve({ id: 1, value: 'testyy' })));
    get(s => s.array).
      replaceAll(fetchTodos, { bypassPromiseFor: 1000 })
      .then(() => get(s => s.array).filterWhere(s => s.id).eq(1).replace(fetchTodo, { bypassPromiseFor: 1000 }))
      .then(() => get(s => s.array).replaceAll(fetchTodos))
      .then(() => get(s => s.array).filterWhere(s => s.id).eq(1).replace(fetchTodo2))
      .then(() => {
        expect(read().array).toEqual([{ id: 1, value: 'testy' }]);
        get(s => s.array).filterWhere(s => s.id).eq(1).stopBypassingPromises();
      }).then(() => get(s => s.array).filterWhere(s => s.id).eq(1).replace(fetchTodo2))
      .then(() => {
        expect(read().array).toEqual([{ id: 1, value: 'testyy' }]);
        done();
      });
  })

});

