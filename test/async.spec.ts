import { store, transact } from '../src';
import { errorMessages } from '../src/shared-consts';
import { libState } from '../src/shared-state';
import { nestedStore, storeEnforcingTags } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('async', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  beforeEach(() => libState.activePromises = {});

  const initialState = {
    object: { property: '', property2: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    paginated: {} as { [key: string]: [{ id: number, value: string }] },
    promiseBypassTimes: {} as { [key: string]: string },
  }; 3

  it('should work with replaceAll()', async done => {
    const select = store(initialState);
    const payload = [{ id: 1, value: 'test' }];
    select(s => s.array)
      .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(select(s => s.array).read());
        expect(select(s => s.array).read()).toEqual(payload);
        const payload2 = [{ id: 1, value: 'testy' }];
        select(s => s.array)
          .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual(payload);
            select(s => s.array).stopBypassingPromises();
            select(s => s.array)
              .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(select(s => s.array).read()).toEqual(payload2);
                done();
              })
          })
      });
  })

  it('should work with insert()', done => {
    const select = store(initialState);
    const payload = { id: 1, value: 'test' };
    select(s => s.array)
      .insert(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(select(s => s.array).read());
        expect(select(s => s.array).read()).toEqual([...initialState.array, payload]);
        const payload2 = { id: 1, value: 'testy' };
        select(s => s.array)
          .insert(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([...initialState.array, payload]);
            select(s => s.array).stopBypassingPromises();
            select(s => s.array)
              .insert(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(select(s => s.array).read()).toEqual([...initialState.array, payload, payload2]);
                done();
              })
          })
      });
  })

  it('should work with patch()', done => {
    const select = store(initialState);
    const payload = { property: 'xxx' };
    select(s => s.object)
      .patch(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(select(s => s.object).read());
        expect(select(s => s.object).read()).toEqual({ ...initialState.object, ...payload });
        const payload2 = { property: 'yyy' };
        select(s => s.object)
          .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.object).read()).toEqual({ ...initialState.object, ...payload });
            select(s => s.object).stopBypassingPromises();
            select(s => s.object)
              .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(select(s => s.object).read()).toEqual({ ...initialState.object, ...payload2 });
                done();
              })
          })
      })
  })

  it('should work with replace()', done => {
    const select = store(initialState);
    const payload = { property: 'xxx', property2: 'yyy' };
    select(s => s.object)
      .replace(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(select(s => s.object).read());
        expect(select(s => s.object).read()).toEqual(payload);
        const payload2 = { property: 'xxx2', property2: 'yyy2' };
        select(s => s.object)
          .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.object).read()).toEqual(payload);
            select(s => s.object).stopBypassingPromises();
            select(s => s.object)
              .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(select(s => s.object).read()).toEqual(payload2);
                done();
              })
          })
      })
  })

  it('should work with upsertMatching()', done => {
    const select = store(initialState);
    const payload = { id: 1, value: 'test' };
    select(s => s.array)
      .upsertMatching(s => s.id)
      .with(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(select(s => s.array).read());
        expect(select(s => s.array).read()).toEqual([payload, initialState.array[1], initialState.array[2]]);
        const payload2 = { id: 1, value: 'testt' };
        select(s => s.array)
          .upsertMatching(s => s.id)
          .with(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([payload, initialState.array[1], initialState.array[2]]);
            select(s => s.array).stopBypassingPromises();
            select(s => s.array)
              .upsertMatching(s => s.id)
              .with(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(select(s => s.array).read()).toEqual([payload2, initialState.array[1], initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should work with findWhere().replace()', done => {
    const select = store(initialState);
    const payload = { id: 2, value: 'twooo' };
    select(s => s.array)
      .findWhere(s => s.id).eq(2)
      .replace(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(select(s => s.array).read());
        expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
        const payload2 = { id: 2, value: 'twooo' };
        select(s => s.array)
          .findWhere(s => s.id).eq(2)
          .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
            select(s => s.array)
              .findWhere(s => s.id).eq(2)
              .stopBypassingPromises();
            select(s => s.array)
              .findWhere(s => s.id).eq(2)
              .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(select(s => s.array).read()).toEqual([initialState.array[0], payload2, initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should work with filterWhere().replace()', done => {
    const select = store(initialState);
    const payload = { id: 2, value: 'twooo' };
    select(s => s.array)
      .filterWhere(s => s.id).eq(2)
      .replace(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(select(s => s.array).read());
        expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
        const payload2 = { id: 2, value: 'twooo' };
        select(s => s.array)
          .filterWhere(s => s.id).eq(2)
          .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
            select(s => s.array)
              .filterWhere(s => s.id).eq(2)
              .stopBypassingPromises();
            select(s => s.array)
              .filterWhere(s => s.id).eq(2)
              .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(select(s => s.array).read()).toEqual([initialState.array[0], payload2, initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should work with findWhere().patch()', done => {
    const select = store(initialState);
    const payload = { value: 'twooo' };
    select(s => s.array)
      .findWhere(s => s.id).eq(2)
      .patch(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(select(s => s.array).read());
        expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
        const payload2 = { value: 'twoooz' };
        select(s => s.array)
          .findWhere(s => s.id).eq(2)
          .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
            select(s => s.array)
              .findWhere(s => s.id).eq(2)
              .stopBypassingPromises();
            select(s => s.array)
              .findWhere(s => s.id).eq(2)
              .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload2 }, initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should work with filterWhere().patch()', done => {
    const select = store(initialState);
    const payload = { value: 'twooo' };
    select(s => s.array)
      .filterWhere(s => s.id).eq(2)
      .patch(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(select(s => s.array).read());
        expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
        const payload2 = { value: 'twoooz' };
        select(s => s.array)
          .filterWhere(s => s.id).eq(2)
          .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
            select(s => s.array)
              .filterWhere(s => s.id).eq(2)
              .stopBypassingPromises();
            select(s => s.array)
              .filterWhere(s => s.id).eq(2)
              .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload2 }, initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should work with findWhere().returnsTrue().replace()', done => {
    const select = store(initialState);
    const payload = { id: 2, value: 'twooo' };
    select(s => s.array)
      .findWhere(s => s.id === 2).returnsTrue()
      .replace(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(select(s => s.array).read());
        expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
        const payload2 = { id: 2, value: 'twooo' };
        select(s => s.array)
          .findWhere(s => s.id === 2).returnsTrue()
          .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
            select(s => s.array)
              .findWhere(s => s.id === 2).returnsTrue()
              .stopBypassingPromises();
            select(s => s.array)
              .findWhere(s => s.id === 2).returnsTrue()
              .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(select(s => s.array).read()).toEqual([initialState.array[0], payload2, initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should work with filterWhere().returnsTrue().replace()', done => {
    const select = store(initialState);
    const payload = { id: 2, value: 'twooo' };
    select(s => s.array)
      .filterWhere(s => s.id === 2).returnsTrue()
      .replace(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(select(s => s.array).read());
        expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
        const payload2 = { id: 2, value: 'twooo' };
        select(s => s.array)
          .filterWhere(s => s.id === 2).returnsTrue()
          .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
            select(s => s.array)
              .filterWhere(s => s.id === 2).returnsTrue()
              .stopBypassingPromises();
            select(s => s.array)
              .filterWhere(s => s.id === 2).returnsTrue()
              .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(select(s => s.array).read()).toEqual([initialState.array[0], payload2, initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should work with findWhere().returnsTrue().patch()', done => {
    const select = store(initialState);
    const payload = { value: 'twooo' };
    select(s => s.array)
      .findWhere(s => s.id === 2).returnsTrue()
      .patch(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(select(s => s.array).read());
        expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
        const payload2 = { value: 'twoooz' };
        select(s => s.array)
          .findWhere(s => s.id === 2).returnsTrue()
          .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
            select(s => s.array)
              .findWhere(s => s.id === 2).returnsTrue()
              .stopBypassingPromises();
            select(s => s.array)
              .findWhere(s => s.id === 2).returnsTrue()
              .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload2 }, initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should work with filterWhere().returnsTrue().patch()', done => {
    const select = store(initialState);
    const payload = { value: 'twooo' };
    select(s => s.array)
      .filterWhere(s => s.id === 2).returnsTrue()
      .patch(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(res => {
        expect(res).toEqual(select(s => s.array).read());
        expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
        const payload2 = { value: 'twoooz' };
        select(s => s.array)
          .filterWhere(s => s.id === 2).returnsTrue()
          .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
            select(s => s.array)
              .filterWhere(s => s.id === 2).returnsTrue()
              .stopBypassingPromises();
            select(s => s.array)
              .filterWhere(s => s.id === 2).returnsTrue()
              .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
              .then(() => {
                expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload2 }, initialState.array[2]]);
                done();
              })
          })
      })
  })

  it('should handle a promise rejection', done => {
    const select = store(initialState);
    const rejection = 'test';
    select(s => s.array)
      .replaceAll(() => new Promise((resolve, reject) => setTimeout(() => reject(rejection), 10)), { bypassPromiseFor: 1000 })
      .then(() => console.log('...'))
      .catch(err => {
        expect(err).toEqual(rejection);
        done();
      });
  })

  it('should support tags in type', done => {
    const select = storeEnforcingTags(initialState, { tagsToAppearInType: true });
    const replacement = [{ id: 1, value: 'one' }];
    const tag = 'MyComponent';
    select(s => s.array)
      .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(replacement))), { tag })
      .then(() => {
        expect(libState.currentAction).toEqual({
          type: `array.replaceAll() [${tag}]`,
          replacement,
        });
        done();
      });
  })

  it('should support tags in payload', done => {
    const select = storeEnforcingTags(initialState);
    const replacement = [{ id: 1, value: 'one' }];
    const tag = 'MyComponent';
    select(s => s.array)
      .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(replacement))), { tag })
      .then(() => {
        expect(libState.currentAction).toEqual({
          type: 'array.replaceAll()',
          replacement,
          tag
        });
        done();
      });
  })

  it('should not be able to support transactions', () => {
    const select = store(initialState);
    expect(() => transact(
      () => select(s => s.array).replaceAll(() => new Promise(resolve => setTimeout(() => resolve([]), 10))),
    )).toThrowError(errorMessages.PROMISES_NOT_ALLOWED_IN_TRANSACTIONS);
  })

  it('should not be able to support top-level stores', () => {
    const select = store(0);
    expect(() => select().replace(() => new Promise(resolve => setTimeout(() => resolve(1), 10)), { bypassPromiseFor: 1000 }))
      .toThrowError(errorMessages.INVALID_CONTAINER_FOR_CACHED_DATA);
  })

  it('should automatically clear up expired cache keys', done => {
    const select = store(initialState);
    const payload = [{ id: 1, value: 'test' }];
    select(s => s.object)
      .replace(() => new Promise(resolve => setTimeout(() => resolve({ property: 'fdfd', property2: 'fdfd' }), 10)), { bypassPromiseFor: 1000 })
    select(s => s.array)
      .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 10 })
      .then(() => {
        setTimeout(() => {
          expect(Object.keys(select(s => s.promiseBypassTimes).read())).toEqual(['object.replace()']);
          done();
        }, 100);
      });
  })

  it('should work with nested stores', done => {
    const select = store(initialState, { isContainerForNestedStores: true });
    const selectNested = nestedStore({ prop: '' }, { storeName: 'hello' });
    const payload = 'test';
    selectNested(s => s.prop)
      .replace(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
      .then(() => {
        expect(selectNested(s => s.prop).read()).toEqual(payload);
        done();
      });
  })

  it('should de-duplicate simultaneous requests', done => {
    const select = store(initialState);
    select(s => s.array)
      .replaceAll(() => new Promise(resolve => setTimeout(() => resolve([{ id: 1, value: 'test' }]), 10)));
    setTimeout(() => {
      select(s => s.array)
        .replaceAll(() => new Promise(resolve => setTimeout(() => resolve([{ id: 2, value: 'testy' }]), 10)))
        .then(() => {
          expect(select(s => s.array).read()).toEqual([{ id: 1, value: 'test' }]);
          done();
        });
    }, 5)
  })

  it('should be able to paginate', done => {
    const todos = new Array(50).fill(null).map((e, i) => ({ id: i + 1, value: `value ${i + 1}` }));
    const select = store(initialState);
    select(s => s.paginated[0])
      .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(todos.slice(0, 10)))))
      .then(() => {
        expect(select(s => s.paginated[0]).read()).toEqual(todos.slice(0, 10));
        select(s => s.paginated[1])
          .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(todos.slice(10, 20)))))
          .then(() => {
            expect(select(s => s.paginated[1]).read()).toEqual(todos.slice(10, 20));
            select(s => s.paginated)
              .replace({});
            expect(select(s => s.paginated).read()).toEqual({});
            done();
          })
      })
  })

  it('should not bypass a promise if it has been rejected', done => {
    const select = store(initialState);
    const payload = [{ id: 1, value: 'one' }];
    libState.logLevel = 'DEBUG';
    select(s => s.array)
      .replaceAll(() => new Promise((resolve, reject) => setTimeout(() => reject('test'), 10)), { bypassPromiseFor: 1000 })
      .catch(error => {
        select(s => s.array)
          .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromiseFor: 1000 })
          .then(res => {
            expect(res).toEqual(select(s => s.array).read());
            expect(select(s => s.array).read()).toEqual(payload);
            done();
          });
      });
  })

});

