import { createApplicationStore } from '../src';
import { libState } from '../src/constant';

describe('array-primitive', () => {

  const initialState = [1, 2, 3];

  beforeEach(() => {
    libState.appStates = {};
    libState.logLevel = 'none';
  })

  it('should replace all elements', () => {
    const select = createApplicationStore(initialState);
    const replacement = [4, 5, 6];
    select
      .replaceAll(replacement);
    expect(libState.currentAction).toEqual({ type: 'replaceAll()', replacement });
    expect(select.read()).toEqual([4, 5, 6]);
  })

  it('should remove all elements', () => {
    const select = createApplicationStore(initialState);
    select
      .removeAll();
    expect(libState.currentAction).toEqual({ type: 'removeAll()' });
    expect(select.read()).toEqual([]);
  })

  it('should increment all elements', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select
      .incrementAll(by);
    expect(libState.currentAction).toEqual({ type: 'incrementAll()', by });
    expect(select.read()).toEqual([2, 3, 4]);
  })

  it('should be able to insert one primitive', () => {
    const select = createApplicationStore(initialState);
    const toInsert = 4;
    select.insertOne(toInsert);
    expect(libState.currentAction).toEqual({ type: 'insertOne()', toInsert });
    expect(select.read()).toEqual([1, 2, 3, 4]);
  })

  it('should be able to insert many primitives', () => {
    const select = createApplicationStore(initialState);
    const toInsert = [4, 5, 6];
    select.insertMany(toInsert);
    expect(libState.currentAction).toEqual({ type: 'insertMany()', toInsert });
    expect(select.read()).toEqual([1, 2, 3, 4, 5, 6]);
  })

  it('should find an element and replace it', () => {
    const select = createApplicationStore(initialState);
    const replacement = 9;
    select
      .find.eq(2)
      .replace(replacement);
    expect(libState.currentAction).toEqual({ type: 'find.eq(2).replace()', replacement });
    expect(select.read()).toEqual([1, 9, 3]);
  })

  it('should find an element and remove it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'find.eq(2).remove()' });
    expect(select.read()).toEqual([1, 3]);
  })

  it('should find an element and increment it', () => {
    const select = createApplicationStore(initialState);
    const by = 2;
    select
      .find.eq(2)
      .increment(by);
    expect(libState.currentAction).toEqual({ type: 'find.eq(2).increment()', by });
    expect(select.read()).toEqual([1, 4, 3]);
  })

  it('should find an element by one clause or another and replace it', () => {
    const select = createApplicationStore(initialState);
    const replacement = 9;
    select
      .find.eq(1).or.eq(2)
      .replace(replacement);
    expect(libState.currentAction).toEqual({ type: 'find.eq(1).or.eq(2).replace()', replacement });
    expect(select.read()).toEqual([9, 2, 3]);
  })

  it('should find an element by one clause or another and remove it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.eq(1).or.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'find.eq(1).or.eq(2).remove()' });
    expect(select.read()).toEqual([2, 3]);
  })

  it('should find an element by one clause or another and increment it', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select
      .find.eq(1).or.eq(2)
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'find.eq(1).or.eq(2).increment()', by });
    expect(select.read()).toEqual([2, 2, 3]);
  })

  it('should find an element by one clause and another and replace it', () => {
    const select = createApplicationStore(initialState);
    const replacement = 9;
    select
      .find.gt(1).and.lt(3)
      .replace(replacement);
    expect(libState.currentAction).toEqual({ type: 'find.gt(1).and.lt(3).replace()', replacement });
    expect(select.read()).toEqual([1, 9, 3]);
  })

  it('should find an element by one clause and another and remove it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.gt(1).and.lt(3)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'find.gt(1).and.lt(3).remove()' });
    expect(select.read()).toEqual([1, 3]);
  })

  it('should find an element by one clause and another and increment it', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select
      .find.eq(1).and.lt(2)
      .increment(by);
    expect(libState.currentAction).toEqual({ type: 'find.eq(1).and.lt(2).increment()', by });
    expect(select.read()).toEqual([2, 2, 3]);
  })

  it('should filter elements and remove them', () => {
    const select = createApplicationStore(initialState);
    select
      .filter.gt(1)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'filter.gt(1).remove()' });
    expect(select.read()).toEqual([1]);
  })

  it('should filter elements and increment them', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select
      .filter.gt(1)
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'filter.gt(1).increment()', by });
    expect(select.read()).toEqual([1, 3, 4]);
  })

  it('should filter elements by one clause or another and remove them', () => {
    const select = createApplicationStore(initialState);
    select
      .filter.eq(1).or.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'filter.eq(1).or.eq(2).remove()' });
    expect(select.read()).toEqual([3]);
  })

  it('should filter elements by one clause or another and increment them', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select
      .filter.eq(1).or.eq(2)
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'filter.eq(1).or.eq(2).increment()', by });
    expect(select.read()).toEqual([2, 3, 3]);
  })

  it('should filter elements by one clause and another and remove them', () => {
    const select = createApplicationStore(initialState);
    select
      .filter.gt(0).and.lt(3)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'filter.gt(0).and.lt(3).remove()' });
    expect(select.read()).toEqual([3]);
  })

  it('should filter elements by one clause and another and increment them', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select
      .filter.gt(0).and.gt(1)
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'filter.gt(0).and.gt(1).increment()', by });
    expect(select.read()).toEqual([1, 3, 4]);
  })

});

