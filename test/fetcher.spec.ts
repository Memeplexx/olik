import { make } from "../src";

describe('Fetcher', () => {

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

});