// import { createStore } from '../src/core';
// import { resetLibraryState } from '../src/utility';
// import { currentAction } from './_utility';

// describe('top-level-primitive', () => {

//   const state = 0;

//   beforeEach(() => {
//     resetLibraryState();
//   })

//   it('should replace a value', () => {
//     const store = createStore({ state });
//     const payload = 1;
//     store
//       .$set(payload);
//     expect(store.$state).toEqual(1);
//     expect(libState.currentAction).toEqual({ type: 'set()', payload });
//   })

//   it('should increment a value', () => {
//     const store = createStore({ state });
//     const payload = 1;
//     store
//       .$add(payload);
//     expect(store.$state).toEqual(1);
//     expect(libState.currentAction).toEqual({ type: 'add()', payload });
//   })

//   it('should toggle a boolean', () => {
//     const store = createStore({ state: false });
//     store
//       .$toggle();
//     expect(store.$state).toEqual(true);
//     expect(libState.currentAction).toEqual({ type: 'toggle()' });
//   })

// });

