import { createStore, mergeStoreIfPossible } from '../src';
import { errorMessages, libState, testState } from '../src/constant';

describe('merge', () => {

  const nameOfExistingStore = 'AppStore';
  const nameOfStoreToMerge = 'MergeStore';

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should allow basic merges', () => {
    const state1 = { one: '', two: '' };
    const state2 = { three: '', four: '' };
    const select1 = createStore({ name: nameOfExistingStore, state: state1 });
    const select2 = createStore({ name: nameOfStoreToMerge, state: state2 });
    mergeStoreIfPossible(select2, nameOfExistingStore);
    expect(select1.state).toEqual({...state1, ...state2});
  })

  it('should transfer change listeners', () => {
    const state1 = { one: '', two: '' };
    const state2 = { three: '', four: '' };
    const select1 = createStore({ name: nameOfExistingStore, state: state1 });
    const select2 = createStore({ name: nameOfStoreToMerge, state: state2 });
    let count = 0;
    const sub = select2.onChange(() => count++);
    select2.three.replace('x');
    expect(count).toEqual(1);
    mergeStoreIfPossible(select2, nameOfExistingStore);
    select2.three.replace('y');
    expect(count).toEqual(3); // 3, no 2 (because merging the store caused a change listener to fire)
    sub.unsubscribe();
    select2.three.replace('z');
    expect(count).toEqual(4);
    expect(select1.state).toEqual({...state1, ...state2, three: 'z' });
    expect(select2.state).toEqual({...state1, ...state2, three: 'z' });
  })

  it('should not throw an error if no store exists to merge into', () => {
    const select = createStore({ name: nameOfStoreToMerge, state: { x: '' } });
    mergeStoreIfPossible(select, 'xxx');
  })

  it('should throw an error if the existing stores state is a primitive', () => {
    createStore({ name: nameOfExistingStore, state: 0 });
    const selectNested = createStore({ name: nameOfStoreToMerge, state: 0 });
    expect(() => mergeStoreIfPossible(selectNested, nameOfExistingStore)).toThrow(errorMessages.INVALID_EXISTING_STORE_FOR_MERGING);
  })

  it('should throw an error if the existing stores state is an array', () => {
    createStore({ name: nameOfExistingStore, state: new Array<string>() });
    const selectNested = createStore({ name: 'test', state: 0 });
    expect(() => mergeStoreIfPossible(selectNested, nameOfExistingStore)).toThrow(errorMessages.INVALID_EXISTING_STORE_FOR_MERGING);
  })

});

