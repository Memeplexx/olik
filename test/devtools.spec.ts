import { listenToDevtoolsDispatch } from '../src';
import { errorMessages } from '../src/consts';
import { make } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Devtools', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should correctly respond to devtools dispatches where the state is an object', () => {
    const store = make('store', { x: 0, y: 0 });
    store(s => s.x).replaceWith(3);
    expect(store().read()).toEqual({ x: 3, y: 0 });
    const state = { x: 1, y: 0 };
    tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state), payload: { type: 'JUMP_TO_ACTION' }, source: '@devtools-extension' });
    expect(store().read()).toEqual(state);    expect(tests.currentAction.type).toEqual('replaceWith() [dontTrackWithDevtools]');
  });

  it('should correctly respond to devtools dispatches where the state is an array', () => {
    const store = make('store', ['a', 'b', 'c']);
    store().replaceAll(['d', 'e', 'f']);
    expect(store().read()).toEqual(['d', 'e', 'f']);
    const state = ['g', 'h'];
    tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state), payload: { type: 'JUMP_TO_ACTION' }, source: '@devtools-extension' });
    expect(store().read()).toEqual(state);
    expect(tests.currentAction.type).toEqual('replaceAll() [dontTrackWithDevtools]');
  });

  it('should handle a COMMIT without throwing an error', () => {
    make('store', { hello: '' });
    tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'COMMIT' }, source: '@devtools-extension' });
  });

  it('should handle a RESET correctly', () => {
    const store = make('store', { hello: '' });
    store(s => s.hello).replaceWith('world');
    expect(store(s => s.hello).read()).toEqual('world');
    tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'RESET' }, source: '@devtools-extension' });
    expect(store(s => s.hello).read()).toEqual('');
  });

  it('should handle a ROLLBACK correctly', () => {
    const store = make('store', { num: 0 });
    store(s => s.num).replaceWith(1);
    expect(store(s => s.num).read()).toEqual(1);
    store(s => s.num).replaceWith(2);
    expect(store(s => s.num).read()).toEqual(2);
    tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'ROLLBACK' }, source: '@devtools-extension', state: '{ "num": 1 }' });
    expect(store(s => s.num).read()).toEqual(1);
  });

  it('should throw an error should a devtools dispatch contain invalid JSON', () => {
    make('store', { hello: 0 });
    expect(() => tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: "{'type': 'hello.replaceWith', 'payload': 2}" }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_INVALID_JSON);
  });

  it('should throw an error should a devtools dispatch not contain parenthesis', () => {
    make('store', { hello: 0 });
    expect(() => tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replaceWith", "payload": 2}' }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_WITH_NO_ACTION('hello.replaceWith'));
  });

  it('should throw an error should a devtools dispatch not contain parenthesis', () => {
    make('store', { hello: 0 });
    expect(() => tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replaceWith", "payload": 2}' }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_WITH_NO_ACTION('hello.replaceWith'));
  });

  it('should correctly devtools dispatch made by user', () => {
    const store = make('store', { hello: 0 });
    tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replaceWith()", "payload": 2}' });
    expect(store(s => s.hello).read()).toEqual(2);
  })

  it('should throttle tightly packed updates', done => {
    const store = make('store', { test: 0 });
    const payload: number[] = [];
    for (let i = 0; i < 100; i++) {
      store(s => s.test).replaceWith(i);
      expect(tests.currentActionForDevtools.payload).toEqual(0);
      if (i > 0) {
        payload.push(i);
      }
    }
    setTimeout(() => {
      expect(tests.currentActionForDevtools.payload).toEqual(payload);
      done();
    }, 300);
  })

});

