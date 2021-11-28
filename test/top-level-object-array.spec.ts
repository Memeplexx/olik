
import { createApplicationStore, libState, testState } from '../src/index';
import { DeepReadonlyArray, Store } from '../src/types';

describe('Top-level', () => {

  const initialState = [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }];

  beforeEach(() => {
    libState.appStates = {};
    testState.logLevel = 'none';
  })

  it('should replace all elements', () => {
    const select = createApplicationStore(initialState);
    const payload = [{ id: 5, val: 5 }, { id: 6, val: 6 }, { id: 7, val: 7 }];
    select
      .replaceAll(payload);
    expect(select.read()).toEqual(payload);
  })

  it('should increment all elements properties', () => {
    const select = createApplicationStore(initialState);
    select.val
      .incrementAll(1);
    expect(select.read()).toEqual([{ id: 1, val: 2 }, { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should remove all elements', () => {
    const select = createApplicationStore(initialState);
    select.removeAll();
    expect(select.read()).toEqual([]);
  })

  it('...', () => {
    const select = createApplicationStore({ arr: [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }]});
    select.arr.val
      .incrementAll(2);
    expect(select.read()).toEqual({ arr: [{ id: 1, val: 3 }, { id: 2, val: 4 }, { id: 3, val: 5 }]});
  })

  it('...', () => {
    const select = createApplicationStore({ arr: [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }]});
    select.arr.val
      .replaceAll(4);
    expect(select.read()).toEqual({ arr: [{ id: 1, val: 4 }, { id: 2, val: 4 }, { id: 3, val: 4 }]});
  })

  it('should be able to insert one object', () => {
    const select = createApplicationStore([{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }]);
    select.insertOne({ id: 4, val: 4 });
    expect(select.read()).toEqual([{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }, { id: 4, val: 4 }]);
  })

  it('should be able to insert many objects', () => {
    const select = createApplicationStore([{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }]);
    select.insertMany([{ id: 4, val: 4 }, { id: 5, val: 5 }]);
    expect(select.read()).toEqual([{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }, { id: 4, val: 4 }, { id: 5, val: 5 }]);
  })

});

