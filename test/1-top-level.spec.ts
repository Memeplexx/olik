
import { createApplicationStore, libState } from '../src/index';

describe('Top-level', () => {

  beforeEach(() => {
    libState.appStates = {};
    libState.logLevel = 'none';
  })

  it('should work with half-finished writes intermixed with reads', () => {
    const select = createApplicationStore({ num: 0, str: '', bool: false });
    const changeNum = select.num;
    const changeBool = select.bool;
    select.str.replace('x');
    changeNum.increment(1);
    changeBool.replace(true);
    expect(select.read()).toEqual({ num: 1, str: 'x', bool: true });
  })

  it('should replace a top-level primitive', () => {
    const select = createApplicationStore(0);
    select
      .replace(1);
    expect(select.read()).toEqual(1);
  })

  it('should increment a top-level primitive', () => {
    const select = createApplicationStore(0);
    select
      .increment(1);
    expect(select.read()).toEqual(1);
  })


  it('should get all elements from a top-level array of primitives and then replace them', () => {
    const select = createApplicationStore([1, 2, 3]);
    select
      .replaceAll([4, 5, 6]);
    expect(select.read()).toEqual([4, 5, 6]);
  })

  it('should get all elements from a top-level array of primitives and then remove them', () => {
    const select = createApplicationStore([1, 2, 3]);
    select
      .removeAll();
    expect(select.read()).toEqual([]);
  })

  it('should get all elements from a top-level array of primitives and then increment them', () => {
    const select = createApplicationStore([1, 2, 3]);
    select
      .incrementAll(1);
    expect(select.read()).toEqual([2, 3, 4]);
  })




  it('...', () => {
    const select = createApplicationStore([{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }]);
    select.val
      .incrementAll(2);
    expect(select.read()).toEqual([{ id: 1, val: 3 }, { id: 2, val: 4 }, { id: 3, val: 5 }]);
  })

  it('...', () => {
    const select = createApplicationStore({ arr: [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }]});
    select.arr.val
      .incrementAll(2);
    expect(select.read()).toEqual({ arr: [{ id: 1, val: 3 }, { id: 2, val: 4 }, { id: 3, val: 5 }]});
  })

  it('...', () => {
    const select = createApplicationStore({ arr: [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }]});
    libState.logLevel = 'debug';
    select.arr.val
      .replaceAll(4);
      libState.logLevel = 'none';
    expect(select.read()).toEqual({ arr: [{ id: 1, val: 4 }, { id: 2, val: 4 }, { id: 3, val: 4 }]});
  })





  it('should find an element from a top-level array of primitives and then increment it', () => {
    const select = createApplicationStore([1, 2, 3]);
    select
      .find.eq(2)
      .increment(2);
    expect(select.read()).toEqual([1, 4, 3]);
  })

  it('should filter elements from a top-level array of primitives and then replace them', () => {
    const select = createApplicationStore([1, 2, 3]);
    select
      .filter.in([1, 2])
      .replace(1);
    expect(select.read()).toEqual([1, 1, 3]);
  })

  it('should filter elements from a top-level array of primitives and then increment them', () => {
    const select = createApplicationStore([1, 2, 3]);
    select
      .filter.in([2, 3])
      .increment(2);
    expect(select.read()).toEqual([1, 4, 5]);
  })


});

