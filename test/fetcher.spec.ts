import { make } from '../src';
import { tests } from '../src/tests';
import { cachedPromise } from '../src/utils';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';


describe('Fetcher', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should perform a basic fetch using replaceAll()', done => {
    const get = make({ arr: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }] });
    const payload = [{ id: 2, value: 'dd' }];
    const fetchArray = () => new Promise<Array<{ id: number, value: string }>>(resolve => setTimeout(() => resolve(payload), 10));
    get(s => s.arr).replaceAll(fetchArray).then(res => {
      expect(res).toEqual(payload);
      expect(get(s => s.arr).read()).toEqual(payload);
      done();
    });
  })

  it('should catch an error thrown in a fetch', done => {
    const get = make({ arr: new Array<string>() });
    const fetchArray = () => new Promise<Array<string>>((resolve, reject) => setTimeout(() => reject('Oops'), 10));
    get(s => s.arr).replaceAll(fetchArray).catch(err => {
      expect(err).toEqual('Oops');
      done();
    })
  })

  it('should be able to cache', done => {
    const get = make({ arr: new Array<string>() });
    let count = 0;
    const fetchArray = () => new Promise<Array<string>>(resolve => {
      count++;
      setTimeout(() => resolve([count.toString()]), 10);
    });
    get(s => s.arr).replaceAll(cachedPromise({ fetchArray }).ttl(1000));
    setTimeout(() => {
      get(s => s.arr).replaceAll(cachedPromise({ fetchArray }).ttl(1000)).then(() => {
        expect(get(s => s.arr).read()).toEqual(['1']);
        done();
      });
    }, 50);
  })

  it('should auto-expire a cache correctly', done => {
    const get = make({ arr: new Array<string>() });
    let count = 0;
    const fetchArray = () => new Promise<Array<string>>(resolve => {
      count++;
      setTimeout(() => {
        resolve([count.toString()]);
      }, 10);
    });
    get(s => s.arr).replaceAll(cachedPromise({ fetchArray }).ttl(5));
    setTimeout(() => {
      get(s => s.arr).replaceAll(cachedPromise({ fetchArray }).ttl(5)).then(() => {
        expect(get(s => s.arr).read()).toEqual(['2']);
        done();
      });
    }, 50);
  })

  it('should invalidate a cache correctly', done => {
    const get = make({ arr: new Array<string>() });
    let count = 0;
    const fetchArray = () => {
      count++;
      return new Promise<Array<string>>(resolve => resolve([count.toString()]));
    };
    get(s => s.arr).replaceAll(cachedPromise({ fetchArray }).ttl(5000));
    setTimeout(() => {
      get(s => s.arr).invalidateCache();
      get(s => s.arr).replaceAll(cachedPromise(({ fetchArray })).ttl(5000));
      setTimeout(() => {
        expect(count).toEqual(2);
        expect(get(s => s.arr).read()).toEqual(['2']);
        done();
      })
    }, 10);
  })

  it('should perform a basic fetch using replace()', done => {
    const get = make({ val: '' });
    const payload = 'test';
    const fetchString = () => new Promise<string>(resolve => setTimeout(() => resolve(payload), 10));
    get(s => s.val).replace(fetchString).then(res => {
      expect(res).toEqual(payload);
      expect(get(s => s.val).read()).toEqual(payload);
      done();
    });
  });

  it('should perform a basic fetch using replace() on a primitive', done => {
    const get = make(0);
    const payload = 1;
    const fetchNumber = () => new Promise<number>(resolve => setTimeout(() => resolve(payload), 10));
    get().replace(fetchNumber).then(res => {
      expect(res).toEqual(payload);
      expect(get().read()).toEqual(payload);
      done();
    })
  })

  it('should perform a basic fetch using replace() on an array', done => {
    const get = make(new Array<string>());
    const payload = ['1'];
    const fetchArray = () => new Promise<string[]>(resolve => setTimeout(() => resolve(payload), 10));
    get().replaceAll(fetchArray).then(res => {
      expect(res).toEqual(payload);
      expect(get().read()).toEqual(payload);
      done();
    })
  })

  it('should perform a basic fetch using replace() on a primitive including caching', async done => {
    const get = make({ num: 0 });
    let count = 0;
    const fetchArray = () => new Promise<number>(resolve => {
      count++;
      setTimeout(() => resolve(1), 10);
    });
    get(s => s.num).replace(cachedPromise(({ fetchArray })).ttl(1000))
    setTimeout(() => {
      expect(get().read()).toEqual({ num: 1, cache: { 'num.replace(fetchArray())': 1 } });
      expect(count).toEqual(1);
      done();
    }, 50);
  })

  it('should perform a basic fetch using addBefore()', done => {
    const initialState = ['one'];
    const get = make(initialState);
    const payload = ['two'];
    const fetchString = () => new Promise<string[]>(resolve => setTimeout(() => resolve(payload), 10));
    get().addBefore(fetchString).then(res => {
      expect(res).toEqual(payload);
      expect(get().read()).toEqual([...payload, ...initialState]);
      done();
    });
  });

  it('should perform a basic fetch using addAfter()', done => {
    const initialState = ['one'];
    const get = make(initialState);
    const payload = ['two'];
    const fetchString = () => new Promise<string[]>(resolve => setTimeout(() => resolve(payload), 10));
    get().addAfter(fetchString).then(res => {
      expect(res).toEqual(payload);
      expect(get().read()).toEqual([...initialState, ...payload]);
      done();
    });
  });

  it('should perform a basic fetch using upsertWhere()', done => {
    const get = make(['one', 'two', 'three']);
    const payload = 'threee';
    const fetchString = () => new Promise<string>(resolve => setTimeout(() => resolve(payload), 10));
    get().upsertWhere(e => e === 'three').with(fetchString).then(res => {
      expect(res).toEqual(payload);
      expect(get().read()).toEqual(['one', 'two', payload]);
      done();
    });
  })

  it('should perform a basic fetch using mergeWhere()', done => {
    const get = make(['one', 'two', 'three']);
    const payload = ['three', 'four'];
    const fetchArray = () => new Promise<string[]>(resolve => resolve(payload));
    get().mergeWhere((a, b) => a === b).with(fetchArray).then(res => {
      expect(res).toEqual(payload);
      expect(get().read()).toEqual(['one', 'two', 'three', 'four']);
      done();
    });
  })

  it('should perform a basic fetch using replaceWhere()', done => {
    const get = make(['one', 'two', 'three']);
    const payload = 'twoo';
    const fetchArray = () => new Promise<string>(resolve => resolve(payload));
    get().replaceWhere(e => e === 'two').with(fetchArray).then(res => {
      expect(res).toEqual(payload);
      expect(get().read()).toEqual(['one', 'twoo', 'three']);
      done();
    });
  })

  it('should perform a basic fetch using patchWhere()', done => {
    const get = make([{ a: 'one', b: 'two', c: 'three' }, { a: 'onee', b: 'twoo', c: 'threee' }]);
    type storeType = Partial<{ a: string, b: string, c: string }>;
    const payload = { b: 'twooo' } as storeType;
    const fetchItem = () => new Promise<storeType>(resolve => resolve(payload));
    get().patchWhere(e => e.a === 'onee').with(fetchItem).then(res => {
      expect(res).toEqual(payload);
      expect(get().read()).toEqual([{ a: 'one', b: 'two', c: 'three' }, { a: 'onee', b: 'twooo', c: 'threee' }]);
      done();
    });
  })

  it('should perform a basic fetch using patch()', done => {
    const get = make({ one: 1, two: 2, three: 3 });
    type storeType = Partial<{ one: number, two: number, three: number }>;
    const payload = { two: 22, three: 33 } as storeType;
    const fetchPartial = () => new Promise<storeType>(resolve => resolve(payload));
    get().patch(fetchPartial).then(res => {
      expect(res).toEqual(payload);
      expect(get().read()).toEqual({ one: 1, two: 22, three: 33 });
      done();
    });
  })

  it('should respond to cache expired events', done => {
    const get = make({ num: 0 });
    const fetchNum = () => new Promise<number>(resolve => resolve(1));
    get(s => s.num).replace(cachedPromise({ fetchNum }).ttl(10));
    get(s => s.num).onCacheExpired(() => {
      done();
    })
  })

  it('should correctly unsubscribe a cache expired listener', done => {
    const get = make({ num: 0 });
    const fetchNum = () => new Promise<number>(resolve => resolve(1));
    get(s => s.num).replace(cachedPromise({ fetchNum }).ttl(10));
    let called = false;
    get(s => s.num).onCacheExpired(() => {
      called = true;
    }).unsubscribe();
    setTimeout(() => {
      expect(called).toEqual(false);
      done();
    }, 20);
  })

  it('should be able to cache including arguments', done => {
    const get = make({ arr: new Array<string>() });
    const data = (new Array(30)).fill(null).map((e, i) => i.toString());
    let callCount = 0;
    const fetchString = (offset: number, count: number) => {
      callCount++;
      return new Promise<string[]>(resolve => setTimeout(() => resolve(data.slice(offset * count, (offset + 1) * count)), 5));
    }
    get(s => s.arr).replaceAll(cachedPromise({ fetchString }).args(0, 10).ttl(1000))
      .then(res => get(s => s.arr).replaceAll(cachedPromise({ fetchString }).args(0, 10).ttl(1000)))
      .then(res => {
        expect(callCount).toEqual(1);
        get().invalidateCache();
        return get(s => s.arr).replaceAll(cachedPromise({ fetchString }).args(1, 10).ttl(1000));
      })
      .then(res => {
        expect(res).toEqual(data.slice(10, 20));
        done();
      });
  })







  // it('should correctly cache using a cache key', done => {
  //   const get = make({ arr: new Array<string>() });
  //   const data = (new Array(30)).fill(null).map((e, i) => i.toString());
  //   const fetchData = (index: number, offset: number) => new Promise<string[]>(resolve => resolve(data.slice(index * offset, (index + 1) * offset)));
  //   get(s => s.arr).addAfter(  cachedPromise(fetchData).args(1, 2).ttl(1000)  )
  // })

  // it('should correctly cache using a cache key', done => {
  //   const get = make({ arr: new Array<string>() });
  //   const data = (new Array(30)).fill(null).map((e, i) => i.toString());
  //   const fetchData = () => new Promise<string[]>(resolve => resolve(data));
  //   get(s => s.arr).addAfter(  cachedPromise(fetchData).ttl(100)  )
  // })

});
