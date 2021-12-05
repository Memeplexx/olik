import { createApplicationStore } from '../src';
import { libState } from '../src/constant';

describe('array-primitive-deep', () => {

  const initialState = { arr: [1, 2, 3] };

  beforeEach(() => {
    libState.appStates = {};
    libState.logLevel = 'none';
  })

  it('should replace all elements', () => {
    const select = createApplicationStore(initialState);
    const replacement = [4, 5, 6];
    select.arr
      .replaceAll(replacement);
    expect(libState.currentAction).toEqual({ type: 'arr.replaceAll()', replacement });
    expect(select.read()).toEqual({ arr: [4, 5, 6] });
  })

  it('should remove all elements', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .removeAll();
    expect(libState.currentAction).toEqual({ type: 'arr.removeAll()' });
    expect(select.read()).toEqual({ arr: [] });
  })

  it('should increment all elements', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select.arr
      .incrementAll(by);
    expect(libState.currentAction).toEqual({ type: 'arr.incrementAll()', by });
    expect(select.read()).toEqual({ arr: [2, 3, 4] });
  })

  it('should be able to insert one primitive', () => {
    const select = createApplicationStore(initialState);
    const toInsert = 4;
    select.arr
      .insertOne(toInsert);
    expect(libState.currentAction).toEqual({ type: 'arr.insertOne()', toInsert });
    expect(select.read()).toEqual({ arr: [1, 2, 3, 4] });
  })

  it('should be able to insert many primitives', () => {
    const select = createApplicationStore(initialState);
    const toInsert = [4, 5, 6];
    select.arr
      .insertMany(toInsert);
    expect(libState.currentAction).toEqual({ type: 'arr.insertMany()', toInsert });
    expect(select.read()).toEqual({ arr: [1, 2, 3, 4, 5, 6] });
  })

  it('should find an element and replace it', () => {
    const select = createApplicationStore(initialState);
    const replacement = 9;
    select.arr
      .find.eq(2)
      .replace(replacement);
    expect(libState.currentAction).toEqual({ type: 'arr.find.eq(2).replace()', replacement });
    expect(select.read()).toEqual({ arr: [1, 9, 3] });
  })

  it('should find an element and remove it', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .find.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.find.eq(2).remove()' });
    expect(select.read()).toEqual({ arr: [1, 3] });
  })

  it('should find an element and increment it', () => {
    const select = createApplicationStore(initialState);
    const by = 2;
    select.arr
      .find.eq(2)
      .increment(by);
    expect(libState.currentAction).toEqual({ type: 'arr.find.eq(2).increment()', by });
    expect(select.read()).toEqual({ arr: [1, 4, 3] });
  })

  it('should find an element by one clause or another and replace it', () => {
    const select = createApplicationStore(initialState);
    const replacement = 9;
    select.arr
      .find.eq(1).or.eq(2)
      .replace(replacement);
    expect(libState.currentAction).toEqual({ type: 'arr.find.eq(1).or.eq(2).replace()', replacement });
    expect(select.read()).toEqual({ arr: [9, 2, 3] });
  })

  it('should find an element by one clause or another and remove it', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .find.eq(1).or.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.find.eq(1).or.eq(2).remove()' });
    expect(select.read()).toEqual({ arr: [2, 3] });
  })

  it('should find an element by one clause or another and increment it', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select.arr
      .find.eq(1).or.eq(2)
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'arr.find.eq(1).or.eq(2).increment()', by });
    expect(select.read()).toEqual({ arr: [2, 2, 3] });
  })

  it('should find an element by one clause and another and replace it', () => {
    const select = createApplicationStore(initialState);
    const replacement = 9;
    select.arr
      .find.gt(1).and.lt(3)
      .replace(replacement);
    expect(libState.currentAction).toEqual({ type: 'arr.find.gt(1).and.lt(3).replace()', replacement });
    expect(select.read()).toEqual({ arr: [1, 9, 3] });
  })

  it('should find an element by one clause and another and remove it', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .find.gt(1).and.lt(3)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.find.gt(1).and.lt(3).remove()' });
    expect(select.read()).toEqual({ arr: [1, 3] });
  })

  it('should find an element by one clause and another and increment it', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select.arr
      .find.eq(1).and.lt(2)
      .increment(by);
    expect(libState.currentAction).toEqual({ type: 'arr.find.eq(1).and.lt(2).increment()', by });
    expect(select.read()).toEqual({ arr: [2, 2, 3] });
  })

  it('should filter elements and remove them', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .filter.gt(1)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.filter.gt(1).remove()' });
    expect(select.read()).toEqual({ arr: [1] });
  })

  it('should filter elements and increment them', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select.arr
      .filter.gt(1)
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'arr.filter.gt(1).increment()', by });
    expect(select.read()).toEqual({ arr: [1, 3, 4] });
  })

  it('should filter elements by one clause or another and remove them', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .filter.eq(1).or.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.filter.eq(1).or.eq(2).remove()' });
    expect(select.read()).toEqual({ arr: [3] });
  })

  it('should filter elements by one clause or another and increment them', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select.arr
      .filter.eq(1).or.eq(2)
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'arr.filter.eq(1).or.eq(2).increment()', by });
    expect(select.read()).toEqual({ arr: [2, 3, 3] });
  })

  it('should filter elements by one clause and another and remove them', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .filter.gt(0).and.lt(3)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.filter.gt(0).and.lt(3).remove()' });
    expect(select.read()).toEqual({ arr: [3] });
  })

  it('should filter elements by one clause and another and increment them', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select.arr
      .filter.gt(0).and.gt(1)
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'arr.filter.gt(0).and.gt(1).increment()', by });
    expect(select.read()).toEqual({ arr: [1, 3, 4] });
  })

});

