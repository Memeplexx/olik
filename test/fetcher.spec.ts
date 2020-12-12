import { make, makeEnforceTags } from '../src';
import { createFetcher } from '../src/fetcher';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';


describe('Fetcher', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should perform a basic fetch', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const select = make(initialState);
    const fetchArray = createFetcher({
      onStore: select(s => s.array),
      getData: () => new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => resolve([{ id: 2, value: 'dd' }]), 10))
    });
    const fetchArrayState = fetchArray();
    expect(fetchArrayState.status).toEqual('resolving');
    fetchArrayState.onChangeOnce(() => {
      expect(select(s => s.array).read()).toEqual([{ id: 2, value: 'dd' }]);
      done();
    })
  })

  it('should cache fetches correctly', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const select = make(initialState);
    let numberOfTimesPromiseIsCalled = 0;
    const fetchArray = createFetcher({
      onStore: select(s => s.array),
      getData: () => new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => { numberOfTimesPromiseIsCalled++; resolve([{ id: 2, value: 'dd' }]); }, 10)),
      cacheFor: 30,
    })
    fetchArray().onChangeOnce(arg => {
      fetchArray();
      expect(select(s => s.array).read()).toEqual([{ id: 2, value: 'dd' }]);
      expect(numberOfTimesPromiseIsCalled).toEqual(1);
      done();
    })
  })

  it('should expire cache fetches correctly', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const select = make(initialState);
    let numberOfTimesPromiseIsCalled = 0;
    const fetchArray = createFetcher({
      onStore: select(s => s.array),
      getData: () => { return new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => { numberOfTimesPromiseIsCalled++; resolve([{ id: 2, value: 'dd' }]); }, 10)) },
      cacheFor: 10
    });
    fetchArray().onCacheExpiredOnce(arg => {
      fetchArray().onChangeOnce(() => {
        expect(select(s => s.array).read()).toEqual([{ id: 2, value: 'dd' }]);
        expect(numberOfTimesPromiseIsCalled).toEqual(2);
        done();
      });
    })
  })

  it('should invalidate cache fetches correctly', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const select = make(initialState);
    let numberOfTimesPromiseIsCalled = 0;
    const fetchArray = createFetcher({
      onStore: select(s => s.array),
      getData: () => new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => { numberOfTimesPromiseIsCalled++; resolve([{ id: 2, value: 'dd' }]); }, 10)),
      cacheFor: 50,
    })
    fetchArray().onChangeOnce(arg => {
      arg.invalidateCache();
      fetchArray().onChangeOnce(arg2 => {
        expect(select(s => s.array).read()).toEqual([{ id: 2, value: 'dd' }]);
        expect(numberOfTimesPromiseIsCalled).toEqual(2);
        done();
      });
    });
  });

  it('should listen to status changes', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const select = make(initialState);
    const fetchArray = createFetcher({
      onStore: select(s => s.array),
      getData: () => new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => resolve([{ id: 2, value: 'dd' }]), 10)),
    })
    const fetchArrayState = fetchArray();
    expect(fetchArrayState.status).toEqual('resolving');
    fetchArrayState.onChangeOnce(() => {
      expect(fetchArrayState.status).toEqual('resolved');
      done();
    });
  })

  it('should handle errors correctly', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const select = make(initialState);
    const fetchArray = createFetcher({
      onStore: select(s => s.array),
      getData: () => new Promise<[{ id: number, value: string }]>((_, reject) => setTimeout(() => reject('Woops'), 10)),
      cacheFor: 20
    });
    const fetchArrayState = fetchArray();
    fetchArrayState.onChangeOnce(() => {
      expect(fetchArrayState.status).toEqual('rejected');
      done();
    });
  })

  it('should work with tags correctly', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const select = makeEnforceTags(initialState);
    const fetchArray = createFetcher({
      onStore: select(s => s.array),
      getData: () => new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => resolve([{ id: 2, value: 'dd' }]), 10)),
      cacheFor: 100,
    });
    const tag = 'mytag';
    const fetchArrayState = fetchArray(tag);
    fetchArrayState.onChangeOnce(() => {
      expect(select(s => s.array).read()).toEqual([{ id: 2, value: 'dd' }]);
      expect(tests.currentAction.type).toEqual(`array.replaceAll() [${tag}]`)
      done();
    });
  })

  it('should work with params', done => {
    const select = make({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    const fetchArray = createFetcher({
      onStore: select(s => s.array),
      getData: (num: number) => new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => resolve([{ id: num, value: 'dd' }]), 10)),
    });
    const fetchArrayState = fetchArray(2);
    fetchArrayState.onChangeOnce(() => {
      expect(select(s => s.array).read()).toEqual([{ id: 2, value: 'dd' }]);
      done();
    });
  })

  it('should cache fetches correctly with params', done => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const select = make(initialState);
    let numberOfTimesPromiseIsCalled = 0;
    const fetchArray = createFetcher({
      onStore: select(s => s.array),
      getData: (num: number) => new Promise<[{ id: number, value: string }]>(resolve => setTimeout(() => { numberOfTimesPromiseIsCalled++; resolve([{ id: num, value: 'dd' }]); }, 10)),
      cacheFor: 10
    });
    fetchArray(2).onChangeOnce(arg => {
      expect(arg.data).toEqual([{ id: 2, value: 'dd' }]);
      expect(select(s => s.array).read()).toEqual([{ id: 2, value: 'dd' }]);
      expect(numberOfTimesPromiseIsCalled).toEqual(1);
      done();
    });
  })

  it('should be able to refetch', done => {
    const initialState = {
      object: { property: 'hello', property2: 'two' },
    };
    const select = make(initialState);
    select(s => s.object.property).replaceWith('test');
    const fetchProp = createFetcher({
      onStore: select(s => s.object.property),
      getData: (arg: string) => new Promise<string>(resolve => setTimeout(() => resolve(arg), 10)),
      cacheFor: 1000,
    });
    fetchProp('test').onChangeOnce(fetchArg => {
      expect(fetchArg.data).toEqual('test');
      expect(select(s => s.object.property).read()).toEqual('test');
      fetchArg.refetch('another').onChangeOnce(() => {
        expect(select(s => s.object.property).read()).toEqual('another');
        done();
      });
    });
  })

  it('should setData correctly', done => {
    const initialState = {
      array: ['one', 'two'],
    };
    const select = make(initialState);
    const fetchArray = createFetcher({
      onStore: select(s => s.array),
      getData: () => new Promise<string[]>(resolve => setTimeout(() => resolve(['three', 'four']), 10)),
      setData: arg => arg.store.addAfter([...arg.data]),
    });
    fetchArray().onChangeOnce(() => {
      expect(select(s => s.array).read()).toEqual(['one', 'two', 'three', 'four']);
      done();
    })
  })

  it('should respond to change listeners', done => {
    const select = make({
      array: ['one', 'two'],
    });
    const fetchArray = createFetcher({
      onStore: select(s => s.array),
      getData: () => new Promise<string[]>(resolve => setTimeout(() => resolve(['three', 'four']), 10)),
    });
    const fetch = fetchArray();
    fetch.onChangeOnce(() => {
      fetch.refetch().onChangeOnce(() => {
        done();
      });
    });
  });

  it('should unsubcribe from change listeners', done => {
    const select = make({
      array: ['one', 'two'],
    });
    const fetchArray = createFetcher({
      onStore: select(s => s.array),
      getData: () => new Promise<string[]>(resolve => setTimeout(() => resolve(['three', 'four']), 10)),
    });
    let changeCount = 0;
    const fetch = fetchArray();
    const subscription = fetch.onChange(() => {
      changeCount++;
      subscription.unsubscribe();
    });
    fetch.refetch().onChangeOnce(() => {
      expect(changeCount).toEqual(1);
      done();
    });
  });

  it('should unsubcribe from cache expired listeners', done => {
    const select = make({
      array: ['one', 'two'],
    });
    let cacheExpiredCount = 0;
    const fetchArray = createFetcher({
      onStore: select(s => s.array),
      getData: () => new Promise<string[]>(resolve => setTimeout(() => resolve(['three', 'four']), 10)),
      cacheFor: 10
    });
    const fetch = fetchArray();
    const subscription = fetch.onCacheExpired(() => {
      cacheExpiredCount++;
      subscription.unsubscribe();
      fetch.refetch().onChangeOnce(() => {
        expect(cacheExpiredCount).toEqual(1);
        done();
      });
    });
  });

  it('should be able to modify a collection after it has been fetched', done => {
    const select = make({ array: ['one', 'two'] });
    const fetchArray = createFetcher({
      onStore: select(s => s.array),
      getData: () => new Promise<string[]>(resolve => setTimeout(() => resolve(['three', 'four']), 10)),
    });
    fetchArray().onChangeOnce(arg => {
      select(s => s.array).addAfter(['five', 'six']);
      expect(select(s => s.array).read()).toEqual(['three', 'four', 'five', 'six']);
      done();
    });
  })

  it('should be able to unsubscribe from an already unsubscribed change listener', done => {
    const select = make({ one: '' });
    const fetchThings = createFetcher({
      onStore: select(s => s.one),
      getData: () => new Promise<string>(resolve => setTimeout(() => resolve('test'), 10)),
    });
    const sub = fetchThings().onChangeOnce(arg => {
      sub.unsubscribe();
      done();
    })
  })

  it('should be able to de-duplicate simultaneous requests', () => {
    const select = make({ value: '' });
    let count = 0;
    const fetchValue = createFetcher({
      onStore: select(s => s.value),
      getData: () => {
        count++;
        return new Promise<string>(resolve => {
          setTimeout(() => resolve('val'), 10);
        })
      }
    });
    fetchValue();
    fetchValue();
    expect(count).toEqual(1);
  })

  it('should be able to handle promises resolving correctly', done => {
    const select = make({ value: '' });
    const fetchValue = createFetcher({
      onStore: select(s => s.value),
      getData: () => {
        return new Promise<string>(resolve => {
          setTimeout(() => resolve('val'), 10);
        })
      }
    });
    fetchValue().toPromise().then(data => {
      expect(data).toEqual('val');
      done();
    });
  })

  it('should be able to handle promises rejecting correctly', done => {
    const select = make({ value: '' });
    const fetchValue = createFetcher({
      onStore: select(s => s.value),
      getData: () => {
        return new Promise<string>((resolve, reject) => {
          setTimeout(() => reject('val'), 10);
        })
      }
    });
    fetchValue().toPromise().catch(error => {
      expect(error).toEqual('val');
      done();
    });
  })

});
