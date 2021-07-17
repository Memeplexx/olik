import { combineObserversAcrossStores, createGlobalStore, createGlobalStoreEnforcingTags, createNestedStore } from '../src/public-api';
import { skip } from 'rxjs/operators';

describe('Angular', () => {

  const initialState = {
    object: { property: 'a' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    string: 'b',
  };

  it('should create and update a store', () => {
    const select = createGlobalStore(initialState, { devtools: false });
    select(s => s.object.property)
      .replace('test');
    expect(select().read().object.property).toEqual('test');
  })

  it('should be able to observe state updates', done => {
    const select = createGlobalStore(initialState, { devtools: false });
    const obs$ = select(s => s.object.property).read();
    const payload = 'test';
    obs$.pipe(skip(1)).subscribe(val => {
      expect(val).toEqual(payload);
      done();
    });
    store.get(s => s.object.property).replace(payload);
  })

  it('should be able to observe a fetch, and resolve', done => {
    const store = createGlobalStore(initialState, { devtools: false });
    let count = 0;
    const fetchProperty = () => new Promise<string>(resolve => setTimeout(() => resolve('val ' + count), 10));
    const obs$ = store.observeFetch(() => store.get(s => s.object.property).replace(fetchProperty));
    obs$.subscribe(val => {
      count++;
      if (count === 1) {
        expect(val.isLoading).toEqual(true);
        expect(val.wasRejected).toEqual(false);
        expect(val.wasResolved).toEqual(false);
        expect(val.error).toEqual(null);
      } else if (count === 2) {
        expect(val.isLoading).toEqual(false);
        expect(val.wasRejected).toEqual(false);
        expect(val.wasResolved).toEqual(true);
        expect(val.error).toEqual(null);
        expect(val.storeValue).toEqual('val 1');
        done();
      }
    });
  })

  it('should be able to observe a fetch, and reject', done => {
    const store = createGlobalStore(initialState, { devtools: false });
    let count = 0;
    const fetchAndReject = () => new Promise<string>((resolve, reject) => setTimeout(() => reject('test'), 10));
    const obs$ = store.observeFetch(() => store.get(s => s.object.property).replace(fetchAndReject));
    obs$.subscribe(val => {
      count++;
      if (count === 1) {
        expect(val.isLoading).toEqual(true);
        expect(val.wasRejected).toEqual(false);
        expect(val.wasResolved).toEqual(false);
        expect(val.error).toEqual(null);
      } else if (count === 2) {
        expect(val.isLoading).toEqual(false);
        expect(val.wasRejected).toEqual(true);
        expect(val.wasResolved).toEqual(false);
        expect(val.error).toEqual('test');
        expect(val.storeValue).toEqual('a');
        done();
      }
    });
  })


  it('should create and update a store which enforces tags', () => {
    const store = createGlobalStoreEnforcingTags(initialState, { devtools: false });
    store.get(s => s.object.property)
      .replace('test', { tag: 'Tag' });
    expect(store.get().read().object.property).toEqual('test');
  })

  it('should be able to observe state updates for a store which enforces tags', done => {
    const store = createGlobalStoreEnforcingTags(initialState, { devtools: false });
    const obs$ = store.observe(s => s.object.property);
    const payload = 'test';
    obs$.pipe(skip(1)).subscribe(val => {
      expect(val).toEqual(payload);
      done();
    });
    store.get(s => s.object.property).replace(payload, { tag: 'Tag' });
  })

  it('should be able to observe a fetch, and resolve using a store which enforces tags', done => {
    const store = createGlobalStoreEnforcingTags(initialState, { devtools: false });
    let count = 0;
    const fetchProperty = () => new Promise<string>(resolve => setTimeout(() => resolve('val ' + count), 10));
    const obs$ = store.observeFetch(() => store.get(s => s.object.property).replace(fetchProperty, { tag: 'Tag' }));
    obs$.subscribe(val => {
      count++;
      if (count === 1) {
        expect(val.isLoading).toEqual(true);
        expect(val.wasRejected).toEqual(false);
        expect(val.wasResolved).toEqual(false);
        expect(val.error).toEqual(null);
      } else if (count === 2) {
        expect(val.isLoading).toEqual(false);
        expect(val.wasRejected).toEqual(false);
        expect(val.wasResolved).toEqual(true);
        expect(val.error).toEqual(null);
        expect(val.storeValue).toEqual('val 1');
        done();
      }
    });
  })

  it('should be able to observe a fetch, and reject using a store which enforces tags', done => {
    const store = createGlobalStoreEnforcingTags(initialState, { devtools: false });
    let count = 0;
    const fetchAndReject = () => new Promise<string>((resolve, reject) => setTimeout(() => reject('test'), 10));
    const obs$ = store.observeFetch(() => store.get(s => s.object.property).replace(fetchAndReject, { tag: 'Tag' }));
    obs$.subscribe(val => {
      count++;
      if (count === 1) {
        expect(val.isLoading).toEqual(true);
        expect(val.wasRejected).toEqual(false);
        expect(val.wasResolved).toEqual(false);
        expect(val.error).toEqual(null);
      } else if (count === 2) {
        expect(val.isLoading).toEqual(false);
        expect(val.wasRejected).toEqual(true);
        expect(val.wasResolved).toEqual(false);
        expect(val.error).toEqual('test');
        expect(val.storeValue).toEqual('a');
        done();
      }
    });
  })

  it('should be able to create and update a nested store', () => {
    const parentStore = createGlobalStore(initialState, { devtools: false });
    const componentName = 'MyComponent';
    const instanceName = '0';
    const store = createNestedStore({ prop: '' }, { componentName, instanceName });
    const payload = 'test';
    store.get(s => s.prop).replace(payload);
    expect(parentStore.read()).toEqual({ ...initialState, ...{ nested: { [componentName]: { '0': { prop: payload } } } } });
  })

  it('should be able to observe state updates of a nested store', done => {
    createGlobalStore(initialState, { devtools: false });
    const componentName = 'MyComponent';
    const instanceName = '0';
    const store = createNestedStore(initialState, { componentName, instanceName });
    const obs$ = store.observe(s => s.object.property);
    const payload = 'test';
    obs$.pipe(skip(1)).subscribe(val => {
      expect(val).toEqual(payload);
      done();
    });
    store.get(s => s.object.property).replace(payload);
  })

  it('should be able to observe root state updates of a nested store', done => {
    createGlobalStore(initialState, { devtools: false });
    const componentName = 'MyComponent';
    const instanceName = '0';
    const store = createNestedStore(initialState, { componentName, instanceName });
    const obs$ = store.observe();
    const payload = 'test';
    obs$.pipe(skip(1)).subscribe(val => {
      expect(val).toEqual({ ...initialState, object: { property: payload } });
      done();
    });
    store.get(s => s.object.property).replace(payload);
  })

  it('should be able to observe a fetch, and resolve for a nested store', done => {
    createGlobalStore(initialState, { devtools: false });
    const componentName = 'MyComponent';
    const instanceName = '0';
    const store = createNestedStore(initialState, { componentName, instanceName });
    let count = 0;
    const obs$ = store.observeFetch(() => store.get(s => s.object.property)
      .replace(() => new Promise(resolve => setTimeout(() => resolve('val ' + count), 10))));
    obs$.subscribe(val => {
      count++;
      if (count === 1) {
        expect(val.isLoading).toEqual(true);
        expect(val.wasRejected).toEqual(false);
        expect(val.wasResolved).toEqual(false);
        expect(val.error).toEqual(null);
      } else if (count === 2) {
        expect(val.isLoading).toEqual(false);
        expect(val.wasRejected).toEqual(false);
        expect(val.wasResolved).toEqual(true);
        expect(val.error).toEqual(null);
        expect(val.storeValue).toEqual('val 1');
        done();
      }
    });
  })

  it('should be able to observe a fetch, and reject for a nested store', done => {
    const store = createGlobalStore(initialState, { devtools: false });
    let count = 0;
    const fetchAndReject = () => new Promise<string>((resolve, reject) => setTimeout(() => reject('test'), 10));
    const obs$ = store.observeFetch(() => store.get(s => s.object.property).replace(fetchAndReject));
    obs$.subscribe(val => {
      count++;
      if (count === 1) {
        expect(val.isLoading).toEqual(true);
        expect(val.wasRejected).toEqual(false);
        expect(val.wasResolved).toEqual(false);
        expect(val.error).toEqual(null);
      } else if (count === 2) {
        expect(val.isLoading).toEqual(false);
        expect(val.wasRejected).toEqual(true);
        expect(val.wasResolved).toEqual(false);
        expect(val.error).toEqual('test');
        expect(val.storeValue).toEqual('a');
        done();
      }
    });
  })

  it('should be able to combineObservers for a single store', done => {
    const store = createGlobalStore(initialState, { devtools: false });
    let count = 0;
    const obs$ = store.observeCombined({
      one: s => s.object.property,
      two: s => s.string,
    });
    obs$.subscribe(val => {
      count++;
      if (count === 1) {
        expect(val.one).toEqual('a');
        expect(val.two).toEqual('b');
      } else if (count === 2) {
        expect(val.one).toEqual('test');
        expect(val.two).toEqual('b');
      } else if (count === 3) {
        expect(val.one).toEqual('test');
        expect(val.two).toEqual('test');
      }
    });
    expect(count).toEqual(1);
    store.get(s => s.object.property).replace('test');
    expect(count).toEqual(2);
    store.get(s => s.string).replace('test');
    expect(count).toEqual(3);
    store.get(s => s.array).replaceAll([{ id: 5, value: 'x' }]);
    expect(count).toEqual(3);
    done();
  })

  it('should be able to combineObservers across stores', done => {
    const globalStore = createGlobalStore(initialState, { devtools: false });
    const nestedStore = createNestedStore({ hello: 'c', world: 'd' }, { componentName: 'test', instanceName: '0' });
    let count = 0;
    const obs$ = combineObserversAcrossStores({
      one: globalStore.observe(s => s.object.property),
      two: globalStore.observe(s => s.string),
      three: nestedStore.observe(s => s.hello),
    });
    obs$.subscribe(val => {
      count++;
      if (count === 1) {
        expect(val.one).toEqual('a');
        expect(val.two).toEqual('b');
        expect(val.three).toEqual('c');
      } else if (count === 2) {
        expect(val.one).toEqual('test');
        expect(val.two).toEqual('b');
        expect(val.three).toEqual('c');
      } else if (count === 3) {
        expect(val.one).toEqual('test');
        expect(val.two).toEqual('test');
        expect(val.three).toEqual('c');
      } else if (count === 4) {
        expect(val.one).toEqual('test');
        expect(val.two).toEqual('test');
        expect(val.three).toEqual('test');
      }
    });
    expect(count).toEqual(1);
    globalStore.get(s => s.object.property).replace('test');
    expect(count).toEqual(2);
    globalStore.get(s => s.string).replace('test');
    expect(count).toEqual(3);
    globalStore.get(s => s.array).replaceAll([{ id: 5, value: 'x' }]);
    expect(count).toEqual(3);
    nestedStore.get(s => s.hello).replace('test');
    expect(count).toEqual(4);
    nestedStore.get(s => s.world).replace('test');
    expect(count).toEqual(4);
    done();
  })

  // // reactive version
  // const paginatedData$ = this.pageIndex$.pipe(
  //   concatMap(pageIndex => observeFetch(select(s => s.data[pageIndex]).replaceAll(() => fetchData(pageIndex, 10)))),
  // );

  // // imperative version
  // select(s => s.data[pageIndex])
  //   .replaceAll(() => fetchData(index, 10))
  //   .subscribe(data => setData(data));

});

// const { get } = createGlobalStore({ one: '', arr: new Array<string>() });
// const obs$ = get(s => s.arr).findWhere().eq('3').observe();
// const obs$ = get(s => s.one).observe();

// observePromise(() => get(s => s.one).replace(() => Promise.resolve('')));

// const obs = get(s => s.one).observe();
// observeFetch(() =>  get(s => s.one).replace()  );
// const todos = get().state;
