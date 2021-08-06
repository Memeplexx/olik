import { Observable } from 'rxjs';
import { augment } from '../src/augmentations';

import { libState, testState } from '../src/shared-state';
import { createRootStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';
import { deriveFrom } from '../src/derive-from';

describe('augmentations', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  beforeEach(() => libState.componentContainerStore = null);

  afterAll(() => {
    augment({
      selection: {},
      future: {},
    })
  })

  it('should be able to augment a selection on a core action', () => {
    augment({
      selection: {
        myThing: selection => () => selection.read(),
      }
    })
    const select = createRootStore({ num: 42 });
    const res = (select(s => s.num) as any).myThing();
    expect(res).toEqual(42);
  })

  it('should be able to augment a selection on an array action', () => {
    augment({
      selection: {
        myThing: selection => () => selection.read(),
      }
    })
    const select = createRootStore({ array: [42] });
    const res = (select(s => s.array) as any).myThing();
    expect(res).toEqual([42]);
  })

  it('should be able to augment a selection on an array element action', () => {
    augment({
      selection: {
        myThing: selection => () => selection.read(),
      }
    })
    const select = createRootStore({ array: [42] });
    const res = (select(s => s.array).findWhere().eq(42) as any).myThing();
    expect(res).toEqual(42);
  })

  it('should be able to augment a future on a core action', done => {
    augment({
      future: {
        myThing: selection => () => selection.asPromise(),
      }
    })
    const select = createRootStore({ num: 42 });
    const fetch = () => new Promise(resolve => setTimeout(() => resolve(43), 5))
    const res = (select(s => s.num) as any).replace(fetch).myThing();
    res.then((r: any) => {
      expect(r).toEqual(43);
      done();
    });
  })

  it('should be able to augment a future on an array action', done => {
    augment({
      future: {
        myThing: selection => () => selection.asPromise(),
      }
    })
    const select = createRootStore({ array: [42] });
    const fetch = () => new Promise(resolve => setTimeout(() => resolve([43]), 5))
    const res = (select(s => s.array) as any).replace(fetch).myThing();
    res.then((r: any) => {
      expect(r).toEqual([43]);
      done();
    });
  })

  it('should be able to augment a future on an array element action', done => {
    augment({
      future: {
        myThing: selection => () => selection.asPromise(),
      }
    })
    const select = createRootStore({ array: [42] });
    const fetch = () => new Promise(resolve => setTimeout(() => resolve(43), 5))
    const res = (select(s => s.array) as any).findWhere().eq(42).replace(fetch).myThing();
    res.then((r: any) => {
      expect(r).toEqual(undefined);
      done();
    });
  })

  it('should be able to augment an async', done => {
    augment({
      async: fnReturningFutureAugmentation => fnReturningFutureAugmentation().toPromise(),
    })
    const select = createRootStore({ thing: '' });
    const fetch = () => new Observable(observer => {
      observer.next('test');
      observer.complete();
    });
    const res = select(s => s.thing).replace(fetch as any as () => Promise<string>);
    res.asPromise().then((r: any) => {
      done();
    });
  })

  it('should be able to augment a derivation', done => {
    augment({
      derivation: {
        myThing: derviation => () => derviation.read()
      }
    })
    const select = createRootStore({ one: 'abc', two: false });
    const result = (deriveFrom(
      select(s => s.one),
      select(s => s.two),
    ).usingExpensiveCalc((one, two) => one + two) as any)
      .myThing();
    expect(result).toEqual('abcfalse');
    done();
  })

});


