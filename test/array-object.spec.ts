
import { createApplicationStore } from '../src/index';
import { libState } from '../src/constant';

describe('array-object', () => {

  const initialState = [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }];

  beforeEach(() => {
    libState.appStates = {};
    libState.logLevel = 'none';
  })

  it('should replace all elements', () => {
    const select = createApplicationStore(initialState);
    const payload = [{ id: 5, val: 5 }, { id: 6, val: 6 }, { id: 7, val: 7 }];
    select
      .replaceAll(payload);
    expect(libState.currentAction).toEqual({ type: 'replaceAll()', payload });
    expect(select.read()).toEqual(payload);
  })

  it('should remove all elements', () => {
    const select = createApplicationStore(initialState);
    select
      .removeAll();
    expect(libState.currentAction).toEqual({ type: 'removeAll()' });
    expect(select.read()).toEqual([]);
  })

  it('should replace all elements properties', () => {
    const select = createApplicationStore(initialState);
    const payload = 9;
    select.val
      .replaceAll(payload);
    expect(libState.currentAction).toEqual({ type: 'val.replaceAll()', payload });
    expect(select.read()).toEqual(initialState.map(s => ({ ...s, val: payload })));
  })

  it('should increment all elements properties', () => {
    const select = createApplicationStore(initialState);
    const payload = 1;
    select.val
      .incrementAll(payload);
    expect(libState.currentAction).toEqual({ type: 'val.incrementAll()', payload });
    expect(select.read()).toEqual([{ id: 1, val: 2 }, { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should be able to insert one element', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, val: 4 };
    select
      .insertOne(payload);
    expect(libState.currentAction).toEqual({ type: 'insertOne()', payload });
    expect(select.read()).toEqual([...initialState, payload]);
  })

  it('should be able to insert many elements', () => {
    const select = createApplicationStore(initialState);
    const payload = [{ id: 4, val: 4 }, { id: 5, val: 5 }];
    select
      .insertMany(payload);
    expect(libState.currentAction).toEqual({ type: 'insertMany()', payload });
    expect(select.read()).toEqual([...initialState, ...payload]);
  })

  it('should find an element and replace it', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, val: 4 };
    select
      .find.id.eq(2)
      .replace(payload);
    expect(libState.currentAction).toEqual({ type: 'find.id.eq(2).replace()', payload });
    expect(select.read()).toEqual([initialState[0], payload, initialState[2]]);
  })

  it('should find an element and remove it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.id.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'find.id.eq(2).remove()' });
    expect(select.read()).toEqual([initialState[0], initialState[2]]);
  })

  it('should find an element property and increment it', () => {
    const select = createApplicationStore(initialState);
    const payload = 2;
    select
      .find.id.eq(2).val
      .increment(payload);
    expect(libState.currentAction).toEqual({ type: 'find.id.eq(2).val.increment()', payload });
    expect(select.read()).toEqual([initialState[0], { id: 2, val: 4 }, initialState[2]]);
  })

  it('should find an element by one clause or another and replace it', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 9, val: 9 };
    select
      .find.id.eq(1).or.id.eq(2)
      .replace(payload);
    expect(libState.currentAction).toEqual({ type: 'find.id.eq(1).or.id.eq(2).replace()', payload });
    expect(select.read()).toEqual([payload, initialState[1], initialState[2]]);
  })

  it('should find an element by one clause or another and remove it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.id.eq(1).or.id.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'find.id.eq(1).or.id.eq(2).remove()' });
    expect(select.read()).toEqual([initialState[1], initialState[2]]);
  })

  it('should find an element by one clause or another and increment it', () => {
    const select = createApplicationStore(initialState);
    const payload = 1;
    select
      .find.id.eq(1).or.id.eq(2).val
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'find.id.eq(1).or.id.eq(2).val.increment()', payload });
    expect(select.read()).toEqual([{ id: 1, val: 2 }, initialState[1], initialState[2]]);
  })

  it('should find an element by one clause and another and replace it', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 9, val: 9 };
    select
      .find.id.gt(1).and.id.lt(3)
      .replace(payload);
    expect(libState.currentAction).toEqual({ type: 'find.id.gt(1).and.id.lt(3).replace()', payload });
    expect(select.read()).toEqual([initialState[0], { id: 9, val: 9 }, initialState[2]]);
  })

  it('should find an element by one clause and another and remove it', () => {
    const select = createApplicationStore(initialState);
    select
      .find.id.gt(1).and.id.lt(3)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'find.id.gt(1).and.id.lt(3).remove()' });
    expect(select.read()).toEqual([initialState[0], initialState[2]]);
  })

  it('should find an element by one clause and another and increment it', () => {
    const select = createApplicationStore(initialState);
    const payload = 1;
    select
      .find.id.eq(1).and.id.lt(2).val
      .increment(payload);
    expect(libState.currentAction).toEqual({ type: 'find.id.eq(1).and.id.lt(2).val.increment()', payload });
    expect(select.read()).toEqual([{ id: 1, val: 2 }, initialState[1], initialState[2]]);
  })

  it('should filter elements and remove them', () => {
    const select = createApplicationStore(initialState);
    select
      .filter.id.gt(1)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'filter.id.gt(1).remove()' });
    expect(select.read()).toEqual([initialState[0]]);
  })

  it('should filter elements and increment them', () => {
    const select = createApplicationStore(initialState);
    const payload = 1;
    select
      .filter.id.gt(1).val
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'filter.id.gt(1).val.increment()', payload });
    expect(select.read()).toEqual([initialState[0], { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should filter elements by one clause or another and remove them', () => {
    const select = createApplicationStore(initialState);
    select
      .filter.id.eq(1).or.id.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'filter.id.eq(1).or.id.eq(2).remove()' });
    expect(select.read()).toEqual([initialState[2]]);
  })

  it('should filter elements by one clause or another and increment them', () => {
    const select = createApplicationStore(initialState);
    const payload = 1;
    select
      .filter.id.eq(1).or.id.eq(2).val
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'filter.id.eq(1).or.id.eq(2).val.increment()', payload });
    expect(select.read()).toEqual([{ id: 1, val: 2 }, { id: 2, val: 3 }, initialState[2]]);
  })

  it('should filter elements by one clause and another and remove them', () => {
    const select = createApplicationStore(initialState);
    select
      .filter.id.gt(0).and.id.lt(3)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'filter.id.gt(0).and.id.lt(3).remove()' });
    expect(select.read()).toEqual([initialState[2]]);
  })

  it('should filter elements by one clause and another and increment them', () => {
    const select = createApplicationStore(initialState);
    const payload = 1;
    select
      .filter.id.gt(0).and.id.gt(1).val
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'filter.id.gt(0).and.id.gt(1).val.increment()', payload });
    expect(select.read()).toEqual([initialState[0], { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should upsert one array element where a match could be found', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 1, val: 5 };
    select
      .upsertMatching.id
      .withOne(payload);
    expect(libState.currentAction).toEqual({ type: 'upsertMatching.id.withOne()', payload });
    expect(select.read()).toEqual([payload, initialState[1], initialState[2]]);
  })

  it('should upsert one array element where a match could not be found', () => {
    const select = createApplicationStore(initialState);
    const payload = { id: 4, val: 5 };
    select
      .upsertMatching.id
      .withOne(payload);
    expect(libState.currentAction).toEqual({ type: 'upsertMatching.id.withOne()', payload });
    expect(select.read()).toEqual([...initialState, payload]);
  })

  it('should upsert array elements where one matches and another does not', () => {
    const select = createApplicationStore(initialState);
    const payload = [{ id: 1, val: 5 }, { id: 5, val: 5 }];
    select
      .upsertMatching.id
      .withMany(payload);
    expect(libState.currentAction).toEqual({ type: 'upsertMatching.id.withMany()', payload });
    expect(select.read()).toEqual([payload[0], initialState[1], initialState[2], payload[1]]);
  })

});

