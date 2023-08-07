// import { createStore } from '../src/core';
// import { resetLibraryState } from '../src/utility';
// import { currentAction } from './_utility';

// describe('array-primitive', () => {

//   const state = [1, 2, 3];

//   beforeEach(() => {
//     resetLibraryState();
//   })

//   test('should toggle all elements', () => {
//     const store = createStore({ state: [true, true, false] });
//     store
//       .$toggle();
//     expect(libState.currentActions[0]).toEqual({ type: 'toggle()' });
//     expect(store.$state).toEqual([false, false, true]);
//   })

//   test('should replace all elements', () => {
//     const store = createStore({ state });
//     const payload = [4, 5, 6];
//     store
//       .$set(payload);
//     expect(libState.currentActions[0]).toEqual({ type: 'set()', payload });
//     expect(store.$state).toEqual([4, 5, 6]);
//   })

//   test('should remove all elements', () => {
//     const store = createStore({ state });
//     store
//       .$clear();
//     expect(libState.currentActions[0]).toEqual({ type: 'clear()' });
//     expect(store.$state).toEqual([]);
//   })

//   test('should increment all elements', () => {
//     const store = createStore({ state });
//     const payload = 1;
//     store
//       .$add(payload);
//     expect(libState.currentActions[0]).toEqual({ type: 'add()', payload });
//     expect(store.$state).toEqual(state.map(e => e + 1));
//   })

//   test('should be able to insert one primitive', () => {
//     const store = createStore({ state });
//     const payload = 4;
//     store
//       .$push(payload);
//     expect(libState.currentActions[0]).toEqual({ type: 'push()', payload });
//     expect(store.$state).toEqual([...state, payload]);
//   })

//   test('should be able to insert many primitives', () => {
//     const store = createStore({ state });
//     const payload = [4, 5, 6];
//     store
//       .$push(payload);
//     expect(libState.currentActions[0]).toEqual({ type: 'push()', payload });
//     expect(store.$state).toEqual([...state, ...payload]);
//   })

//   test('should find an element and toggle it', () => {
//     const store = createStore({ state: [true, true, false, false] });
//     store
//       .$find.$eq(false)
//       .$toggle();
//     expect(libState.currentActions[0]).toEqual({ type: 'find.eq(false).toggle()' });
//     expect(store.$state).toEqual([true, true, true, false]);
//   })

//   test('should find an element and replace it', () => {
//     const store = createStore({ state });
//     const payload = 9;
//     store
//       .$find.$eq(2)
//       .$set(payload);
//     expect(libState.currentActions[0]).toEqual({ type: 'find.eq(2).set()', payload });
//     expect(store.$state).toEqual([1, payload, 3]);
//   })

//   test('should find an element and remove it', () => {
//     const store = createStore({ state });
//     store
//       .$find.$eq(2)
//       .$delete();
//     expect(libState.currentActions[0]).toEqual({ type: 'find.eq(2).delete()' });
//     expect(store.$state).toEqual([1, 3]);
//   })

//   test('should find an element and increment it', () => {
//     const store = createStore({ state });
//     const payload = 2;
//     store
//       .$find.$eq(2)
//       .$add(payload);
//     expect(libState.currentActions[0]).toEqual({ type: 'find.eq(2).add()', payload });
//     expect(store.$state).toEqual([1, 4, 3]);
//   })

//   test('should find an element by one clause or another and replace it', () => {
//     const store = createStore({ state });
//     const payload = 9;
//     store
//       .$find.$eq(1).$or.$eq(2)
//       .$set(payload);
//     expect(libState.currentActions[0]).toEqual({ type: 'find.eq(1).or.eq(2).set()', payload });
//     expect(store.$state).toEqual([9, 2, 3]);
//   })

//   test('should find an element by one clause or another and remove it', () => {
//     const store = createStore({ state });
//     store
//       .$find.$eq(1).$or.$eq(2)
//       .$delete();
//     expect(libState.currentActions[0]).toEqual({ type: 'find.eq(1).or.eq(2).delete()' });
//     expect(store.$state).toEqual([2, 3]);
//   })

//   test('should find an element by one clause or another and increment it', () => {
//     const store = createStore({ state });
//     const payload = 1;
//     store
//       .$find.$eq(1).$or.$eq(2)
//       .$add(1);
//     expect(libState.currentActions[0]).toEqual({ type: 'find.eq(1).or.eq(2).add()', payload });
//     expect(store.$state).toEqual([2, 2, 3]);
//   })

//   test('should find an element by one clause and another and replace it', () => {
//     const store = createStore({ state });
//     const payload = 9;
//     store
//       .$find.$gt(1).$and.$lt(3)
//       .$set(payload);
//     expect(libState.currentActions[0]).toEqual({ type: 'find.gt(1).and.lt(3).set()', payload });
//     expect(store.$state).toEqual([1, 9, 3]);
//   })

//   test('should find an element by one clause and another and remove it', () => {
//     const store = createStore({ state });
//     store
//       .$find.$gt(1).$and.$lt(3)
//       .$delete();
//     expect(libState.currentActions[0]).toEqual({ type: 'find.gt(1).and.lt(3).delete()' });
//     expect(store.$state).toEqual([1, 3]);
//   })

//   test('should find an element by one clause and another and increment it', () => {
//     const store = createStore({ state });
//     const payload = 1;
//     store
//       .$find.$eq(1).$and.$lt(2)
//       .$add(payload);
//     expect(libState.currentActions[0]).toEqual({ type: 'find.eq(1).and.lt(2).add()', payload });
//     expect(store.$state).toEqual([2, 2, 3]);
//   })

//   test('should filter elements and toggle then', () => {
//     const store = createStore({ state: [true, true, false, false] });
//     store
//       .$filter.$eq(false)
//       .$toggle();
//     expect(libState.currentActions[0]).toEqual({ type: 'filter.eq(false).toggle()' });
//     expect(store.$state).toEqual([true, true, true, true]);
//   })

//   test('should filter elements and remove them', () => {
//     const store = createStore({ state });
//     store
//       .$filter.$gt(1)
//       .$delete();
//     expect(libState.currentActions[0]).toEqual({ type: 'filter.gt(1).delete()' });
//     expect(store.$state).toEqual([1]);
//   })

//   test('should filter elements and increment them', () => {
//     const store = createStore({ state });
//     const payload = 1;
//     store
//       .$filter.$gt(1)
//       .$add(1);
//     expect(libState.currentActions[0]).toEqual({ type: 'filter.gt(1).add()', payload });
//     expect(store.$state).toEqual([1, 3, 4]);
//   })

//   test('should filter elements by one clause or another and remove them', () => {
//     const store = createStore({ state });
//     store
//       .$filter.$eq(1).$or.$eq(2)
//       .$delete();
//     expect(libState.currentActions[0]).toEqual({ type: 'filter.eq(1).or.eq(2).delete()' });
//     expect(store.$state).toEqual([3]);
//   })

//   test('should filter elements by one clause or another and increment them', () => {
//     const store = createStore({ state });
//     const payload = 1;
//     store
//       .$filter.$eq(1).$or.$eq(2)
//       .$add(1);
//     expect(libState.currentActions[0]).toEqual({ type: 'filter.eq(1).or.eq(2).add()', payload });
//     expect(store.$state).toEqual([2, 3, 3]);
//   })

//   test('should filter elements by one clause and another and remove them', () => {
//     const store = createStore({ state });
//     store
//       .$filter.$gt(0).$and.$lt(3)
//       .$delete();
//     expect(libState.currentActions[0]).toEqual({ type: 'filter.gt(0).and.lt(3).delete()' });
//     expect(store.$state).toEqual([3]);
//   })

//   test('should filter elements by one clause and another and increment them', () => {
//     const store = createStore({ state });
//     const payload = 1;
//     store
//       .$filter.$gt(0).$and.$gt(1)
//       .$add(payload);
//     expect(libState.currentActions[0]).toEqual({ type: 'filter.gt(0).and.gt(1).add()', payload });
//     expect(store.$state).toEqual([payload, 3, 4]);
//   })

// });

