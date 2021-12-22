import { createStore } from '../src';
import { libState, testState } from '../src/constant';

describe('array-primitive-deep', () => {

  const name = 'AppStore';
  const state = { arr: [1, 2, 3] };

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should replace all elements', () => {
    const select = createStore({ name, state });
    const payload = [4, 5, 6];
    select.arr
      .replaceAll(payload);
    expect(libState.currentAction).toEqual({ type: 'arr.replaceAll()', payload });
    expect(select.state).toEqual({ arr: [4, 5, 6] });
  })

  it('should remove all elements', () => {
    const select = createStore({ name, state });
    select.arr
      .removeAll();
    expect(libState.currentAction).toEqual({ type: 'arr.removeAll()' });
    expect(select.state).toEqual({ arr: [] });
  })

  it('should increment all elements', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select.arr
      .incrementAll(payload);
    expect(libState.currentAction).toEqual({ type: 'arr.incrementAll()', payload });
    expect(select.state).toEqual({ arr: [2, 3, 4] });
  })

  it('should be able to insert one primitive', () => {
    const select = createStore({ name, state });
    const payload = 4;
    select.arr
      .insertOne(payload);
    expect(libState.currentAction).toEqual({ type: 'arr.insertOne()', payload });
    expect(select.state).toEqual({ arr: [1, 2, 3, 4] });
  })

  it('should be able to insert many primitives', () => {
    const select = createStore({ name, state });
    const payload = [4, 5, 6];
    select.arr
      .insertMany(payload);
    expect(libState.currentAction).toEqual({ type: 'arr.insertMany()', payload });
    expect(select.state).toEqual({ arr: [1, 2, 3, 4, 5, 6] });
  })

  it('should find an element and replace it', () => {
    const select = createStore({ name, state });
    const payload = 9;
    select.arr
      .find.eq(2)
      .replace(payload);
    expect(libState.currentAction).toEqual({ type: 'arr.find.eq(2).replace()', payload });
    expect(select.state).toEqual({ arr: [1, 9, 3] });
  })

  it('should find an element and remove it', () => {
    const select = createStore({ name, state });
    select.arr
      .find.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.find.eq(2).remove()' });
    expect(select.state).toEqual({ arr: [1, 3] });
  })

  it('should find an element and increment it', () => {
    const select = createStore({ name, state });
    const payload = 2;
    select.arr
      .find.eq(2)
      .increment(payload);
    expect(libState.currentAction).toEqual({ type: 'arr.find.eq(2).increment()', payload });
    expect(select.state).toEqual({ arr: [1, 4, 3] });
  })

  it('should find an element by one clause or another and replace it', () => {
    const select = createStore({ name, state });
    const payload = 9;
    select.arr
      .find.eq(1).or.eq(2)
      .replace(payload);
    expect(libState.currentAction).toEqual({ type: 'arr.find.eq(1).or.eq(2).replace()', payload });
    expect(select.state).toEqual({ arr: [9, 2, 3] });
  })

  it('should find an element by one clause or another and remove it', () => {
    const select = createStore({ name, state });
    select.arr
      .find.eq(1).or.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.find.eq(1).or.eq(2).remove()' });
    expect(select.state).toEqual({ arr: [2, 3] });
  })

  it('should find an element by one clause or another and increment it', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select.arr
      .find.eq(1).or.eq(2)
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'arr.find.eq(1).or.eq(2).increment()', payload });
    expect(select.state).toEqual({ arr: [2, 2, 3] });
  })

  it('should find an element by one clause and another and replace it', () => {
    const select = createStore({ name, state });
    const payload = 9;
    select.arr
      .find.gt(1).and.lt(3)
      .replace(payload);
    expect(libState.currentAction).toEqual({ type: 'arr.find.gt(1).and.lt(3).replace()', payload });
    expect(select.state).toEqual({ arr: [1, 9, 3] });
  })

  it('should find an element by one clause and another and remove it', () => {
    const select = createStore({ name, state });
    select.arr
      .find.gt(1).and.lt(3)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.find.gt(1).and.lt(3).remove()' });
    expect(select.state).toEqual({ arr: [1, 3] });
  })

  it('should find an element by one clause and another and increment it', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select.arr
      .find.eq(1).and.lt(2)
      .increment(payload);
    expect(libState.currentAction).toEqual({ type: 'arr.find.eq(1).and.lt(2).increment()', payload });
    expect(select.state).toEqual({ arr: [2, 2, 3] });
  })

  it('should filter elements and remove them', () => {
    const select = createStore({ name, state });
    select.arr
      .filter.gt(1)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.filter.gt(1).remove()' });
    expect(select.state).toEqual({ arr: [1] });
  })

  it('should filter elements and increment them', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select.arr
      .filter.gt(1)
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'arr.filter.gt(1).increment()', payload });
    expect(select.state).toEqual({ arr: [1, 3, 4] });
  })

  it('should filter elements by one clause or another and remove them', () => {
    const select = createStore({ name, state });
    select.arr
      .filter.eq(1).or.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.filter.eq(1).or.eq(2).remove()' });
    expect(select.state).toEqual({ arr: [3] });
  })

  it('should filter elements by one clause or another and increment them', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select.arr
      .filter.eq(1).or.eq(2)
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'arr.filter.eq(1).or.eq(2).increment()', payload });
    expect(select.state).toEqual({ arr: [2, 3, 3] });
  })

  it('should filter elements by one clause and another and remove them', () => {
    const select = createStore({ name, state });
    select.arr
      .filter.gt(0).and.lt(3)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.filter.gt(0).and.lt(3).remove()' });
    expect(select.state).toEqual({ arr: [3] });
  })

  it('should filter elements by one clause and another and increment them', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select.arr
      .filter.gt(0).and.gt(1)
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'arr.filter.gt(0).and.gt(1).increment()', payload });
    expect(select.state).toEqual({ arr: [1, 3, 4] });
  })

});

