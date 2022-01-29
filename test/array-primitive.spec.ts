import { testState } from '../src/constant';
import { createStore } from '../src/core';
import { currentAction } from './_utility';

describe('array-primitive', () => {

  const name = 'AppStore';
  const state = [1, 2, 3];

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should replace all elements', () => {
    const store = createStore({ name, state });
    const payload = [4, 5, 6];
    store
      .$replace(payload);
    expect(currentAction(store)).toEqual({ type: 'replace()', payload });
    expect(store.$state).toEqual([4, 5, 6]);
  })

  it('should remove all elements', () => {
    const store = createStore({ name, state });
    store
      .$clear();
    expect(currentAction(store)).toEqual({ type: 'clear()' });
    expect(store.$state).toEqual([]);
  })

  it('should increment all elements', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store
      .$add(payload);
    expect(currentAction(store)).toEqual({ type: 'add()', payload });
    expect(store.$state).toEqual(state.map(e => e + 1));
  })

  it('should be able to insert one primitive', () => {
    const store = createStore({ name, state });
    const payload = 4;
    store
      .$insertOne(payload);
    expect(currentAction(store)).toEqual({ type: 'insertOne()', payload });
    expect(store.$state).toEqual([...state, payload]);
  })

  it('should be able to insert many primitives', () => {
    const store = createStore({ name, state });
    const payload = [4, 5, 6];
    store
      .$insertMany(payload);
    expect(currentAction(store)).toEqual({ type: 'insertMany()', payload });
    expect(store.$state).toEqual([...state, ...payload]);
  })

  it('should find an element and replace it', () => {
    const store = createStore({ name, state });
    const payload = 9;
    store
      .$find.$eq(2)
      .$replace(payload);
    expect(currentAction(store)).toEqual({ type: 'find.eq(2).replace()', payload });
    expect(store.$state).toEqual([1, payload, 3]);
  })

  it('should find an element and remove it', () => {
    const store = createStore({ name, state });
    store
      .$find.$eq(2)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'find.eq(2).remove()' });
    expect(store.$state).toEqual([1, 3]);
  })

  it('should find an element and increment it', () => {
    const store = createStore({ name, state });
    const payload = 2;
    store
      .$find.$eq(2)
      .$add(payload);
    expect(currentAction(store)).toEqual({ type: 'find.eq(2).add()', payload });
    expect(store.$state).toEqual([1, 4, 3]);
  })

  it('should find an element by one clause or another and replace it', () => {
    const store = createStore({ name, state });
    const payload = 9;
    store
      .$find.$eq(1).$or.$eq(2)
      .$replace(payload);
    expect(currentAction(store)).toEqual({ type: 'find.eq(1).or.eq(2).replace()', payload });
    expect(store.$state).toEqual([9, 2, 3]);
  })

  it('should find an element by one clause or another and remove it', () => {
    const store = createStore({ name, state });
    store
      .$find.$eq(1).$or.$eq(2)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'find.eq(1).or.eq(2).remove()' });
    expect(store.$state).toEqual([2, 3]);
  })

  it('should find an element by one clause or another and increment it', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store
      .$find.$eq(1).$or.$eq(2)
      .$add(1);
    expect(currentAction(store)).toEqual({ type: 'find.eq(1).or.eq(2).add()', payload });
    expect(store.$state).toEqual([2, 2, 3]);
  })

  it('should find an element by one clause and another and replace it', () => {
    const store = createStore({ name, state });
    const payload = 9;
    store
      .$find.$gt(1).$and.$lt(3)
      .$replace(payload);
    expect(currentAction(store)).toEqual({ type: 'find.gt(1).and.lt(3).replace()', payload });
    expect(store.$state).toEqual([1, 9, 3]);
  })

  it('should find an element by one clause and another and remove it', () => {
    const store = createStore({ name, state });
    store
      .$find.$gt(1).$and.$lt(3)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'find.gt(1).and.lt(3).remove()' });
    expect(store.$state).toEqual([1, 3]);
  })

  it('should find an element by one clause and another and increment it', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store
      .$find.$eq(1).$and.$lt(2)
      .$add(payload);
    expect(currentAction(store)).toEqual({ type: 'find.eq(1).and.lt(2).add()', payload });
    expect(store.$state).toEqual([2, 2, 3]);
  })

  it('should filter elements and remove them', () => {
    const store = createStore({ name, state });
    store
      .$filter.$gt(1)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'filter.gt(1).remove()' });
    expect(store.$state).toEqual([1]);
  })

  it('should filter elements and increment them', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store
      .$filter.$gt(1)
      .$add(1);
    expect(currentAction(store)).toEqual({ type: 'filter.gt(1).add()', payload });
    expect(store.$state).toEqual([1, 3, 4]);
  })

  it('should filter elements by one clause or another and remove them', () => {
    const store = createStore({ name, state });
    store
      .$filter.$eq(1).$or.$eq(2)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'filter.eq(1).or.eq(2).remove()' });
    expect(store.$state).toEqual([3]);
  })

  it('should filter elements by one clause or another and increment them', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store
      .$filter.$eq(1).$or.$eq(2)
      .$add(1);
    expect(currentAction(store)).toEqual({ type: 'filter.eq(1).or.eq(2).add()', payload });
    expect(store.$state).toEqual([2, 3, 3]);
  })

  it('should filter elements by one clause and another and remove them', () => {
    const store = createStore({ name, state });
    store
      .$filter.$gt(0).$and.$lt(3)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'filter.gt(0).and.lt(3).remove()' });
    expect(store.$state).toEqual([3]);
  })

  it('should filter elements by one clause and another and increment them', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store
      .$filter.$gt(0).$and.$gt(1)
      .$add(payload);
    expect(currentAction(store)).toEqual({ type: 'filter.gt(0).and.gt(1).add()', payload });
    expect(store.$state).toEqual([payload, 3, 4]);
  })

});

