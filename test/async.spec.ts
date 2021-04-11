import { set, transact } from '../src';
import { errorMessages } from '../src/shared-consts';
import { libState } from '../src/shared-state';
import { setEnforceTags } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('async', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '', property2: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    paginated: {} as { [key: string]: [{ id: number, value: string }] },
    promiseBypassTTLs: {} as { [key: string]: string },
  };

  it('should work with replaceAll()', done => {
    const select = set(initialState);
    const payload = [{ id: 1, value: 'test' }];
    select(s => s.array)
      .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromise: { for: 1000 } })
      .then(() => {
        expect(select(s => s.array).read()).toEqual(payload);
        const payload2 = [{ id: 1, value: 'testy' }];
        select(s => s.array)
          .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual(payload);
            select(s => s.array).invalidateCache();
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
    const select = set(initialState);
    const payload = { id: 1, value: 'test' };
    select(s => s.array)
      .insert(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromise: { for: 1000 } })
      .then(() => {
        expect(select(s => s.array).read()).toEqual([...initialState.array, payload]);
        const payload2 = { id: 1, value: 'testy' };
        select(s => s.array)
          .insert(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([...initialState.array, payload]);
            select(s => s.array).invalidateCache();
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
    const select = set(initialState);
    const payload = { property: 'xxx' };
    select(s => s.object)
      .patch(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromise: { for: 1000 } })
      .then(() => {
        expect(select(s => s.object).read()).toEqual({ ...initialState.object, ...payload });
        const payload2 = { property: 'yyy' };
        select(s => s.object)
          .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.object).read()).toEqual({ ...initialState.object, ...payload });
            select(s => s.object).invalidateCache();
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
    const select = set(initialState);
    const payload = { property: 'xxx', property2: 'yyy' };
    select(s => s.object)
      .replace(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromise: { for: 1000 } })
      .then(() => {
        expect(select(s => s.object).read()).toEqual(payload);
        const payload2 = { property: 'xxx2', property2: 'yyy2' };
        select(s => s.object)
          .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.object).read()).toEqual(payload);
            select(s => s.object).invalidateCache();
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
    const select = set(initialState);
    const payload = { id: 1, value: 'test' };
    select(s => s.array)
      .upsertMatching(s => s.id)
      .with(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromise: { for: 1000 } })
      .then(() => {
        expect(select(s => s.array).read()).toEqual([payload, initialState.array[1], initialState.array[2]]);
        const payload2 = { id: 1, value: 'testt' };
        select(s => s.array)
          .upsertMatching(s => s.id)
          .with(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([payload, initialState.array[1], initialState.array[2]]);
            select(s => s.array).invalidateCache();
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
    const select = set(initialState);
    const payload = { id: 2, value: 'twooo' };
    select(s => s.array)
      .findWhere(s => s.id).eq(2)
      .replace(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromise: { for: 1000 } })
      .then(() => {
        expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
        const payload2 = { id: 2, value: 'twooo' };
        select(s => s.array)
          .findWhere(s => s.id).eq(2)
          .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
            select(s => s.array)
              .findWhere(s => s.id).eq(2)
              .invalidateCache();
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
    const select = set(initialState);
    const payload = { id: 2, value: 'twooo' };
    select(s => s.array)
      .filterWhere(s => s.id).eq(2)
      .replace(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromise: { for: 1000 } })
      .then(() => {
        expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
        const payload2 = { id: 2, value: 'twooo' };
        select(s => s.array)
          .filterWhere(s => s.id).eq(2)
          .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
            select(s => s.array)
              .filterWhere(s => s.id).eq(2)
              .invalidateCache();
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
    const select = set(initialState);
    const payload = { value: 'twooo' };
    select(s => s.array)
      .findWhere(s => s.id).eq(2)
      .patch(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromise: { for: 1000 } })
      .then(() => {
        expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
        const payload2 = { value: 'twoooz' };
        select(s => s.array)
          .findWhere(s => s.id).eq(2)
          .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
            select(s => s.array)
              .findWhere(s => s.id).eq(2)
              .invalidateCache();
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
    const select = set(initialState);
    const payload = { value: 'twooo' };
    select(s => s.array)
      .filterWhere(s => s.id).eq(2)
      .patch(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromise: { for: 1000 } })
      .then(() => {
        expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
        const payload2 = { value: 'twoooz' };
        select(s => s.array)
          .filterWhere(s => s.id).eq(2)
          .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
            select(s => s.array)
              .filterWhere(s => s.id).eq(2)
              .invalidateCache();
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
    const select = set(initialState);
    const payload = { id: 2, value: 'twooo' };
    select(s => s.array)
      .findWhere(s => s.id === 2).returnsTrue()
      .replace(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromise: { for: 1000 } })
      .then(() => {
        expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
        const payload2 = { id: 2, value: 'twooo' };
        select(s => s.array)
          .findWhere(s => s.id === 2).returnsTrue()
          .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
            select(s => s.array)
              .findWhere(s => s.id === 2).returnsTrue()
              .invalidateCache();
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
    const select = set(initialState);
    const payload = { id: 2, value: 'twooo' };
    select(s => s.array)
      .filterWhere(s => s.id === 2).returnsTrue()
      .replace(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromise: { for: 1000 } })
      .then(() => {
        expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
        const payload2 = { id: 2, value: 'twooo' };
        select(s => s.array)
          .filterWhere(s => s.id === 2).returnsTrue()
          .replace(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([initialState.array[0], payload, initialState.array[2]]);
            select(s => s.array)
              .filterWhere(s => s.id === 2).returnsTrue()
              .invalidateCache();
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
    const select = set(initialState);
    const payload = { value: 'twooo' };
    select(s => s.array)
      .findWhere(s => s.id === 2).returnsTrue()
      .patch(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromise: { for: 1000 } })
      .then(() => {
        expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
        const payload2 = { value: 'twoooz' };
        select(s => s.array)
          .findWhere(s => s.id === 2).returnsTrue()
          .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
            select(s => s.array)
              .findWhere(s => s.id === 2).returnsTrue()
              .invalidateCache();
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
    const select = set(initialState);
    const payload = { value: 'twooo' };
    select(s => s.array)
      .filterWhere(s => s.id === 2).returnsTrue()
      .patch(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromise: { for: 1000 } })
      .then(() => {
        expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
        const payload2 = { value: 'twoooz' };
        select(s => s.array)
          .filterWhere(s => s.id === 2).returnsTrue()
          .patch(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)))
          .then(() => {
            expect(select(s => s.array).read()).toEqual([initialState.array[0], { ...initialState.array[1], ...payload }, initialState.array[2]]);
            select(s => s.array)
              .filterWhere(s => s.id === 2).returnsTrue()
              .invalidateCache();
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

  it('should support cache keys', done => {
    const select = set(initialState);
    const payload = [{ id: 1, value: 'test' }];
    select(s => s.array)
      .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(payload), 10)), { bypassPromise: { for: 1000, keys: ['one'] } })
      .then(() => {
        expect(Object.keys(select(s => s.promiseBypassTTLs).read())).toEqual(['array.one']);
        expect(select(s => s.array).read()).toEqual(payload);
        const payload2 = [{ id: 1, value: 'testy' }];
        select(s => s.array)
          .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(payload2), 10)), { bypassPromise: { for: 1000, keys: ['two'] } })
          .then(() => {
            expect(Object.keys(select(s => s.promiseBypassTTLs).read())).toEqual(['array.one', 'array.two']);
            expect(select(s => s.array).read()).toEqual(payload2);
            const payload3 = [{ id: 1, value: 'testyy' }];
            select(s => s.array)
              .replaceAll(() => new Promise(resolve => setTimeout(() => resolve(payload3), 10)), { bypassPromise: { for: 1000, keys: ['three'] } })
                .then(() => {
                  expect(Object.keys(select(s => s.promiseBypassTTLs).read())).toEqual(['array.one', 'array.two', 'array.three']);
                  expect(select(s => s.array).read()).toEqual(payload3);
                  done();
                })
          })
      });
  })

  it('should handle a promise rejection', done => {
    const select = set(initialState);
    const rejection = 'test';
    select(s => s.array)
      .replaceAll(() => new Promise((resolve, reject) => setTimeout(() => reject(rejection))), { bypassPromise: { for: 1000 } })
      .then(() => console.log('...'))
      .catch(err => {
        expect(err).toEqual(rejection);
        done();
      });
  })

  it('should support tags', done => {
    const select = setEnforceTags(initialState);
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

  it('should not be able to support transactions', () => {
    const select = set(initialState);
    expect(() => transact(
      () => select(s => s.array).replaceAll(() => new Promise(resolve => setTimeout(() => resolve([]), 10))),
    )).toThrowError(errorMessages.PROMISES_NOT_ALLOWED_IN_TRANSACTIONS);
  })

  it('should not be able to support top-level stores', () => {
    const select = set(0);
    expect(() => select().replace(() => new Promise(resolve => setTimeout(() => resolve(1), 10)), { bypassPromise: { for: 1000 } }))
      .toThrowError(errorMessages.INVALID_CONTAINER_FOR_CACHED_DATA);
  })

});

