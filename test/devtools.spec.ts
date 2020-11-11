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
    expect(store().read()).toEqual(state);
    expect(tests.currentAction.type).toEqual('replace() [dontTrackWithDevtools]');
  });

  it('should correctly respond to devtools dispatches where the state is an array', () => {
    const store = make('store', ['a', 'b', 'c']);
    store().replaceAll(['d', 'e', 'f']);
    expect(store().read()).toEqual(['d', 'e', 'f']);
    const state = ['g', 'h'];
    tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state), payload: { type: 'JUMP_TO_ACTION' }, source: '@devtools-extension' });
    expect(store().read()).toEqual(state);
    expect(tests.currentAction.type).toEqual('replace() [dontTrackWithDevtools]');
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

});

