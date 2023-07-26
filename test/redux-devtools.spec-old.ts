// import { errorMessages, testState } from '../src/constant';
// import { createStore } from '../src/core';
// import { importOlikReduxDevtoolsModule } from '../src/redux-devtools';
// import { currentAction, windowAugmentedWithReduxDevtoolsImpl } from './_utility';

test.skip('devtools', () => {

  // const name = 'AppStore';

  // beforeAll(() => {
  //   testState.fakeWindowObjectForReduxDevtools = windowAugmentedWithReduxDevtoolsImpl;
  //   importOlikReduxDevtoolsModule();
  // })

  // beforeEach(() => {
  //   testState.logLevel = 'none';
  // })

  // it('should correctly respond to devtools dispatches where the state is an object', () => {
  //   const state = { x: 0, y: 0 };
  //   const store = createStore({ name, state });
  //   store.x
  //     .$replace(3);
  //   expect(store.$state).toEqual({ x: 3, y: 0 });
  //   testState.fakeWindowObjectForReduxDevtools!.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state), payload: { type: 'JUMP_TO_ACTION' }, source: '@devtools-extension' });
  //   expect(store.$state).toEqual(state);
  //   expect(libState.currentAction.type).toEqual('replace()');
  // });

  // it('should correctly respond to devtools dispatches where the state is an array', () => {
  //   const state = ['a', 'b', 'c'];
  //   const store = createStore({ name, state });
  //   store.$replace(['d', 'e', 'f']);
  //   expect(store.$state).toEqual(['d', 'e', 'f']);
  //   const state2 = ['g', 'h'];
  //   testState.fakeWindowObjectForReduxDevtools!.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state2), payload: { type: 'JUMP_TO_ACTION' }, source: '@devtools-extension' });
  //   expect(store.$state).toEqual(state2);
  //   expect(libState.currentAction.type).toEqual('replace()');
  // });

  // it('should handle a COMMIT without throwing an error', () => {
  //   const state = { hello: '' };
  //   const store = createStore({ name, state });
  //   testState.fakeWindowObjectForReduxDevtools!.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'COMMIT' }, source: '@devtools-extension' });
  // });

  // it('should handle a ROLLBACK correctly', () => {
  //   const state = { num: 0 };
  //   const store = createStore({ name, state });
  //   store.num
  //     .$replace(1);
  //   expect(store.$state.num).toEqual(1);
  //   store.num
  //     .$replace(2);
  //   expect(store.$state.num).toEqual(2);
  //   testState.fakeWindowObjectForReduxDevtools!.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'ROLLBACK' }, source: '@devtools-extension', state: '{ "num": 1 }' });
  //   expect(store.$state.num).toEqual(1);
  // });

  // it('should throw an error should a devtools dispatch contain invalid JSON', () => {
  //   const state = { hello: 0 };
  //   const store = createStore({ name, state });
  //   expect(() => testState.fakeWindowObjectForReduxDevtools!.__REDUX_DEVTOOLS_EXTENSION__
  //     ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: "{'type': 'hello.replace', 'payload': 2}" }))
  //     .toThrow(errorMessages.DEVTOOL_DISPATCHED_INVALID_JSON);
  // });

  // it('should correctly devtools dispatch made by user', () => {
  //   const state = { hello: 0 };
  //   const store = createStore({ name, state });
  //   testState.fakeWindowObjectForReduxDevtools!.__REDUX_DEVTOOLS_EXTENSION__
  //     ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.$replace()", "payload": 2}' });
  //   expect(store.$state.hello).toEqual(2);
  // });

  // it('should throttle tightly packed updates', done => {
  //   const state = { test: 0 };
  //   const store = createStore({ name, state });
  //   importOlikReduxDevtoolsModule({  batchActions: 200 })
  //   const payload: number[] = [];
  //   const updateCount = 6;
  //   for (let i = 0; i < updateCount; i++) {
  //     store.test.$replace(i);
  //     expect(testState.currentActionForReduxDevtools).toEqual({ type: 'test.replace()', payload: 0 });
  //     testState.logLevel = 'none';
  //     payload.push(i);
  //   }
  //   setTimeout(() => {
  //     expect(testState.currentActionForReduxDevtools).toEqual({
  //       type: 'test.replace()',
  //       payload: updateCount - 1,
  //       batched: payload.slice(1, payload.length - 1),
  //     })
  //     done();
  //   }, 300);
  // })

  // it('should abbreviate action types correctly', () => {
  //   importOlikReduxDevtoolsModule({ limitSearchArgLength: 5 })
  //   const store = createStore({ name, state: [{ id: 'qwertyuiop', val: [{ id: 'asdfghjkl', val: 0 }] } ] });
  //   store.$find.id.$eq('qwertyuiop').val.$find.id.$in(['asdfghjkl']).val.$add(1);
  //   expect(testState.currentActionForReduxDevtools.type).toEqual('find.id.eq(qwert).val.find.id.in(asdfg).val.add()');
  // })

});

