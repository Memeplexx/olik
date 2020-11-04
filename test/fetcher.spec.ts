import { make, makeEnforceTags } from '../src';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';


describe('Fetcher', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should perform a basic fetch', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = make('store', initialState);
    const fetchArray = store(s => s.array).createFetcher({
      getData: () => new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => resolve([{ id: 2, value: 'dd' }]), 10))
    });
    const fetchArrayState = fetchArray();
    expect(fetchArrayState.status).toEqual('resolving');
    fetchArrayState.onChange(() => {
      expect(store(s => s.array).read()).toEqual([{ id: 2, value: 'dd' }]);
      done();
    })
  })

  it('should cache fetches correctly', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = make('store', initialState);

    let numberOfTimesPromiseIsCalled = 0;
    const fetchArray = store(s => s.array).createFetcher({
      getData: () => new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => { numberOfTimesPromiseIsCalled++; resolve([{ id: 2, value: 'dd' }]); }, 10)),
      cacheFor: 30
    })
    fetchArray();
    setTimeout(() => {
      fetchArray();
      expect(store(s => s.array).read()).toEqual([{ id: 2, value: 'dd' }]);
      expect(numberOfTimesPromiseIsCalled).toEqual(1);
      done();
    }, 20);
  })

  it('should expire cache fetches correctly', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = make('store', initialState);
    let numberOfTimesPromiseIsCalled = 0;
    const fetchArray = store(s => s.array).createFetcher({
      getData: () => new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => { numberOfTimesPromiseIsCalled++; resolve([{ id: 2, value: 'dd' }]); }, 10)),
      cacheFor: 10
    })
    fetchArray();
    setTimeout(() => {
      const fetchArrayState = fetchArray();
      fetchArrayState.onChange(() => {
        expect(store(s => s.array).read()).toEqual([{ id: 2, value: 'dd' }]);
        expect(numberOfTimesPromiseIsCalled).toEqual(2);
        done();
      });
    }, 30);
  })

  it('should invalidate cache fetches correctly', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = make('store', initialState);
    let numberOfTimesPromiseIsCalled = 0;
    const fetchArray = store(s => s.array).createFetcher({
      getData: () => new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => { numberOfTimesPromiseIsCalled++; resolve([{ id: 2, value: 'dd' }]); }, 10)),
      cacheFor: 20
    })
    const fetchArrayState = fetchArray();
    setTimeout(() => {
      fetchArrayState.invalidateCache();
      fetchArray();
      fetchArrayState.onChange(() => {
        expect(store(s => s.array).read()).toEqual([{ id: 2, value: 'dd' }]);
        expect(numberOfTimesPromiseIsCalled).toEqual(2);
        done();
      });
    }, 10);
  });

  it('should listen to status changes', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = make('store', initialState);
    const fetchArray = store(s => s.array).createFetcher({
      getData: () => new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => resolve([{ id: 2, value: 'dd' }]), 10)),
    })
    const fetchArrayState = fetchArray();
    expect(fetchArrayState.status).toEqual('resolving');
    fetchArrayState.onChange(() => {
      expect(fetchArrayState.status).toEqual('resolved');
      done();
    })
  })

  it('should handle errors correctly', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = make('store', initialState);
    const fetchArray = store(s => s.array).createFetcher({
      getData: () => new Promise<[{ id: number, value: string }]>((_, reject) => setTimeout(() => reject('Woops'), 10)),
      cacheFor: 20
    })
    const fetchArrayState = fetchArray();
    fetchArrayState.onChange(() => {
      expect(fetchArrayState.status).toEqual('rejected');
      done();
    })
  })

  it('should work with tags correctly', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = makeEnforceTags('store', initialState);
    const fetchArray = store(s => s.array).createFetcher({
      getData: () => new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => resolve([{ id: 2, value: 'dd' }]), 10)),
      cacheFor: 100,
    })
    const tag = 'mytag';
    const fetchArrayState = fetchArray(tag);
    fetchArrayState.onChange(() => {
      expect(store(s => s.array).read()).toEqual([{ id: 2, value: 'dd' }]);
      expect(tests.currentAction.type).toEqual(`array.replaceAll() [${tag}]`)
      done();
    })
  })

  it('should work with params', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = make('store', initialState);
    const fetchArray = store(s => s.array).createFetcher({
      getData: (num: number) => new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => resolve([{ id: num, value: 'dd' }]), 10)),
    })
    const fetchArrayState = fetchArray(2);
    fetchArrayState.onChange(() => {
      expect(store(s => s.array).read()).toEqual([{ id: 2, value: 'dd' }]);
      done();
    })
  })

  // it('should cache fetches correctly with params', done => {
  //   const initialState = {
  //     array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  //   };
  //   const store = make('store', initialState);
  //   let numberOfTimesPromiseIsCalled = 0;
  //   const fetchArray = store(s => s.array).createFetcher({
  //     getData: (num: number) => new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => { numberOfTimesPromiseIsCalled++; resolve([{ id: num, value: 'dd' }]); }, 10)),
  //     cacheFor: 10
  //   })
  //   fetchArray(2);
  //   setTimeout(() => {
  //     expect(store(s => s.array).read()).toEqual([{ id: 2, value: 'dd' }]);
  //     expect(numberOfTimesPromiseIsCalled).toEqual(1);
  //     done();
  //   }, 5);
  // })

});


// const initialState = {
//   todos: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
// };
// const store = makeEnforceTags('store', initialState);
// const fetchTodos = store(s => s.todos).createFetcher({
//   getData: (num: number) => new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => resolve([{ id: num, value: 'dd' }]), 10)),
//   cacheFor: 1000,
// })


// export function useFetcher<S, C, P, B extends boolean>(
//   getFetch: Fetcher<S, C, P, B>,
//   deps?: ReadonlyArray<any>,
// ) {
  
// }

// const page = 0;

// const { storeData, responseData, responseError, isLoading } = useFetcher(() => fetchTodos(page, __filename), [page]);
