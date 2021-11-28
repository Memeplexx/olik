import { createApplicationStore, libState, testState } from '../src';


describe('top-level-primitive-array', () => {

  const initialState = [1, 2, 3];

  beforeEach(() => {
    libState.appStates = {};
    testState.logLevel = 'none';
  })

  it('should replace all elements', () => {
    const select = createApplicationStore(initialState);
    select
      .replaceAll([4, 5, 6]);
    expect(select.read()).toEqual([4, 5, 6]);
  })

  it('should remove all elements', () => {
    const select = createApplicationStore(initialState);
    select
      .removeAll();
    expect(select.read()).toEqual([]);
  })

  it('should increment all elements', () => {
    const select = createApplicationStore(initialState);
    select
      .incrementAll(1);
    expect(select.read()).toEqual([2, 3, 4]);
  })
  
  it('should be able to insert one primitive', () => {
    const select = createApplicationStore(initialState);
    select.insertOne(4);
    expect(select.read()).toEqual([1, 2, 3, 4]);
  })

  it('should be able to insert many primitives', () => {
    const select = createApplicationStore(initialState);
    select.insertMany([4, 5, 6]);
    expect(select.read()).toEqual([1, 2, 3, 4, 5, 6]);
  })

  it('should find an element and replace it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.eq(2)
      .replace(9);
    expect(select.read()).toEqual([1, 9, 3]);
  })

  it('should find an element and remove it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.eq(2)
      .remove();
    expect(select.read()).toEqual([1, 3]);
  })

  it('should find an element and increment it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.eq(2)
      .increment(2);
    expect(select.read()).toEqual([1, 4, 3]);
  })

  it('should find an element by one clause or another and replace it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.eq(1).or.eq(2)
      .replace(9);
    expect(select.read()).toEqual([9, 2, 3]);
  })

  it('should find an element by one clause or another and remove it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.eq(1).or.eq(2)
      .remove();
    expect(select.read()).toEqual([2, 3]);
  })

  it('should find an element by one clause or another and increment it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.eq(1).or.eq(2)
      .increment(1);
    expect(select.read()).toEqual([2, 2, 3]);
  })

  it('should find an element by one clause and another and replace it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.gt(1).and.lt(3)
      .replace(9);
    expect(select.read()).toEqual([1, 9, 3]);
  })

  it('should find an element by one clause and another and remove it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.gt(1).and.lt(3)
      .remove();
    expect(select.read()).toEqual([1, 3]);
  })

  it('should find an element by one clause and another and increment it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.eq(1).and.lt(2)
      .increment(1);
    expect(select.read()).toEqual([2, 2, 3]);
  })

  it('should filter elements and remove them', () => {
    const select = createApplicationStore(initialState);
    select
      .filter.gt(1)
      .remove();
    expect(select.read()).toEqual([1]);
  })

  it('should filter elements and increment them', () => {
    const select = createApplicationStore(initialState);
    select
      .filter.gt(1)
      .increment(1);
    expect(select.read()).toEqual([1, 3, 4]);
  })

  it('should filter elements by one clause or another and remove them', () => {
    const select = createApplicationStore(initialState);
    select
      .filter.eq(1).or.eq(2)
      .remove();
    expect(select.read()).toEqual([3]);
  })

  it('should filter elements by one clause or another and increment them', () => {
    const select = createApplicationStore(initialState);
    select
      .filter.eq(1).or.eq(2)
      .increment(1);
    expect(select.read()).toEqual([2, 3, 3]);
  })

  it.only('should filter elements by one clause and another and remove them', () => {
    const select = createApplicationStore(initialState);
    select
      .filter.gt(0).and.lt(3)
      .remove();
    expect(select.read()).toEqual([3]);
  })

  it('should filter elements by one clause and another and increment them', () => {
    const select = createApplicationStore(initialState);
    select
      .filter.gt(0).and.gt(1)
      .increment(1);
    expect(select.read()).toEqual([1, 3, 4]);
  })

});

