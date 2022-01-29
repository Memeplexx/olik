import { testState } from '../src/constant';
import { createStore } from '../src/core';
import { currentAction } from './_utility';

describe('array-primitive-deep', () => {

  const name = 'AppStore';
  const state = { arr: [1, 2, 3] };

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should replace all elements', () => {
    const store = createStore({ name, state });
    const payload = [4, 5, 6];
    store.arr
      .$replace(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.replace()', payload });
    expect(store.$state).toEqual({ arr: [4, 5, 6] });
  })

  it('should remove all elements', () => {
    const store = createStore({ name, state });
    store.arr
      .$clear();
    expect(currentAction(store)).toEqual({ type: 'arr.clear()' });
    expect(store.$state).toEqual({ arr: [] });
  })

  it('should increment all elements', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store.arr
      .$increment(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.increment()', payload });
    expect(store.$state).toEqual({ arr: [2, 3, 4] });
  })

  it('should be able to insert one primitive', () => {
    const store = createStore({ name, state });
    const payload = 4;
    store.arr
      .$insertOne(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.insertOne()', payload });
    expect(store.$state).toEqual({ arr: [1, 2, 3, 4] });
  })

  it('should be able to insert many primitives', () => {
    const store = createStore({ name, state });
    const payload = [4, 5, 6];
    store.arr
      .$insertMany(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.insertMany()', payload });
    expect(store.$state).toEqual({ arr: [1, 2, 3, 4, 5, 6] });
  })

  it('should find an element and replace it', () => {
    const store = createStore({ name, state });
    const payload = 9;
    store.arr
      .$find.$eq(2)
      .$replace(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.find.eq(2).replace()', payload });
    expect(store.$state).toEqual({ arr: [1, 9, 3] });
  })

  it('should find an element and remove it', () => {
    const store = createStore({ name, state });
    store.arr
      .$find.$eq(2)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'arr.find.eq(2).remove()' });
    expect(store.$state).toEqual({ arr: [1, 3] });
  })

  it('should find an element and increment it', () => {
    const store = createStore({ name, state });
    const payload = 2;
    store.arr
      .$find.$eq(2)
      .$increment(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.find.eq(2).increment()', payload });
    expect(store.$state).toEqual({ arr: [1, 4, 3] });
  })

  it('should find an element by one clause or another and replace it', () => {
    const store = createStore({ name, state });
    const payload = 9;
    store.arr
      .$find.$eq(1).$or.$eq(2)
      .$replace(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.find.eq(1).or.eq(2).replace()', payload });
    expect(store.$state).toEqual({ arr: [9, 2, 3] });
  })

  it('should find an element by one clause or another and remove it', () => {
    const store = createStore({ name, state });
    store.arr
      .$find.$eq(1).$or.$eq(2)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'arr.find.eq(1).or.eq(2).remove()' });
    expect(store.$state).toEqual({ arr: [2, 3] });
  })

  it('should find an element by one clause or another and increment it', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store.arr
      .$find.$eq(1).$or.$eq(2)
      .$increment(1);
    expect(currentAction(store)).toEqual({ type: 'arr.find.eq(1).or.eq(2).increment()', payload });
    expect(store.$state).toEqual({ arr: [2, 2, 3] });
  })

  it('should find an element by one clause and another and replace it', () => {
    const store = createStore({ name, state });
    const payload = 9;
    store.arr
      .$find.$gt(1).$and.$lt(3)
      .$replace(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.find.gt(1).and.lt(3).replace()', payload });
    expect(store.$state).toEqual({ arr: [1, 9, 3] });
  })

  it('should find an element by one clause and another and remove it', () => {
    const store = createStore({ name, state });
    store.arr
      .$find.$gt(1).$and.$lt(3)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'arr.find.gt(1).and.lt(3).remove()' });
    expect(store.$state).toEqual({ arr: [1, 3] });
  })

  it('should find an element by one clause and another and increment it', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store.arr
      .$find.$eq(1).$and.$lt(2)
      .$increment(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.find.eq(1).and.lt(2).increment()', payload });
    expect(store.$state).toEqual({ arr: [2, 2, 3] });
  })

  it('should filter elements and remove them', () => {
    const store = createStore({ name, state });
    store.arr
      .$filter.$gt(1)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'arr.filter.gt(1).remove()' });
    expect(store.$state).toEqual({ arr: [1] });
  })

  it('should filter elements and increment them', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store.arr
      .$filter.$gt(1)
      .$increment(1);
    expect(currentAction(store)).toEqual({ type: 'arr.filter.gt(1).increment()', payload });
    expect(store.$state).toEqual({ arr: [1, 3, 4] });
  })

  it('should filter elements by one clause or another and remove them', () => {
    const store = createStore({ name, state });
    store.arr
      .$filter.$eq(1).$or.$eq(2)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'arr.filter.eq(1).or.eq(2).remove()' });
    expect(store.$state).toEqual({ arr: [3] });
  })

  it('should filter elements by one clause or another and increment them', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store.arr
      .$filter.$eq(1).$or.$eq(2)
      .$increment(1);
    expect(currentAction(store)).toEqual({ type: 'arr.filter.eq(1).or.eq(2).increment()', payload });
    expect(store.$state).toEqual({ arr: [2, 3, 3] });
  })

  it('should filter elements by one clause and another and remove them', () => {
    const store = createStore({ name, state });
    store.arr
      .$filter.$gt(0).$and.$lt(3)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'arr.filter.gt(0).and.lt(3).remove()' });
    expect(store.$state).toEqual({ arr: [3] });
  })

  it('should filter elements by one clause and another and increment them', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store.arr
      .$filter.$gt(0).$and.$gt(1)
      .$increment(1);
    expect(currentAction(store)).toEqual({ type: 'arr.filter.gt(0).and.gt(1).increment()', payload });
    expect(store.$state).toEqual({ arr: [1, 3, 4] });
  })

});

