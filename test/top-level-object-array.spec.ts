
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
    const replacement = [{ id: 5, val: 5 }, { id: 6, val: 6 }, { id: 7, val: 7 }];
    select
      .replaceAll(replacement);
    expect(libState.currentAction).toEqual({ type: 'replaceAll()', replacement });
    expect(select.read()).toEqual(replacement);
  })

  it('should remove all elements', () => {
    const select = createApplicationStore(initialState);
    select
      .removeAll();
    expect(libState.currentAction).toEqual({ type: 'removeAll()' });
    expect(select.read()).toEqual([]);
  })

  it('should replace all elements properties', () => {
    const select = createApplicationStore(initialState);
    const replacement = 9;
    select.val
      .replaceAll(replacement);
    expect(libState.currentAction).toEqual({ type: 'val.replaceAll()', replacement });
    expect(select.read()).toEqual(initialState.map(s => ({ ...s, val: replacement })));
  })

  it('should increment all elements properties', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select.val
      .incrementAll(by);
    expect(libState.currentAction).toEqual({ type: 'val.incrementAll()', by });
    expect(select.read()).toEqual([{ id: 1, val: 2 }, { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should be able to insert one element', () => {
    const select = createApplicationStore(initialState);
    const toInsert = { id: 4, val: 4 };
    select
      .insertOne(toInsert);
    expect(libState.currentAction).toEqual({ type: 'insertOne()', toInsert });
    expect(select.read()).toEqual([...initialState, toInsert]);
  })

  it('should be able to insert many elements', () => {
    const select = createApplicationStore(initialState);
    const toInsert = [{ id: 4, val: 4 }, { id: 5, val: 5 }];
    select
      .insertMany(toInsert);
    expect(libState.currentAction).toEqual({ type: 'insertMany()', toInsert });
    expect(select.read()).toEqual([...initialState, ...toInsert]);
  })

  it('should find an element and replace it', () => {
    const select = createApplicationStore(initialState);
    const replacement = { id: 4, val: 4 };
    select
      .find.id.eq(2)
      .replace(replacement);
    expect(libState.currentAction).toEqual({ type: 'find.id.eq(2).replace()', replacement });
    expect(select.read()).toEqual([initialState[0], replacement, initialState[2]]);
  })

  it('should find an element and remove it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.id.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'find.id.eq(2).remove()' });
    expect(select.read()).toEqual([initialState[0], initialState[2]]);
  })

  it('should find an element property and increment it', () => {
    const select = createApplicationStore(initialState);
    const by = 2;
    select
      .find.id.eq(2).val
      .increment(by);
    expect(libState.currentAction).toEqual({ type: 'find.id.eq(2).val.increment()', by });
    expect(select.read()).toEqual([initialState[0], { id: 2, val: 4 }, initialState[2]]);
  })

  it('should find an element by one clause or another and replace it', () => {
    const select = createApplicationStore(initialState);
    const replacement = { id: 9, val: 9 };
    select
      .find.id.eq(1).or.id.eq(2)
      .replace(replacement);
    expect(libState.currentAction).toEqual({ type: 'find.id.eq(1).or.id.eq(2).replace()', replacement });
    expect(select.read()).toEqual([replacement, initialState[1], initialState[2]]);
  })

  it('should find an element by one clause or another and remove it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.id.eq(1).or.id.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'find.id.eq(1).or.id.eq(2).remove()' });
    expect(select.read()).toEqual([initialState[1], initialState[2]]);
  })

  it('should find an element by one clause or another and increment it', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select
      .find.id.eq(1).or.id.eq(2).val
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'find.id.eq(1).or.id.eq(2).val.increment()', by });
    expect(select.read()).toEqual([{ id: 1, val: 2 }, initialState[1], initialState[2]]);
  })

  it('should find an element by one clause and another and replace it', () => {
    const select = createApplicationStore(initialState);
    const replacement = { id: 9, val: 9 };
    select
      .find.id.gt(1).and.id.lt(3)
      .replace(replacement);
    expect(libState.currentAction).toEqual({ type: 'find.id.gt(1).and.id.lt(3).replace()', replacement });
    expect(select.read()).toEqual([initialState[0], { id: 9, val: 9 }, initialState[2]]);
  })

  it('should find an element by one clause and another and remove it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.id.gt(1).and.id.lt(3)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'find.id.gt(1).and.id.lt(3).remove()' });
    expect(select.read()).toEqual([initialState[0], initialState[2]]);
  })

  it('should find an element by one clause and another and increment it', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select
      .find.id.eq(1).and.id.lt(2).val
      .increment(by);
    expect(libState.currentAction).toEqual({ type: 'find.id.eq(1).and.id.lt(2).val.increment()', by });
    expect(select.read()).toEqual([{ id: 1, val: 2 }, initialState[1], initialState[2]]);
  })

  it('should filter elements and remove them', () => {
    const select = createApplicationStore(initialState);
    select
      .filter.id.gt(1)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'filter.id.gt(1).remove()' });
    expect(select.read()).toEqual([initialState[0]]);
  })

  it('should filter elements and increment them', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select
      .filter.id.gt(1).val
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'filter.id.gt(1).val.increment()', by });
    expect(select.read()).toEqual([initialState[0], { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should filter elements by one clause or another and remove them', () => {
    const select = createApplicationStore(initialState);
    select
      .filter.id.eq(1).or.id.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'filter.id.eq(1).or.id.eq(2).remove()' });
    expect(select.read()).toEqual([initialState[2]]);
  })

  it('should filter elements by one clause or another and increment them', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select
      .filter.id.eq(1).or.id.eq(2).val
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'filter.id.eq(1).or.id.eq(2).val.increment()', by });
    expect(select.read()).toEqual([{ id: 1, val: 2 }, { id: 2, val: 3 }, initialState[2]]);
  })

  it('should filter elements by one clause and another and remove them', () => {
    const select = createApplicationStore(initialState);
    select
      .filter.id.gt(0).and.id.lt(3)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'filter.id.gt(0).and.id.lt(3).remove()' });
    expect(select.read()).toEqual([initialState[2]]);
  })

  it('should filter elements by one clause and another and increment them', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select
      .filter.id.gt(0).and.id.gt(1).val
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'filter.id.gt(0).and.id.gt(1).val.increment()', by });
    expect(select.read()).toEqual([initialState[0], { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })


  it('...', () => {
    const select = createApplicationStore({ arr: [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }] });
    select.arr.val
      .incrementAll(2);
    expect(select.read()).toEqual({ arr: [{ id: 1, val: 3 }, { id: 2, val: 4 }, { id: 3, val: 5 }] });
  })

  it('...', () => {
    const select = createApplicationStore({ arr: [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }] });
    select.arr.val
      .replaceAll(4);
    expect(select.read()).toEqual({ arr: [{ id: 1, val: 4 }, { id: 2, val: 4 }, { id: 3, val: 4 }] });
  })


});

