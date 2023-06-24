// import { errorMessages, testState } from '../src/constant';
// import { createStore } from '../src/core';
// import { mergeStoreIfPossible } from '../src/merge';

describe.skip('merge', () => {

  // const nameOfExistingStore = 'AppStore';
  // const nameOfStoreToMerge = 'MergeStore';

  // beforeEach(() => {
  //   testState.logLevel = 'none';
  // })

  // it('should allow basic merges', () => {
  //   const state1 = { one: '', two: '' };
  //   const state2 = { three: '', four: '' };
  //   const store1 = createStore({ name: nameOfExistingStore, state: state1 });
  //   const store2 = createStore({ name: nameOfStoreToMerge, state: state2 });
  //   mergeStoreIfPossible({ store: store2, nameOfStoreToMergeInto: nameOfExistingStore });
  //   expect(store1.$state).toEqual({ ...state1, ...state2 });
  // })

  // it('should transfer change listeners', () => {
  //   const state1 = { one: '', two: '' };
  //   const state2 = { three: '', four: '' };
  //   const store1 = createStore({ name: nameOfExistingStore, state: state1 });
  //   const store2 = createStore({ name: nameOfStoreToMerge, state: state2 });
  //   let count = 0;
  //   const sub = store2.$onChange(() => count++);
  //   store2.three.$replace('x');
  //   expect(count).toEqual(1);
  //   mergeStoreIfPossible({ store: store2, nameOfStoreToMergeInto: nameOfExistingStore });
  //   store2.three.$replace('y');
  //   expect(count).toEqual(3); // 3, no 2 (because merging the store caused a change listener to fire)
  //   sub.unsubscribe();
  //   store2.three.$replace('z');
  //   expect(count).toEqual(4);
  //   expect(store1.$state).toEqual({ ...state1, ...state2, three: 'z' });
  //   expect(store2.$state).toEqual({ ...state1, ...state2, three: 'z' });
  // })

  // it('should not throw an error if no store exists to merge into', () => {
  //   const store = createStore({ name: nameOfStoreToMerge, state: { x: '' } });
  //   mergeStoreIfPossible({ store: store, nameOfStoreToMergeInto: 'xxx' });
  // })

  // it('should throw an error if the existing stores state is a primitive', () => {
  //   createStore({ name: nameOfExistingStore, state: 0 });
  //   const storeNested = createStore({ name: nameOfStoreToMerge, state: 0 });
  //   expect(() => mergeStoreIfPossible({ store: storeNested, nameOfStoreToMergeInto: nameOfExistingStore }))
  //     .toThrow(errorMessages.INVALID_EXISTING_STORE_FOR_MERGING);
  // })

  // it('should throw an error if the existing stores state is an array', () => {
  //   createStore({ name: nameOfExistingStore, state: new Array<string>() });
  //   const storeNested = createStore({ name: 'test', state: 0 });
  //   expect(() => mergeStoreIfPossible({ store: storeNested, nameOfStoreToMergeInto: nameOfExistingStore }))
  //     .toThrow(errorMessages.INVALID_EXISTING_STORE_FOR_MERGING);
  // })

});

