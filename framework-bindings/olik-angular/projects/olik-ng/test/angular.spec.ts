import { from, of } from 'rxjs';
import { catchError, skip } from 'rxjs/operators';

import {
  combineComponentObservables,
  createRootStore,
  createComponentStore,
  deriveFrom,
  OlikNgModule,
} from '../src/public-api';

describe('Angular', () => {

  const initialState = {
    object: { property: 'a' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    string: 'b',
  };

  beforeAll(() => {
    new OlikNgModule(null as any);
  })

  it('should create and update a store', () => {
    const select = createRootStore(initialState, { devtools: false });
    select(s => s.object.property)
      .replace('test');
    expect(select().read().object.property).toEqual('test');
  })

  it('should be able to observe state updates', done => {
    const select = createRootStore(initialState, { devtools: false });
    const obs$ = select(s => s.object.property).observe();
    const payload = 'test';
    obs$.pipe(skip(1)).subscribe(val => {
      expect(val).toEqual(payload);
      done();
    });
    select(s => s.object.property).replace(payload);
  })

  it('should be able to observe the status of a resolved fetch', done => {
    const select = createRootStore(initialState, { devtools: false });
    let count = 0;
    const fetchProperty = () => from(new Promise<string>(resolve => setTimeout(() => resolve('val ' + count), 10)));
    select(s => s.object.property)
      .replace(fetchProperty)
      .observeStatus()
      .subscribe(val => {
        count++;
        if (count === 2) {
          expect(val.isLoading).toEqual(true);
          expect(val.wasRejected).toEqual(false);
          expect(val.wasResolved).toEqual(false);
          expect(val.error).toEqual(null);
        } else if (count === 3) {
          expect(val.isLoading).toEqual(false);
          expect(val.wasRejected).toEqual(false);
          expect(val.wasResolved).toEqual(true);
          expect(val.error).toEqual(null);
          expect(val.storeValue).toEqual('val 2');
          done();
        }
      });
  })

  it('should be able to observe the status of a rejected fetch', done => {
    const select = createRootStore(initialState, { devtools: false });
    let count = 0;
    const fetchAndReject = () => new Promise<string>((resolve, reject) => setTimeout(() => reject('test'), 10));
    select(s => s.object.property)
      .replace(fetchAndReject)
      .observeStatus()
      .subscribe(val => {
        count++;
        if (count === 2) {
          expect(val.isLoading).toEqual(true);
          expect(val.wasRejected).toEqual(false);
          expect(val.wasResolved).toEqual(false);
          expect(val.error).toEqual(null);
        } else if (count === 3) {
          expect(val.isLoading).toEqual(false);
          expect(val.wasRejected).toEqual(true);
          expect(val.wasResolved).toEqual(false);
          expect(val.error).toEqual('test');
          expect(val.storeValue).toEqual('a');
          done();
        }
      });
  })

  it('should be able to observe a resolved fetch', done => {
    const select = createRootStore(initialState, { devtools: false });
    const payload = 'val';
    const fetchProperty = () => from(new Promise<string>(resolve => setTimeout(() => resolve(payload), 10)));
    select(s => s.object.property)
      .replace(fetchProperty)
      .asObservable()
      .subscribe(val => {
        expect(val).toEqual(payload)
        done();
      })
  })

  it('should be able to observe a rejected fetch', done => {
    const select = createRootStore(initialState, { devtools: false });
    const payload = 'val';
    const fetchProperty = () => from(new Promise<string>((resolve, reject) => setTimeout(() => reject(payload), 10)));
    select(s => s.object.property)
      .replace(fetchProperty)
      .asObservable().pipe(
        catchError(e => of('error: ' + e))
      )
      .subscribe(val => {
        expect(val).toEqual('error: ' + payload)
        done();
      })
  })

  it('should observe a derivation', done => {
    const select = createRootStore(initialState, { devtools: false });
    deriveFrom(
      select(s => s.object.property),
      select(s => s.string)
    ).usingExpensiveCalc((a, b) => a + b)
      .observe()
      .subscribe(val => {
        expect(val).toEqual('ab');
        done();
      });
  })

  it('should observe a nested store update', done => {
    const select = createRootStore(initialState, { devtools: false });
    const nested = createComponentStore({ hello: 'abc' }, { componentName: 'component', instanceName: 'instance' });
    nested(s => s.hello)
      .observe()
      .subscribe(e => {
        done();
      });
  })

  it('should combineObservers', done => {
    const select = createRootStore(initialState, { devtools: false });
    let count = 0;
    class MyClass {
      obs1$ = select(s => s.object.property).observe();
      obs2$ = select(s => s.string).observe();
      observables$ = combineComponentObservables<MyClass>(this);
      constructor() {
        this.observables$ .subscribe(e => {
          count++;
          if (count === 1) {
            const expectation = { obs1$: 'a', obs2$: 'b' };
            expect(e).toEqual(expectation);
            expect(this.observables$.value).toEqual(expectation);
          } else if (count === 2) {
            const expectation = { obs1$: 'b', obs2$: 'b' };
            expect(e).toEqual(expectation);
            expect(this.observables$.value).toEqual(expectation);
            done();
          }
        });
        select(s => s.object.property).replace('b');
      }
    };
    new MyClass();
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
