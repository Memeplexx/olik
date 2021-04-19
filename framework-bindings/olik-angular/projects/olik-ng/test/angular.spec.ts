import { from } from "rxjs";
import { take, tap } from "rxjs/operators";
import { set, setNested } from "../src/public-api";

describe('Angular', () => {

  const initialState = {
    object: { property: 'a' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    string: 'b',
  };

  it('should create and update a store', () => {
    const { select, observe } = set(initialState, { devtools: false });
    select(s => s.object.property)
      .replace('test');
    expect(select().read().object.property).toEqual('test');
  })

  it('should be able to observe state updates', done => {
    const { select, observe } = set(initialState, { devtools: false });
    const obs$ = observe(s => s.object.property);
    const payload = 'test';
    obs$.subscribe(val => {
      expect(val).toEqual(payload);
      done();
    });
    select(s => s.object.property).replace(payload);
  })

  // it('should be able to observe fetches which resolve', done => {
  //   const { observeFetch } = set(initialState, { devtools: false });
  //   const payload = 'test';
  //   const obs$ = observeFetch(() => from(new Promise(resolve => {
  //     setTimeout(() => resolve(payload), 10);
  //   })));
  //   let count = 0;
  //   obs$.subscribe(val => {
  //     if (count === 0) {
  //       expect(val.isLoading).toEqual(true);
  //       expect(val.hasError).toEqual(false);
  //       expect(val.resolved).toEqual(null);
  //       expect(val.rejected).toEqual(null);
  //     } else if (count === 1) {
  //       expect(val.isLoading).toEqual(false);
  //       expect(val.hasError).toEqual(false);
  //       expect(val.resolved).toEqual(payload);
  //       expect(val.rejected).toEqual(null);
  //       done();
  //     }
  //     count++;
  //   });
  // });

  // it('should be able to observe fetches which reject', done => {
  //   const { observeFetch } = set(initialState, { devtools: false });
  //   const payload = 'test';
  //   const obs$ = observeFetch(() => from(new Promise((resolve, reject) => {
  //     setTimeout(() => reject(payload), 10);
  //   })));
  //   let count = 0;
  //   obs$.subscribe(val => {
  //     if (count === 0) {
  //       expect(val.isLoading).toEqual(true);
  //       expect(val.hasError).toEqual(false);
  //       expect(val.resolved).toEqual(null);
  //       expect(val.rejected).toEqual(null);
  //     } else if (count === 1) {
  //       expect(val.isLoading).toEqual(false);
  //       expect(val.hasError).toEqual(true);
  //       expect(val.resolved).toEqual(null);
  //       expect(val.rejected).toEqual(payload);
  //       done();
  //     }
  //     count++;
  //   });
  // });

  // it('should be able to observe fetches and refetch', done => {
  //   const { observeFetch } = set(initialState, { devtools: false });
  //   const payload = 'test';
  //   const payloadRefetch = 'test refetch';
  //   const obs$ = observeFetch(() => from(new Promise(resolve => {
  //     setTimeout(() => resolve(payload), 10);
  //   })));
  //   let count = 0;
  //   obs$.subscribe(val => {
  //     if (count === 0) {
  //       expect(val.isLoading).toEqual(true);
  //       expect(val.hasError).toEqual(false);
  //       expect(val.resolved).toEqual(null);
  //       expect(val.rejected).toEqual(null);
  //     } else if (count === 1) {
  //       expect(val.isLoading).toEqual(false);
  //       expect(val.hasError).toEqual(false);
  //       expect(val.resolved).toEqual(payload);
  //       expect(val.rejected).toEqual(null);
  //       done();
  //     } else if (count === 2) {
  //       expect(val.isLoading).toEqual(true);
  //       expect(val.hasError).toEqual(false);
  //       expect(val.resolved).toEqual(payload);
  //       expect(val.rejected).toEqual(null);
  //       done();
  //     } else if (count === 3) {
  //       expect(val.isLoading).toEqual(false);
  //       expect(val.hasError).toEqual(false);
  //       expect(val.resolved).toEqual(payloadRefetch);
  //       expect(val.rejected).toEqual(null);
  //       done();
  //     }
  //     count++;
  //   });
  //   obs$.pipe(
  //     take(1),
  //     tap(o => o.refetch(() => from(new Promise(resolve => {
  //       setTimeout(() => resolve(payloadRefetch), 10);
  //     })))),
  //   ).subscribe();
  // });

  it('should be able to create and update a nested store', () => {
    const parentStore = set(initialState, { devtools: false, isContainerForNestedStores: true });
    const componentName = 'MyComponent';
    const { select } = setNested({ prop: '' }, { storeName: componentName });
    const payload = 'test';
    select(s => s.prop).replace(payload);
    expect(parentStore.select().read()).toEqual({ ...initialState, ...{ nested: { [componentName]: { '0': { prop: payload } } } } });
  })

  it('should be able to observe a fetch, resolve, and refetch', done => {
    const { select, observe, observeFetch } = set(initialState, { devtools: false });
    let count = 0;
    const obs$ = observeFetch(() => from(select(s => s.object.property)
    .replace(() => new Promise(resolve => setTimeout(() => resolve('val ' + count), 10)))));
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
        // expect(val.storeValue).toEqual('val 1');
        doRefetch();
      } else if (count === 3) {
        expect(val.isLoading).toEqual(true);
        expect(val.wasRejected).toEqual(false);
        expect(val.wasResolved).toEqual(false);
        expect(val.error).toEqual(null);
      } else if (count === 4) {
        expect(val.isLoading).toEqual(false);
        expect(val.wasRejected).toEqual(false);
        expect(val.wasResolved).toEqual(true);
        expect(val.error).toEqual(null);
        done();
      }
    });
    const doRefetch = () => {
      obs$.pipe(
        take(1),
        tap(o => {
          o.fetch();
        })
      ).subscribe();
    }
  })

  // it('should be able to observe a fetch, reject, and refetch', done => {
  //   const { select, observe, observeFetch } = set(initialState, { devtools: false });
  //   const obs$ = observeFetch(() => from(select(s => s.object.property)
  //     .replace(() => new Promise((resolve, reject) => setTimeout(() => reject(''), 10)))));
  //   let count = 0;
  //   obs$.subscribe(val => {
  //     count++;
  //     if (count === 1) {
  //       expect(val.isLoading).toEqual(true);
  //       expect(val.wasRejected).toEqual(false);
  //       expect(val.wasResolved).toEqual(false);
  //       expect(val.error).toEqual(null);
  //     } else if (count === 2) {
  //       expect(val.isLoading).toEqual(false);
  //       expect(val.wasRejected).toEqual(false);
  //       expect(val.wasResolved).toEqual(true);
  //       expect(val.error).toEqual(null);
  //       doRefetch();
  //     } else if (count === 3) {
  //       expect(val.isLoading).toEqual(true);
  //       expect(val.wasRejected).toEqual(false);
  //       expect(val.wasResolved).toEqual(false);
  //       expect(val.error).toEqual(null);
  //     } else if (count === 4) {
  //       expect(val.isLoading).toEqual(false);
  //       expect(val.wasRejected).toEqual(false);
  //       expect(val.wasResolved).toEqual(true);
  //       expect(val.error).toEqual(null);
  //       done();
  //     }
  //   });
  //   const doRefetch = () => {
  //     obs$.pipe(
  //       take(1),
  //       tap(o => {
  //         o.fetch();
  //       })
  //     ).subscribe();
  //   }
  // })

});
