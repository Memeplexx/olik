import { createAppStore, createAppStoreEnforcingTags, createNestedStore } from '../src/public-api';
import { skip } from 'rxjs/operators';

describe('Angular', () => {

  const initialState = {
    object: { property: 'a' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    string: 'b',
  };

  it('should create and update a store', () => {
    const { select } = createAppStore(initialState, { devtools: false });
    select(s => s.object.property)
      .replace('test');
    expect(select().read().object.property).toEqual('test');
  })

  it('should be able to observe state updates', done => {
    const { select, observe } = createAppStore(initialState, { devtools: false });
    const obs$ = observe(s => s.object.property);
    const payload = 'test';
    obs$.pipe(skip(1)).subscribe(val => {
      expect(val).toEqual(payload);
      done();
    });
    select(s => s.object.property).replace(payload);
  })

  it('should be able to observe a fetch, and resolve', done => {
    const { select, observeFetch } = createAppStore(initialState, { devtools: false });
    let count = 0;
    const obs$ = observeFetch(() => select(s => s.object.property)
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

  it('should be able to observe a fetch, and reject', done => {
    const { select, observeFetch } = createAppStore(initialState, { devtools: false });
    let count = 0;
    const obs$ = observeFetch(() => select(s => s.object.property)
      .replace(() => new Promise((resolve, reject) => setTimeout(() => reject('test'), 10))));
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
    const { select } = createAppStoreEnforcingTags(initialState, { devtools: false });
    select(s => s.object.property)
      .replace('test', { tag: 'Tag' });
    expect(select().read().object.property).toEqual('test');
  })

  it('should be able to observe state updates for a store which enforces tags', done => {
    const { select, observe } = createAppStoreEnforcingTags(initialState, { devtools: false });
    const obs$ = observe(s => s.object.property);
    const payload = 'test';
    obs$.pipe(skip(1)).subscribe(val => {
      expect(val).toEqual(payload);
      done();
    });
    select(s => s.object.property).replace(payload, { tag: 'Tag' });
  })

  it('should be able to observe a fetch, and resolve using a store which enforces tags', done => {
    const { select, observeFetch } = createAppStoreEnforcingTags(initialState, { devtools: false });
    let count = 0;
    const obs$ = observeFetch(() => select(s => s.object.property)
      .replace(() => new Promise(resolve => setTimeout(() => resolve('val ' + count), 10)), { tag: 'Tag' }));
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
    const { select, observeFetch } = createAppStoreEnforcingTags(initialState, { devtools: false });
    let count = 0;
    const obs$ = observeFetch(() => select(s => s.object.property)
      .replace(() => new Promise((resolve, reject) => setTimeout(() => reject('test'), 10)), { tag: 'Tag' }));
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
    const parentStore = createAppStore(initialState, { devtools: false });
    const componentName = 'MyComponent';
    const { select } = createNestedStore({ prop: '' }, { componentName });
    const payload = 'test';
    select(s => s.prop).replace(payload);
    expect(parentStore.select().read()).toEqual({ ...initialState, ...{ nested: { [componentName]: { '0': { prop: payload } } } } });
  })

  it('should be able to observe state updates of a nested store', done => {
    createAppStore(initialState, { devtools: false });
    const componentName = 'MyComponent';
    const { select, observe } = createNestedStore(initialState, { componentName });
    const obs$ = observe(s => s.object.property);
    const payload = 'test';
    obs$.pipe(skip(1)).subscribe(val => {
      expect(val).toEqual(payload);
      done();
    });
    select(s => s.object.property).replace(payload);
  })

  it('should be able to observe root state updates of a nested store', done => {
    createAppStore(initialState, { devtools: false });
    const componentName = 'MyComponent';
    const { select, observe } = createNestedStore(initialState, { componentName });
    const obs$ = observe();
    const payload = 'test';
    obs$.pipe(skip(1)).subscribe(val => {
      expect(val).toEqual({ ...initialState, object: { property: payload } });
      done();
    });
    select(s => s.object.property).replace(payload);
    const t = observe();
  })

  it('should be able to observe a fetch, and resolve for a nested store', done => {
    createAppStore(initialState, { devtools: false });
    const componentName = 'MyComponent';
    const { select, observeFetch } = createNestedStore(initialState, { componentName });
    let count = 0;
    const obs$ = observeFetch(() => select(s => s.object.property)
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
    const { select, observeFetch } = createAppStore(initialState, { devtools: false });
    let count = 0;
    const obs$ = observeFetch(() => select(s => s.object.property)
      .replace(() => new Promise((resolve, reject) => setTimeout(() => reject('test'), 10))));
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

  // // reactive version
  // const paginatedData$ = this.pageIndex$.pipe(
  //   concatMap(pageIndex => observeFetch(select(s => s.data[pageIndex]).replaceAll(() => fetchData(pageIndex, 10)))),
  // );

  // // imperative version
  // select(s => s.data[pageIndex])
  //   .replaceAll(() => fetchData(index, 10))
  //   .subscribe(data => setData(data));

});

