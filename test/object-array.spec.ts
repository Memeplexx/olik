
import { createApplicationStore, libState, testState } from '../src/index';
import { DeepReadonlyArray, Store } from '../src/types';

describe('Object array', () => {

  const initialState = { arr: [{ id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 }] };

  beforeEach(() => {
    libState.appStates = {};
    testState.logLevel = 'none';
  })

  it('should replace all elements', () => {
    const select = createApplicationStore(initialState);
    const replacement = [{ id: 5, val: 5 }, { id: 6, val: 6 }, { id: 7, val: 7 }];
    select.arr
      .replaceAll(replacement);
    expect(libState.currentAction).toEqual({ type: 'arr.replaceAll()', replacement });
    expect(select.arr.read()).toEqual(replacement);
  })

  it('should remove all elements', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .removeAll();
    expect(libState.currentAction).toEqual({ type: 'arr.removeAll()' });
    expect(select.arr.read()).toEqual([]);
  })

  it('should replace all elements properties', () => {
    const select = createApplicationStore(initialState);
    const replacement = 9;
    select.arr.val
      .replaceAll(replacement);
    expect(libState.currentAction).toEqual({ type: 'arr.val.replaceAll()', replacement });
    expect(select.arr.read()).toEqual(initialState.arr.map(s => ({ ...s, val: replacement })));
  })

  it('should increment all elements properties', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select.arr.val
      .incrementAll(by);
    expect(libState.currentAction).toEqual({ type: 'arr.val.incrementAll()', by });
    expect(select.arr.read()).toEqual([{ id: 1, val: 2 }, { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should be able to insert one element', () => {
    const select = createApplicationStore(initialState);
    const toInsert = { id: 4, val: 4 };
    select.arr
      .insertOne(toInsert);
    expect(libState.currentAction).toEqual({ type: 'arr.insertOne()', toInsert });
    expect(select.arr.read()).toEqual([...initialState.arr, toInsert]);
  })

  it('should be able to insert many elements', () => {
    const select = createApplicationStore(initialState);
    const toInsert = [{ id: 4, val: 4 }, { id: 5, val: 5 }];
    select.arr
      .insertMany(toInsert);
    expect(libState.currentAction).toEqual({ type: 'arr.insertMany()', toInsert });
    expect(select.arr.read()).toEqual([...initialState.arr, ...toInsert]);
  })

  it('should find an element and replace it', () => {
    const select = createApplicationStore(initialState);
    const replacement = { id: 4, val: 4 };
    select.arr
      .find.id.eq(2)
      .replace(replacement);
    expect(libState.currentAction).toEqual({ type: 'arr.find.id.eq(2).replace()', replacement });
    expect(select.arr.read()).toEqual([initialState.arr[0], replacement, initialState.arr[2]]);
  })

  it('should find an element and remove it', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .find.id.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.find.id.eq(2).remove()' });
    expect(select.arr.read()).toEqual([initialState.arr[0], initialState.arr[2]]);
  })

  it('should find an element property and increment it', () => {
    const select = createApplicationStore(initialState);
    const by = 2;
    select.arr
      .find.id.eq(2).val
      .increment(by);
    expect(libState.currentAction).toEqual({ type: 'arr.find.id.eq(2).val.increment()', by });
    expect(select.arr.read()).toEqual([initialState.arr[0], { id: 2, val: 4 }, initialState.arr[2]]);
  })

  it('should find an element by one clause or another and replace it', () => {
    const select = createApplicationStore(initialState);
    const replacement = { id: 9, val: 9 };
    select.arr
      .find.id.eq(1).or.id.eq(2)
      .replace(replacement);
    expect(libState.currentAction).toEqual({ type: 'arr.find.id.eq(1).or.id.eq(2).replace()', replacement });
    expect(select.arr.read()).toEqual([replacement, initialState.arr[1], initialState.arr[2]]);
  })

  it('should find an element by one clause or another and remove it', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .find.id.eq(1).or.id.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.find.id.eq(1).or.id.eq(2).remove()' });
    expect(select.arr.read()).toEqual([initialState.arr[1], initialState.arr[2]]);
  })

  it('should find an element by one clause or another and increment it', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select.arr
      .find.id.eq(1).or.id.eq(2).val
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'arr.find.id.eq(1).or.id.eq(2).val.increment()', by });
    expect(select.arr.read()).toEqual([{ id: 1, val: 2 }, initialState.arr[1], initialState.arr[2]]);
  })

  it('should find an element by one clause and another and replace it', () => {
    const select = createApplicationStore(initialState);
    const replacement = { id: 9, val: 9 };
    select.arr
      .find.id.gt(1).and.id.lt(3)
      .replace(replacement);
    expect(libState.currentAction).toEqual({ type: 'arr.find.id.gt(1).and.id.lt(3).replace()', replacement });
    expect(select.arr.read()).toEqual([initialState.arr[0], { id: 9, val: 9 }, initialState.arr[2]]);
  })

  it('should find an element by one clause and another and remove it', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .find.id.gt(1).and.id.lt(3)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.find.id.gt(1).and.id.lt(3).remove()' });
    expect(select.arr.read()).toEqual([initialState.arr[0], initialState.arr[2]]);
  })

  it('should find an element by one clause and another and increment it', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select.arr
      .find.id.eq(1).and.id.lt(2).val
      .increment(by);
    expect(libState.currentAction).toEqual({ type: 'arr.find.id.eq(1).and.id.lt(2).val.increment()', by });
    expect(select.arr.read()).toEqual([{ id: 1, val: 2 }, initialState.arr[1], initialState.arr[2]]);
  })

  it('should filter elements and remove them', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .filter.id.gt(1)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.filter.id.gt(1).remove()' });
    expect(select.arr.read()).toEqual([initialState.arr[0]]);
  })

  it('should filter elements and increment them', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select.arr
      .filter.id.gt(1).val
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'arr.filter.id.gt(1).val.increment()', by });
    expect(select.arr.read()).toEqual([initialState.arr[0], { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should filter elements by one clause or another and remove them', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .filter.id.eq(1).or.id.eq(2)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.filter.id.eq(1).or.id.eq(2).remove()' });
    expect(select.arr.read()).toEqual([initialState.arr[2]]);
  })

  it('should filter elements by one clause or another and increment them', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select.arr
      .filter.id.eq(1).or.id.eq(2).val
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'arr.filter.id.eq(1).or.id.eq(2).val.increment()', by });
    expect(select.arr.read()).toEqual([{ id: 1, val: 2 }, { id: 2, val: 3 }, initialState.arr[2]]);
  })

  it('should filter elements by one clause and another and remove them', () => {
    const select = createApplicationStore(initialState);
    select.arr
      .filter.id.gt(0).and.id.lt(3)
      .remove();
    expect(libState.currentAction).toEqual({ type: 'arr.filter.id.gt(0).and.id.lt(3).remove()' });
    expect(select.arr.read()).toEqual([initialState.arr[2]]);
  })

  it('should filter elements by one clause and another and increment them', () => {
    const select = createApplicationStore(initialState);
    const by = 1;
    select.arr
      .filter.id.gt(0).and.id.gt(1).val
      .increment(1);
    expect(libState.currentAction).toEqual({ type: 'arr.filter.id.gt(0).and.id.gt(1).val.increment()', by });
    expect(select.arr.read()).toEqual([initialState.arr[0], { id: 2, val: 3 }, { id: 3, val: 4 }]);
  })

  it('should upsert one array element where a match could be found', () => {
    const select = createApplicationStore(initialState);
    const withOne = { id: 1, val: 5 };
    select.arr
      .upsertMatching.id
      .withOne(withOne);
    expect(libState.currentAction).toEqual({ type: 'arr.upsertMatching.id.withOne()', withOne });
    expect(select.arr.read()).toEqual([withOne, initialState.arr[1], initialState.arr[2]]);
  })

  it('should upsert one array element where a match could not be found', () => {
    const select = createApplicationStore(initialState);
    const withOne = { id: 4, val: 5 };
    select.arr
      .upsertMatching.id
      .withOne(withOne);
    expect(libState.currentAction).toEqual({ type: 'arr.upsertMatching.id.withOne()', withOne });
    expect(select.arr.read()).toEqual([...initialState.arr, withOne]);
  })

  it('should upsert array elements where one matches and another does not', () => {
    const select = createApplicationStore(initialState);
    const withMany = [{ id: 1, val: 5 }, { id: 5, val: 5 }];
    select.arr
      .upsertMatching.id
      .withMany(withMany);
    expect(libState.currentAction).toEqual({ type: 'arr.upsertMatching.id.withMany()', withMany });
    expect(select.arr.read()).toEqual([withMany[0], initialState.arr[1], initialState.arr[2], withMany[1]]);
  })

});

