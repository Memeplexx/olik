import { testState } from '../src/constant';
import { createStore } from '../src/core';
import { currentAction } from './_utility';


describe('array-object', () => {

  const name = 'AppStore';
  const state = [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }];

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should replace all elements', () => {
    const store = createStore({ name, state });
    const payload = [{ id: 5, val: 5 }, { id: 6, val: 6 }, { id: 7, val: 7 }];
    store
      .$replaceAll(payload);
    expect(currentAction(store)).toEqual({ type: 'replaceAll()', payload });
    expect(store.$state).toEqual(payload);
  })

  it('should remove all elements', () => {
    const store = createStore({ name, state });
    store
      .$removeAll();
    expect(currentAction(store)).toEqual({ type: 'removeAll()' });
    expect(store.$state).toEqual([]);
  })

  it('should replace all elements properties', () => {
    const store = createStore({ name, state });
    const payload = 9;
    store.val
      .$replaceAll(payload);
    expect(currentAction(store)).toEqual({ type: 'val.replaceAll()', payload });
    expect(store.$state).toEqual(state.map(s => ({ ...s, val: payload })));
  })

  it('should increment all elements properties', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store.val
      .$incrementAll(payload);
    expect(currentAction(store)).toEqual({ type: 'val.incrementAll()', payload });
    expect(store.$state).toEqual([{ id: 1, val: 2 }, { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should be able to insert one element', () => {
    const store = createStore({ name, state });
    const payload = { id: 4, val: 4 };
    store
      .$insertOne(payload);
    expect(currentAction(store)).toEqual({ type: 'insertOne()', payload });
    expect(store.$state).toEqual([...state, payload]);
  })

  it('should be able to insert many elements', () => {
    const store = createStore({ name, state });
    const payload = [{ id: 4, val: 4 }, { id: 5, val: 5 }];
    store
      .$insertMany(payload);
    expect(currentAction(store)).toEqual({ type: 'insertMany()', payload });
    expect(store.$state).toEqual([...state, ...payload]);
  })

  it('should find an element and replace it', () => {
    const store = createStore({ name, state });
    const payload = { id: 4, val: 4 };
    store
      .$find.id.$eq(2)
      .$replace(payload);
    expect(currentAction(store)).toEqual({ type: 'find.id.eq(2).replace()', payload });
    expect(store.$state).toEqual([state[0], payload, state[2]]);
  })

  it('should find an element and remove it', () => {
    const store = createStore({ name, state });
    store
      .$find.id.$eq(2)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'find.id.eq(2).remove()' });
    expect(store.$state).toEqual([state[0], state[2]]);
  })

  it('should find an element property and increment it', () => {
    const store = createStore({ name, state });
    const payload = 2;
    store
      .$find.id.$eq(2).val
      .$increment(payload);
    expect(currentAction(store)).toEqual({ type: 'find.id.eq(2).val.increment()', payload });
    expect(store.$state).toEqual([state[0], { id: 2, val: 4 }, state[2]]);
  })

  it('should find an element by one clause or another and replace it', () => {
    const store = createStore({ name, state });
    const payload = { id: 9, val: 9 };
    store
      .$find.id.$eq(1).$or.id.$eq(2)
      .$replace(payload);
    expect(currentAction(store)).toEqual({ type: 'find.id.eq(1).or.id.eq(2).replace()', payload });
    expect(store.$state).toEqual([payload, state[1], state[2]]);
  })

  it('should find an element by one clause or another and remove it', () => {
    const store = createStore({ name, state });
    store
      .$find.id.$eq(1).$or.id.$eq(2)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'find.id.eq(1).or.id.eq(2).remove()' });
    expect(store.$state).toEqual([state[1], state[2]]);
  })

  it('should find an element by one clause or another and increment it', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store
      .$find.id.$eq(1).$or.id.$eq(2).val
      .$increment(1);
    expect(currentAction(store)).toEqual({ type: 'find.id.eq(1).or.id.eq(2).val.increment()', payload });
    expect(store.$state).toEqual([{ id: 1, val: 2 }, state[1], state[2]]);
  })

  it('should find an element by one clause and another and replace it', () => {
    const store = createStore({ name, state });
    const payload = { id: 9, val: 9 };
    store
      .$find.id.$gt(1).$and.id.$lt(3)
      .$replace(payload);
    expect(currentAction(store)).toEqual({ type: 'find.id.gt(1).and.id.lt(3).replace()', payload });
    expect(store.$state).toEqual([state[0], { id: 9, val: 9 }, state[2]]);
  })

  it('should find an element by one clause and another and remove it', () => {
    const store = createStore({ name, state });
    store
      .$find.id.$gt(1).$and.id.$lt(3)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'find.id.gt(1).and.id.lt(3).remove()' });
    expect(store.$state).toEqual([state[0], state[2]]);
  })

  it('should find an element by one clause and another and increment it', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store
      .$find.id.$eq(1).$and.id.$lt(2).val
      .$increment(payload);
    expect(currentAction(store)).toEqual({ type: 'find.id.eq(1).and.id.lt(2).val.increment()', payload });
    expect(store.$state).toEqual([{ id: 1, val: 2 }, state[1], state[2]]);
  })

  it('should filter elements and remove them', () => {
    const store = createStore({ name, state });
    store
      .$filter.id.$gt(1)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'filter.id.gt(1).remove()' });
    expect(store.$state).toEqual([state[0]]);
  })

  it('should filter elements and increment them', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store
      .$filter.id.$gt(1).val
      .$increment(1);
    expect(currentAction(store)).toEqual({ type: 'filter.id.gt(1).val.increment()', payload });
    expect(store.$state).toEqual([state[0], { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should filter elements by one clause or another and remove them', () => {
    const store = createStore({ name, state });
    store
      .$filter.id.$eq(1).$or.id.$eq(2)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'filter.id.eq(1).or.id.eq(2).remove()' });
    expect(store.$state).toEqual([state[2]]);
  })

  it('should filter elements by one clause or another and increment them', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store
      .$filter.id.$eq(1).$or.id.$eq(2).val
      .$increment(1);
    expect(currentAction(store)).toEqual({ type: 'filter.id.eq(1).or.id.eq(2).val.increment()', payload });
    expect(store.$state).toEqual([{ id: 1, val: 2 }, { id: 2, val: 3 }, state[2]]);
  })

  it('should filter elements by one clause and another and remove them', () => {
    const store = createStore({ name, state });
    store
      .$filter.id.$gt(0).$and.id.$lt(3)
      .$remove();
    expect(currentAction(store)).toEqual({ type: 'filter.id.gt(0).and.id.lt(3).remove()' });
    expect(store.$state).toEqual([state[2]]);
  })

  it('should filter elements by one clause and another and increment them', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store
      .$filter.id.$gt(0).$and.id.$gt(1).val
      .$increment(1);
    expect(currentAction(store)).toEqual({ type: 'filter.id.gt(0).and.id.gt(1).val.increment()', payload });
    expect(store.$state).toEqual([state[0], { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should upsert one array element where a match could be found', () => {
    const store = createStore({ name, state });
    const payload = { id: 1, val: 5 };
    store
      .$upsertMatching.id
      .$withOne(payload);
    expect(currentAction(store)).toEqual({ type: 'upsertMatching.id.withOne()', payload });
    expect(store.$state).toEqual([payload, state[1], state[2]]);
  })

  it('should upsert one array element where a match could not be found', () => {
    const store = createStore({ name, state });
    const payload = { id: 4, val: 5 };
    store
      .$upsertMatching.id
      .$withOne(payload);
    expect(currentAction(store)).toEqual({ type: 'upsertMatching.id.withOne()', payload });
    expect(store.$state).toEqual([...state, payload]);
  })

  it('should upsert array elements where one matches and another does not', () => {
    const store = createStore({ name, state });
    const payload = [{ id: 1, val: 5 }, { id: 5, val: 5 }];
    store
      .$upsertMatching.id
      .$withMany(payload);
    expect(currentAction(store)).toEqual({ type: 'upsertMatching.id.withMany()', payload });
    expect(store.$state).toEqual([payload[0], state[1], state[2], payload[1]]);
  })

});

