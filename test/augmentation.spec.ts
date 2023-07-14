import { Observable } from 'rxjs';

import { augment } from '../src/augment';
import { createStore } from '../src/core';
import { derive } from '../src/derive';
import { importOlikAsyncModule } from '../src/write-async';
import { resetLibraryState } from '../src/utility';

describe('augmentation', () => {

  beforeEach(() => {
    resetLibraryState();
  })

  it('should be able to augment a selection', () => {
    augment({
      selection: {
        myThing: input => () => input.$state,
      }
    })
    const state = { num: 42 };
    const store = createStore({ state });
    const res = (store.num as unknown as { myThing: () => unknown }).myThing();
    expect(res).toEqual(42);
  })

  it('should be able to augment a selection on an array action', () => {
    augment({
      selection: {
        myThing: input => () => input.$state,
      }
    })
    const state = { array: [42] };
    const store = createStore({ state });
    const res = (store.array as unknown as { myThing: () => unknown }).myThing();
    expect(res).toEqual([42]);
  })

  it('should be able to augment a selection on an array element action', () => {
    augment({
      selection: {
        myThing: input => () => input.$state,
      }
    })
    const state = { array: [42] };
    const store = createStore({ state });
    const res = (store.array.$find.$eq(42) as unknown as { myThing: () => unknown }).myThing();
    expect(res).toEqual(42);
  })

  it('should be able to augment a future on a core action', done => {
    augment({
      future: {
        myThing: selection => () => selection,
      }
    })
    const state = { num: 42 };
    const store = createStore({ state });
    importOlikAsyncModule();
    const fetch = () => new Promise<number>(resolve => setTimeout(() => resolve(43), 5))
    const res = (store.num.$set(fetch) as unknown as { myThing: () => Promise<unknown> }).myThing();
    res.then(r => {
      expect(r).toEqual(43);
      done();
    });
  })

  it('should be able to augment a future on an array action', done => {
    augment({
      future: {
        myThing: selection => () => selection,
      }
    })
    const state = { array: [42] };
    const store = createStore({ state });
    importOlikAsyncModule();
    const fetch = () => new Promise<number[]>(resolve => setTimeout(() => resolve([43]), 5))
    const res = (store.array.$set(fetch) as unknown as { myThing: () => Promise<unknown> }).myThing();
    res.then(r => {
      expect(r).toEqual([43]);
      done();
    });
  })

  it('should be able to augment a future on an array element action', done => {
    augment({
      future: {
        myThing: selection => () => selection,
      }
    })
    const state = { array: [{id: 1, num: 1}] };
    const store = createStore({ state });
    importOlikAsyncModule();
    const fetch = () => new Promise<{ id: number, num: number }>(resolve => setTimeout(() => resolve({ id: 1, num: 2 }), 5));
    const res = (store.array.$find.id.$eq(1).$set(fetch) as unknown as { myThing: () => Promise<unknown> }).myThing();
    res.then(r => {
      expect(r).toEqual({ id: 1, num: 2 });
      done();
    });
  })

  it('should be able to augment an async', done => {
    augment({
      async: fnReturningFutureAugmentation => (fnReturningFutureAugmentation() as unknown as {toPromise: () => ReturnType<typeof fnReturningFutureAugmentation>} ).toPromise(),
    })
    const state = { thing: '' };
    const store = createStore({ state });
    importOlikAsyncModule();
    const fetch = () => new Observable<string>(observer => {
      observer.next('test');
      observer.complete();
    });
    const res = store.thing.$set(fetch as unknown as () => Promise<string>);
    res.then(() => {
      done();
    });
  })

  it('should be able to augment a derivation', done => {
    augment({
      derivation: {
        myThing: input => () => input.$state
      }
    })
    const state = { one: 'abc', two: false };
    const store = createStore({ state });
    const result = (derive(
      store.one,
      store.two,
    ).$with((one, two) => one + two) as unknown as { myThing: () => unknown })
      .myThing();
    expect(result).toEqual('abcfalse');
    done();
  })
  
});
