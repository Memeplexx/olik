import { testState } from '../src/constant';
import { createStore } from '../src/core';
import { currentAction } from './_utility';


describe('array-object-deep', () => {

  const name = 'AppStore';
  const state = { arr: [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }] };

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should replace all elements', () => {
    const store = createStore({ name, state });
    const payload = [{ id: 5, val: 5 }, { id: 6, val: 6 }, { id: 7, val: 7 }];
    store.arr
      .$replace(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.replace()', payload });
    expect(store.arr.$state).toEqual(payload);
  })

  it('should remove all elements', () => {
    const store = createStore({ name, state });
    store.arr
      .$clear();
    expect(currentAction(store)).toEqual({ type: 'arr.clear()' });
    expect(store.arr.$state).toEqual([]);
  })

  it('should replace all elements properties', () => {
    const store = createStore({ name, state });
    const payload = 9;
    store.arr.val
      .$replace(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.val.replace()', payload });
    expect(store.arr.$state).toEqual(state.arr.map(s => ({ ...s, val: payload })));
  })

  it('should increment all elements properties', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store.arr.val
      .$increment(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.val.increment()', payload });
    expect(store.arr.$state).toEqual([{ id: 1, val: 2 }, { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should be able to insert one element', () => {
    const store = createStore({ name, state });
    const payload = { id: 4, val: 4 };
    store.arr
      .$insertOne(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.insertOne()', payload });
    expect(store.arr.$state).toEqual([...state.arr, payload]);
  })

  it('should be able to insert many elements', () => {
    const store = createStore({ name, state });
    const payload = [{ id: 4, val: 4 }, { id: 5, val: 5 }];
    store.arr
      .$insertMany(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.insertMany()', payload });
    expect(store.arr.$state).toEqual([...state.arr, ...payload]);
  })

  it('should find an element and replace it', () => {
    const store = createStore({ name, state });
    const payload = { id: 4, val: 4 };
    store.arr
      .$find.id.$eq(2)
      .$replace(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.find.id.eq(2).replace()', payload });
    expect(store.arr.$state).toEqual([state.arr[0], payload, state.arr[2]]);
  })

  it('should find an element and remove it', () => {
    const store = createStore({ name, state });
    store.arr
      .$find.id.$eq(2)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'arr.find.id.eq(2).remove()' });
    expect(store.arr.$state).toEqual([state.arr[0], state.arr[2]]);
  })

  it('should find an element property and increment it', () => {
    const store = createStore({ name, state });
    const payload = 2;
    store.arr
      .$find.id.$eq(2).val
      .$increment(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.find.id.eq(2).val.increment()', payload });
    expect(store.arr.$state).toEqual([state.arr[0], { id: 2, val: 4 }, state.arr[2]]);
  })

  it('should find an element by one clause or another and replace it', () => {
    const store = createStore({ name, state });
    const payload = { id: 9, val: 9 };
    store.arr
      .$find.id.$eq(1).$or.id.$eq(2)
      .$replace(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.find.id.eq(1).or.id.eq(2).replace()', payload });
    expect(store.arr.$state).toEqual([payload, state.arr[1], state.arr[2]]);
  })

  it('should find an element by one clause or another and remove it', () => {
    const store = createStore({ name, state });
    store.arr
      .$find.id.$eq(1).$or.id.$eq(2)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'arr.find.id.eq(1).or.id.eq(2).remove()' });
    expect(store.arr.$state).toEqual([state.arr[1], state.arr[2]]);
  })

  it('should find an element by one clause or another and increment it', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store.arr
      .$find.id.$eq(1).$or.id.$eq(2).val
      .$increment(1);
    expect(currentAction(store)).toEqual({ type: 'arr.find.id.eq(1).or.id.eq(2).val.increment()', payload });
    expect(store.arr.$state).toEqual([{ id: 1, val: 2 }, state.arr[1], state.arr[2]]);
  })

  it('should find an element by one clause and another and replace it', () => {
    const store = createStore({ name, state });
    const payload = { id: 9, val: 9 };
    store.arr
      .$find.id.$gt(1).$and.id.$lt(3)
      .$replace(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.find.id.gt(1).and.id.lt(3).replace()', payload });
    expect(store.arr.$state).toEqual([state.arr[0], { id: 9, val: 9 }, state.arr[2]]);
  })

  it('should find an element by one clause and another and remove it', () => {
    const store = createStore({ name, state });
    store.arr
      .$find.id.$gt(1).$and.id.$lt(3)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'arr.find.id.gt(1).and.id.lt(3).remove()' });
    expect(store.arr.$state).toEqual([state.arr[0], state.arr[2]]);
  })

  it('should find an element by one clause and another and increment it', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store.arr
      .$find.id.$eq(1).$and.id.$lt(2).val
      .$increment(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.find.id.eq(1).and.id.lt(2).val.increment()', payload });
    expect(store.arr.$state).toEqual([{ id: 1, val: 2 }, state.arr[1], state.arr[2]]);
  })

  it('should filter elements and remove them', () => {
    const store = createStore({ name, state });
    store.arr
      .$filter.id.$gt(1)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'arr.filter.id.gt(1).remove()' });
    expect(store.arr.$state).toEqual([state.arr[0]]);
  })

  it('should filter elements and increment them', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store.arr
      .$filter.id.$gt(1).val
      .$increment(1);
    expect(currentAction(store)).toEqual({ type: 'arr.filter.id.gt(1).val.increment()', payload });
    expect(store.arr.$state).toEqual([state.arr[0], { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should filter elements by one clause or another and remove them', () => {
    const store = createStore({ name, state });
    store.arr
      .$filter.id.$eq(1).$or.id.$eq(2)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'arr.filter.id.eq(1).or.id.eq(2).remove()' });
    expect(store.arr.$state).toEqual([state.arr[2]]);
  })

  it('should filter elements by one clause or another and increment them', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store.arr
      .$filter.id.$eq(1).$or.id.$eq(2).val
      .$increment(1);
    expect(currentAction(store)).toEqual({ type: 'arr.filter.id.eq(1).or.id.eq(2).val.increment()', payload });
    expect(store.arr.$state).toEqual([{ id: 1, val: 2 }, { id: 2, val: 3 }, state.arr[2]]);
  })

  it('should filter elements by one clause and another and remove them', () => {
    const store = createStore({ name, state });
    store.arr
      .$filter.id.$gt(0).$and.id.$lt(3)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'arr.filter.id.gt(0).and.id.lt(3).remove()' });
    expect(store.arr.$state).toEqual([state.arr[2]]);
  })

  it('should filter elements by one clause and another and increment them', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store.arr
      .$filter.id.$gt(0).$and.id.$gt(1).val
      .$increment(1);
    expect(currentAction(store)).toEqual({ type: 'arr.filter.id.gt(0).and.id.gt(1).val.increment()', payload });
    expect(store.arr.$state).toEqual([state.arr[0], { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should upsert one array element where a match could be found', () => {
    const store = createStore({ name, state });
    const payload = { id: 1, val: 5 };
    store.arr
      .$upsertMatching.id
      .$withOne(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.upsertMatching.id.withOne()', payload });
    expect(store.arr.$state).toEqual([payload, state.arr[1], state.arr[2]]);
  })

  it('should upsert one array element where a match could not be found', () => {
    const store = createStore({ name, state });
    const payload = { id: 4, val: 5 };
    store.arr
      .$upsertMatching.id
      .$withOne(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.upsertMatching.id.withOne()', payload });
    expect(store.arr.$state).toEqual([...state.arr, payload]);
  })

  it('should upsert array elements where one matches and another does not', () => {
    const store = createStore({ name, state });
    const payload = [{ id: 1, val: 5 }, { id: 5, val: 5 }];
    store.arr
      .$upsertMatching.id
      .$withMany(payload);
    expect(currentAction(store)).toEqual({ type: 'arr.upsertMatching.id.withMany()', payload });
    expect(store.arr.$state).toEqual([payload[0], state.arr[1], state.arr[2], payload[1]]);
  })

});

