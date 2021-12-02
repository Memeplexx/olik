
import { createApplicationStore, libState, testState } from '../src/index';

const resolve = <T>(data: T, timeout = 10) => () => new Promise<T>(resolve => setTimeout(() => resolve(data), timeout));
const reject = (rejection: any, timeout = 10) => () => new Promise((resolve, reject) => setTimeout(() => reject(rejection), timeout));

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
      .then(() => {
        expect(select.num.read()).toEqual(asyncResult);
        done();
      });
    select.num.replace(syncResult);
    expect(select.num.read()).toEqual(syncResult);
  })

  it('should support caching', done => {
    const select = createApplicationStore({ num: 0 });
    const replacement = 1;
    const replacement2 = 2;
    select.num
      .replace(resolve(replacement), { cacheFor: 1000 })
      .then(() => {
        expect(select.num.read()).toEqual(replacement);
        select.num.replace(resolve(replacement2))
          .then(() => {
            expect(select.num.read()).toEqual(replacement);
            select.num.invalidateCache();
            select.num.replace(resolve(replacement2))
              .then(() => {
                done();
              })
          });
      });
  })

});
