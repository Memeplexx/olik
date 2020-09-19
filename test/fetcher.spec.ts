import { make, makeEnforceTags } from '../src';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Fetcher', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should perform a basic fetch', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    const fetcher = getStore(s => s.array).createFetcher(
      () => new Promise(resolve => setTimeout(() => resolve([{ id: 2, value: 'dd' }]), 100)));
    const fetchPromise = fetcher.fetch();
    expect(fetcher.status).toEqual('resolving');
    fetchPromise.then(r => {
      expect(r).toEqual([{ id: 2, value: 'dd' }]);
      done();
    });
  })

  it('should cache fetches correctly', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    let numberOfTimesPromiseIsCalled = 0;
    const fetcher = getStore(s => s.array).createFetcher(
      () => new Promise(resolve => setTimeout(() => { numberOfTimesPromiseIsCalled++; resolve([{ id: 2, value: 'dd' }]); }, 10)), { cacheForMillis: 10 })
    fetcher.fetch().then();
    setTimeout(() => fetcher.fetch().then(r => {
      expect(r).toEqual([{ id: 2, value: 'dd' }]);
      expect(numberOfTimesPromiseIsCalled).toEqual(1);
      done();
    }), 15);
  })

  it('should expire cache fetches correctly', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    let numberOfTimesPromiseIsCalled = 0;
    const fetcher = getStore(s => s.array).createFetcher(
      () => new Promise(resolve => setTimeout(() => { numberOfTimesPromiseIsCalled++; resolve([{ id: 2, value: 'dd' }]); }, 10)), { cacheForMillis: 10 })
    fetcher.fetch().then();
    setTimeout(() => fetcher.fetch().then(r => {
      expect(r).toEqual([{ id: 2, value: 'dd' }]);
      expect(numberOfTimesPromiseIsCalled).toEqual(2);
      done();
    }), 30);
  })

  it('should invalidate cache fetches correctly', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    let numberOfTimesPromiseIsCalled = 0;
    const fetcher = getStore(s => s.array).createFetcher(
      () => new Promise(resolve => setTimeout(() => { numberOfTimesPromiseIsCalled++; resolve([{ id: 2, value: 'dd' }]); }, 10)), { cacheForMillis: 20 })
    fetcher.fetch().then();
    setTimeout(() => {
      fetcher.invalidateCache();
      fetcher.fetch().then(r => {
        expect(r).toEqual([{ id: 2, value: 'dd' }]);
        expect(numberOfTimesPromiseIsCalled).toEqual(2);
        done();
      });
    }, 10);

  });

  it('should listen to status changes', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    const fetcher = getStore(s => s.array).createFetcher(
      () => new Promise(resolve => setTimeout(() => resolve([{ id: 2, value: 'dd' }]), 10)), { cacheForMillis: 20 });
    fetcher.onStatusChange(status => console.log(status));
    fetcher.fetch().then(() => {
      console.log('DONE!');
      done();
    });
  })

  it('should handle errors correctly', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    const fetcher = getStore(s => s.array).createFetcher(
      () => new Promise((resolve, reject) => setTimeout(() => reject('Woops'), 10)), { cacheForMillis: 20 });
    let errorCaught = false;
    fetcher.fetch()
      .catch(e => errorCaught = true)
      .finally(() => {
        expect(errorCaught).toEqual(true);
        done();
      })
  })

  it('should work with tags correctly', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = makeEnforceTags('state', initialState);
    const fetcher = getStore(s => s.array).createFetcher(
      () => new Promise(resolve => setTimeout(() => resolve([{ id: 2, value: 'dd' }]), 100)));
    const tag = 'mytag';
    const fetchPromise = fetcher.fetch(tag);
    expect(fetcher.status).toEqual('resolving');
    fetchPromise.then(r => {
      expect(r).toEqual([{ id: 2, value: 'dd' }]);
      expect(tests.currentAction.type).toEqual(`array.replaceAll() [${tag}]`)
      done();
    });
  })

});