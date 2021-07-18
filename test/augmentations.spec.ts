import { Observable } from 'rxjs';

import { augmentations } from '../src/augmentations';
import { libState, testState } from '../src/shared-state';
import { createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('augmentations', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  beforeEach(() => libState.nestedContainerStore = null);

  afterAll(() => {
    augmentations.selection = {};
    augmentations.future = {};
  })

  it('should be able to augment a selection on a core action', () => {
    augmentations.selection.myThing = (selection) => () => {
      return selection.read();
    }
    const select = createGlobalStore({ num: 42 });
    const res = (select(s => s.num) as any).myThing();
    expect(res).toEqual(42);
  })

  it('should be able to augment a selection on an array action', () => {
    augmentations.selection.myThing = (selection) => () => {
      return selection.read();
    }
    const select = createGlobalStore({ array: [42] });
    const res = (select(s => s.array) as any).myThing();
    expect(res).toEqual([42]);
  })

  it('should be able to augment a selection on an array element action', () => {
    augmentations.selection.myThing = (selection) => () => {
      return selection.read();
    }
    const select = createGlobalStore({ array: [42] });
    const res = (select(s => s.array).findWhere().eq(42) as any).myThing();
    expect(res).toEqual(42);
  })

  it('should be able to augment a future on a core action', done => {
    augmentations.future.myThing = (selection) => () => {
      return selection.asPromise();
    }
    const select = createGlobalStore({ num: 42 });
    const fetch = () => new Promise(resolve => setTimeout(() => resolve(43), 5))
    const res = (select(s => s.num) as any).replace(fetch).myThing();
    res.then((r: any) => {
      expect(r).toEqual(43);
      done();
    });
  })

  it('should be able to augment a future on an array action', done => {
    augmentations.future.myThing = (selection) => () => {
      return selection.asPromise();
    }
    const select = createGlobalStore({ array: [42] });
    const fetch = () => new Promise(resolve => setTimeout(() => resolve([43]), 5))
    const res = (select(s => s.array) as any).replace(fetch).myThing();
    res.then((r: any) => {
      expect(r).toEqual([43]);
      done();
    });
  })

  it('should be able to augment a future on an array element action', done => {
    augmentations.future.myThing = (selection) => () => {
      return selection.asPromise();
    }
    const select = createGlobalStore({ array: [42] });
    const fetch = () => new Promise(resolve => setTimeout(() => resolve(43), 5))
    const res = (select(s => s.array) as any).findWhere().eq(42).replace(fetch).myThing();
    res.then((r: any) => {
      expect(r).toEqual(undefined);
      done();
    });
  })

  it('should be able to augment an async', done => {
    augmentations.async = (fnReturningFutureAugmentation: () => Observable<any>) =>  {
      return fnReturningFutureAugmentation().toPromise();
    }
    const select = createGlobalStore({ thing: '' });
    const fetch = () => new Observable(observer => {
      observer.next('test');
      observer.complete();
    });
    const res = select(s => s.thing).replace(fetch as any as () => Promise<string>);
    res.asPromise().then((r: any) => {
      done();
    });
  })

  // it('should be able to augment a future on a core action', done => {
  //   augmentations.future = {
  //     name: 'myThing',
  //     action: (selection) => () => {
  //       // selection.read();
  //       // return selection.toPromise();
  //       return selection; // <----- this is where we invoke React.useEffect()
  //     }
  //   }
  // })
  

});
