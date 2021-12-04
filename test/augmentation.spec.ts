import { Observable } from 'rxjs';

import { augment, createApplicationStore, derive } from '../src';
import { libState } from '../src/constant';

describe('Augmentations', () => {

  beforeEach(() => {
    libState.appStates = {};
    libState.logLevel = 'none';
  })

  it('should be able to augment a selection', () => {
    augment({
      selection: {
        myThing: input => () => input.read(),
      }
    })
    const select = createApplicationStore({ num: 42 });
    const res = (select.num as any).myThing();
    expect(res).toEqual(42);
  })

  it('should be able to augment a selection on an array action', () => {
    augment({
      selection: {
        myThing: input => () => input.read(),
      }
    })
    const select = createApplicationStore({ array: [42] });
    const res = (select.array as any).myThing();
    expect(res).toEqual([42]);
  })

  it('should be able to augment a selection on an array element action', () => {
    augment({
      selection: {
        myThing: input => () => input.read(),
      }
    })
    const select = createApplicationStore({ array: [42] });
    const res = (select.array.find.eq(42) as any).myThing();
    expect(res).toEqual(42);
  })

  it('should be able to augment a future on a core action', done => {
    augment({
      future: {
        myThing: selection => () => selection,
      }
    })
    const select = createApplicationStore({ num: 42 });
    const fetch = () => new Promise(resolve => setTimeout(() => resolve(43), 5))
    const res = (select.num as any).replace(fetch).myThing();
    res.then((r: any) => {
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
    const select = createApplicationStore({ array: [42] });
    const fetch = () => new Promise(resolve => setTimeout(() => resolve([43]), 5))
    const res = (select.array as any).replace(fetch).myThing();
    res.then((r: any) => {
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
    const select = createApplicationStore({ array: [{id: 1, num: 1}] });
    const fetch = () => new Promise<{ id: number, num: number }>(resolve => setTimeout(() => resolve({ id: 1, num: 2 }), 5));
    const res = (select.array.find.id.eq(1).replace(fetch) as any).myThing();
    res.then((r: any) => {
      expect(r).toEqual({ id: 1, num: 2 });
      done();
    });
  })

  it('should be able to augment an async', done => {
    augment({
      async: fnReturningFutureAugmentation => fnReturningFutureAugmentation().toPromise(),
    })
    const select = createApplicationStore({ thing: '' });
    const fetch = () => new Observable(observer => {
      observer.next('test');
      observer.complete();
    });
    const res = select.thing.replace(fetch as any as () => Promise<string>);
    res.then((r: any) => {
      done();
    });
  })

  it('should be able to augment a derivation', done => {
    augment({
      derivation: {
        myThing: input => () => input.read()
      }
    })
    const select = createApplicationStore({ one: 'abc', two: false });
    const result = (derive(
      select.one,
      select.two,
    ).with((one, two) => one + two) as any)
      .myThing();
    expect(result).toEqual('abcfalse');
    done();
  })
  
});
