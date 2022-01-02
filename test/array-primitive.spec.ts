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
    const select = createStore({ name, state });
    const payload = [4, 5, 6];
    select
      .replaceAll(payload);
    expect(currentAction(select)).toEqual({ type: 'replaceAll()', payload });
    expect(select.state).toEqual([4, 5, 6]);
  })

  it('should remove all elements', () => {
    const select = createStore({ name, state });
    select
      .removeAll();
    expect(currentAction(select)).toEqual({ type: 'removeAll()' });
    expect(select.state).toEqual([]);
  })

  it('should increment all elements', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select
      .incrementAll(payload);
    expect(currentAction(select)).toEqual({ type: 'incrementAll()', payload });
    expect(select.state).toEqual(state.map(e => e + 1));
  })

  it('should be able to insert one primitive', () => {
    const select = createStore({ name, state });
    const payload = 4;
    select
      .insertOne(payload);
    expect(currentAction(select)).toEqual({ type: 'insertOne()', payload });
    expect(select.state).toEqual([...state, payload]);
  })

  it('should be able to insert many primitives', () => {
    const select = createStore({ name, state });
    const payload = [4, 5, 6];
    select
      .insertMany(payload);
    expect(currentAction(select)).toEqual({ type: 'insertMany()', payload });
    expect(select.state).toEqual([...state, ...payload]);
  })

  it('should find an element and replace it', () => {
    const select = createStore({ name, state });
    const payload = 9;
    select
      .find.eq(2)
      .replace(payload);
    expect(currentAction(select)).toEqual({ type: 'find.eq(2).replace()', payload });
    expect(select.state).toEqual([1, payload, 3]);
  })

  it('should find an element and remove it', () => {
    const select = createStore({ name, state });
    select
      .find.eq(2)
      .remove();
    expect(currentAction(select)).toEqual({ type: 'find.eq(2).remove()' });
    expect(select.state).toEqual([1, 3]);
  })

  it('should find an element and increment it', () => {
    const select = createStore({ name, state });
    const payload = 2;
    select
      .find.eq(2)
      .increment(payload);
    expect(currentAction(select)).toEqual({ type: 'find.eq(2).increment()', payload });
    expect(select.state).toEqual([1, 4, 3]);
  })

  it('should find an element by one clause or another and replace it', () => {
    const select = createStore({ name, state });
    const payload = 9;
    select
      .find.eq(1).or.eq(2)
      .replace(payload);
    expect(currentAction(select)).toEqual({ type: 'find.eq(1).or.eq(2).replace()', payload });
    expect(select.state).toEqual([9, 2, 3]);
  })

  it('should find an element by one clause or another and remove it', () => {
    const select = createStore({ name, state });
    select
      .find.eq(1).or.eq(2)
      .remove();
    expect(currentAction(select)).toEqual({ type: 'find.eq(1).or.eq(2).remove()' });
    expect(select.state).toEqual([2, 3]);
  })

  it('should find an element by one clause or another and increment it', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select
      .find.eq(1).or.eq(2)
      .increment(1);
    expect(currentAction(select)).toEqual({ type: 'find.eq(1).or.eq(2).increment()', payload });
    expect(select.state).toEqual([2, 2, 3]);
  })

  it('should find an element by one clause and another and replace it', () => {
    const select = createStore({ name, state });
    const payload = 9;
    select
      .find.gt(1).and.lt(3)
      .replace(payload);
    expect(currentAction(select)).toEqual({ type: 'find.gt(1).and.lt(3).replace()', payload });
    expect(select.state).toEqual([1, 9, 3]);
  })

  it('should find an element by one clause and another and remove it', () => {
    const select = createStore({ name, state });
    select
      .find.gt(1).and.lt(3)
      .remove();
    expect(currentAction(select)).toEqual({ type: 'find.gt(1).and.lt(3).remove()' });
    expect(select.state).toEqual([1, 3]);
  })

  it('should find an element by one clause and another and increment it', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select
      .find.eq(1).and.lt(2)
      .increment(payload);
    expect(currentAction(select)).toEqual({ type: 'find.eq(1).and.lt(2).increment()', payload });
    expect(select.state).toEqual([2, 2, 3]);
  })

  it('should filter elements and remove them', () => {
    const select = createStore({ name, state });
    select
      .filter.gt(1)
      .remove();
    expect(currentAction(select)).toEqual({ type: 'filter.gt(1).remove()' });
    expect(select.state).toEqual([1]);
  })

  it('should filter elements and increment them', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select
      .filter.gt(1)
      .increment(1);
    expect(currentAction(select)).toEqual({ type: 'filter.gt(1).increment()', payload });
    expect(select.state).toEqual([1, 3, 4]);
  })

  it('should filter elements by one clause or another and remove them', () => {
    const select = createStore({ name, state });
    select
      .filter.eq(1).or.eq(2)
      .remove();
    expect(currentAction(select)).toEqual({ type: 'filter.eq(1).or.eq(2).remove()' });
    expect(select.state).toEqual([3]);
  })

  it('should filter elements by one clause or another and increment them', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select
      .filter.eq(1).or.eq(2)
      .increment(1);
    expect(currentAction(select)).toEqual({ type: 'filter.eq(1).or.eq(2).increment()', payload });
    expect(select.state).toEqual([2, 3, 3]);
  })

  it('should filter elements by one clause and another and remove them', () => {
    const select = createStore({ name, state });
    select
      .filter.gt(0).and.lt(3)
      .remove();
    expect(currentAction(select)).toEqual({ type: 'filter.gt(0).and.lt(3).remove()' });
    expect(select.state).toEqual([3]);
  })

  it('should filter elements by one clause and another and increment them', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select
      .filter.gt(0).and.gt(1)
      .increment(payload);
    expect(currentAction(select)).toEqual({ type: 'filter.gt(0).and.gt(1).increment()', payload });
    expect(select.state).toEqual([payload, 3, 4]);
  })

});

