import { createStore } from '../src';
import { libState, testState } from '../src/constant';
import { currentAction } from './_utility';


describe('array-object-deep', () => {

  const name = 'AppStore';
  const state = { arr: [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }] };

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should replace all elements', () => {
    const select = createStore({ name, state });
    const payload = [{ id: 5, val: 5 }, { id: 6, val: 6 }, { id: 7, val: 7 }];
    select.arr
      .replaceAll(payload);
    expect(currentAction(select)).toEqual({ type: 'arr.replaceAll()', payload });
    expect(select.arr.state).toEqual(payload);
  })

  it('should remove all elements', () => {
    const select = createStore({ name, state });
    select.arr
      .removeAll();
    expect(currentAction(select)).toEqual({ type: 'arr.removeAll()' });
    expect(select.arr.state).toEqual([]);
  })

  it('should replace all elements properties', () => {
    const select = createStore({ name, state });
    const payload = 9;
    select.arr.val
      .replaceAll(payload);
    expect(currentAction(select)).toEqual({ type: 'arr.val.replaceAll()', payload });
    expect(select.arr.state).toEqual(state.arr.map(s => ({ ...s, val: payload })));
  })

  it('should increment all elements properties', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select.arr.val
      .incrementAll(payload);
    expect(currentAction(select)).toEqual({ type: 'arr.val.incrementAll()', payload });
    expect(select.arr.state).toEqual([{ id: 1, val: 2 }, { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should be able to insert one element', () => {
    const select = createStore({ name, state });
    const payload = { id: 4, val: 4 };
    select.arr
      .insertOne(payload);
    expect(currentAction(select)).toEqual({ type: 'arr.insertOne()', payload });
    expect(select.arr.state).toEqual([...state.arr, payload]);
  })

  it('should be able to insert many elements', () => {
    const select = createStore({ name, state });
    const payload = [{ id: 4, val: 4 }, { id: 5, val: 5 }];
    select.arr
      .insertMany(payload);
    expect(currentAction(select)).toEqual({ type: 'arr.insertMany()', payload });
    expect(select.arr.state).toEqual([...state.arr, ...payload]);
  })

  it('should find an element and replace it', () => {
    const select = createStore({ name, state });
    const payload = { id: 4, val: 4 };
    select.arr
      .find.id.eq(2)
      .replace(payload);
    expect(currentAction(select)).toEqual({ type: 'arr.find.id.eq(2).replace()', payload });
    expect(select.arr.state).toEqual([state.arr[0], payload, state.arr[2]]);
  })

  it('should find an element and remove it', () => {
    const select = createStore({ name, state });
    select.arr
      .find.id.eq(2)
      .remove();
    expect(currentAction(select)).toEqual({ type: 'arr.find.id.eq(2).remove()' });
    expect(select.arr.state).toEqual([state.arr[0], state.arr[2]]);
  })

  it('should find an element property and increment it', () => {
    const select = createStore({ name, state });
    const payload = 2;
    select.arr
      .find.id.eq(2).val
      .increment(payload);
    expect(currentAction(select)).toEqual({ type: 'arr.find.id.eq(2).val.increment()', payload });
    expect(select.arr.state).toEqual([state.arr[0], { id: 2, val: 4 }, state.arr[2]]);
  })

  it('should find an element by one clause or another and replace it', () => {
    const select = createStore({ name, state });
    const payload = { id: 9, val: 9 };
    select.arr
      .find.id.eq(1).or.id.eq(2)
      .replace(payload);
    expect(currentAction(select)).toEqual({ type: 'arr.find.id.eq(1).or.id.eq(2).replace()', payload });
    expect(select.arr.state).toEqual([payload, state.arr[1], state.arr[2]]);
  })

  it('should find an element by one clause or another and remove it', () => {
    const select = createStore({ name, state });
    select.arr
      .find.id.eq(1).or.id.eq(2)
      .remove();
    expect(currentAction(select)).toEqual({ type: 'arr.find.id.eq(1).or.id.eq(2).remove()' });
    expect(select.arr.state).toEqual([state.arr[1], state.arr[2]]);
  })

  it('should find an element by one clause or another and increment it', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select.arr
      .find.id.eq(1).or.id.eq(2).val
      .increment(1);
    expect(currentAction(select)).toEqual({ type: 'arr.find.id.eq(1).or.id.eq(2).val.increment()', payload });
    expect(select.arr.state).toEqual([{ id: 1, val: 2 }, state.arr[1], state.arr[2]]);
  })

  it('should find an element by one clause and another and replace it', () => {
    const select = createStore({ name, state });
    const payload = { id: 9, val: 9 };
    select.arr
      .find.id.gt(1).and.id.lt(3)
      .replace(payload);
    expect(currentAction(select)).toEqual({ type: 'arr.find.id.gt(1).and.id.lt(3).replace()', payload });
    expect(select.arr.state).toEqual([state.arr[0], { id: 9, val: 9 }, state.arr[2]]);
  })

  it('should find an element by one clause and another and remove it', () => {
    const select = createStore({ name, state });
    select.arr
      .find.id.gt(1).and.id.lt(3)
      .remove();
    expect(currentAction(select)).toEqual({ type: 'arr.find.id.gt(1).and.id.lt(3).remove()' });
    expect(select.arr.state).toEqual([state.arr[0], state.arr[2]]);
  })

  it('should find an element by one clause and another and increment it', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select.arr
      .find.id.eq(1).and.id.lt(2).val
      .increment(payload);
    expect(currentAction(select)).toEqual({ type: 'arr.find.id.eq(1).and.id.lt(2).val.increment()', payload });
    expect(select.arr.state).toEqual([{ id: 1, val: 2 }, state.arr[1], state.arr[2]]);
  })

  it('should filter elements and remove them', () => {
    const select = createStore({ name, state });
    select.arr
      .filter.id.gt(1)
      .remove();
    expect(currentAction(select)).toEqual({ type: 'arr.filter.id.gt(1).remove()' });
    expect(select.arr.state).toEqual([state.arr[0]]);
  })

  it('should filter elements and increment them', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select.arr
      .filter.id.gt(1).val
      .increment(1);
    expect(currentAction(select)).toEqual({ type: 'arr.filter.id.gt(1).val.increment()', payload });
    expect(select.arr.state).toEqual([state.arr[0], { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should filter elements by one clause or another and remove them', () => {
    const select = createStore({ name, state });
    select.arr
      .filter.id.eq(1).or.id.eq(2)
      .remove();
    expect(currentAction(select)).toEqual({ type: 'arr.filter.id.eq(1).or.id.eq(2).remove()' });
    expect(select.arr.state).toEqual([state.arr[2]]);
  })

  it('should filter elements by one clause or another and increment them', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select.arr
      .filter.id.eq(1).or.id.eq(2).val
      .increment(1);
    expect(currentAction(select)).toEqual({ type: 'arr.filter.id.eq(1).or.id.eq(2).val.increment()', payload });
    expect(select.arr.state).toEqual([{ id: 1, val: 2 }, { id: 2, val: 3 }, state.arr[2]]);
  })

  it('should filter elements by one clause and another and remove them', () => {
    const select = createStore({ name, state });
    select.arr
      .filter.id.gt(0).and.id.lt(3)
      .remove();
    expect(currentAction(select)).toEqual({ type: 'arr.filter.id.gt(0).and.id.lt(3).remove()' });
    expect(select.arr.state).toEqual([state.arr[2]]);
  })

  it('should filter elements by one clause and another and increment them', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select.arr
      .filter.id.gt(0).and.id.gt(1).val
      .increment(1);
    expect(currentAction(select)).toEqual({ type: 'arr.filter.id.gt(0).and.id.gt(1).val.increment()', payload });
    expect(select.arr.state).toEqual([state.arr[0], { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should upsert one array element where a match could be found', () => {
    const select = createStore({ name, state });
    const payload = { id: 1, val: 5 };
    select.arr
      .upsertMatching.id
      .withOne(payload);
    expect(currentAction(select)).toEqual({ type: 'arr.upsertMatching.id.withOne()', payload });
    expect(select.arr.state).toEqual([payload, state.arr[1], state.arr[2]]);
  })

  it('should upsert one array element where a match could not be found', () => {
    const select = createStore({ name, state });
    const payload = { id: 4, val: 5 };
    select.arr
      .upsertMatching.id
      .withOne(payload);
    expect(currentAction(select)).toEqual({ type: 'arr.upsertMatching.id.withOne()', payload });
    expect(select.arr.state).toEqual([...state.arr, payload]);
  })

  it('should upsert array elements where one matches and another does not', () => {
    const select = createStore({ name, state });
    const payload = [{ id: 1, val: 5 }, { id: 5, val: 5 }];
    select.arr
      .upsertMatching.id
      .withMany(payload);
    expect(currentAction(select)).toEqual({ type: 'arr.upsertMatching.id.withMany()', payload });
    expect(select.arr.state).toEqual([payload[0], state.arr[1], state.arr[2], payload[1]]);
  })

});

