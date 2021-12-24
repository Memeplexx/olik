import { createStore, trackWithReduxDevtools } from '../src';
import { errorMessages, libState, testState } from '../src/constant';
import { windowAugmentedWithReduxDevtoolsImpl, currentAction } from './_utility';
import { StoreInternal } from '../src/type-internal';

describe('devtools', () => {

  const name = 'AppStore';

  beforeAll(() => {
    testState.fakeWindowObjectForReduxDevtools = windowAugmentedWithReduxDevtoolsImpl;
  })

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should correctly respond to devtools dispatches where the state is an object', () => {
    const state = { x: 0, y: 0 };
    const select = createStore({ name, state });
    trackWithReduxDevtools({ store: select })
    select.x
      .replace(3);
    expect(select.state).toEqual({ x: 3, y: 0 });
    testState.fakeWindowObjectForReduxDevtools!.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state), payload: { type: 'JUMP_TO_ACTION' }, source: '@devtools-extension' });
    expect(select.state).toEqual(state);
    expect(currentAction(select).type).toEqual('replace()');
  });

  it('should correctly respond to devtools dispatches where the state is an array', () => {
    const state = ['a', 'b', 'c'];
    const select = createStore({ name, state });
    trackWithReduxDevtools({ store: select })
    select.replaceAll(['d', 'e', 'f']);
    expect(select.state).toEqual(['d', 'e', 'f']);
    const state2 = ['g', 'h'];
    testState.fakeWindowObjectForReduxDevtools!.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state2), payload: { type: 'JUMP_TO_ACTION' }, source: '@devtools-extension' });
    expect(select.state).toEqual(state2);
    expect(currentAction(select).type).toEqual('replaceAll()');
  });

  it('should handle a COMMIT without throwing an error', () => {
    const state = { hello: '' };
    const select = createStore({ name, state });
    trackWithReduxDevtools({ store: select });
    testState.fakeWindowObjectForReduxDevtools!.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'COMMIT' }, source: '@devtools-extension' });
  });

  it('should handle a ROLLBACK correctly', () => {
    const state = { num: 0 };
    const select = createStore({ name, state });
    trackWithReduxDevtools({ store: select });
    select.num
      .replace(1);
    expect(select.state.num).toEqual(1);
    select.num
      .replace(2);
    expect(select.state.num).toEqual(2);
    testState.fakeWindowObjectForReduxDevtools!.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'ROLLBACK' }, source: '@devtools-extension', state: '{ "num": 1 }' });
    expect(select.state.num).toEqual(1);
  });

  it('should throw an error should a devtools dispatch contain invalid JSON', () => {
    const state = { hello: 0 };
    const select = createStore({ name, state });
    trackWithReduxDevtools({ store: select });
    expect(() => testState.fakeWindowObjectForReduxDevtools!.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: "{'type': 'hello.replace', 'payload': 2}" }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_INVALID_JSON);
  });

  it('should throw an error should a devtools dispatch not contain parenthesis', () => {
    const state = { hello: 0 };
    const select = createStore({ name, state });
    trackWithReduxDevtools({ store: select });
    expect(() => testState.fakeWindowObjectForReduxDevtools!.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replace", "payload": 2}' }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_WITH_NO_ACTION('hello.replace'));
  });

  it('should throw an error should a devtools dispatch not contain parenthesis', () => {
    const state = { hello: 0 };
    const select = createStore({ name, state });
    trackWithReduxDevtools({ store: select });
    expect(() => testState.fakeWindowObjectForReduxDevtools!.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replace", "payload": 2}' }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_WITH_NO_ACTION('hello.replace'));
  });

  it('should correctly devtools dispatch made by user', () => {
    const state = { hello: 0 };
    const select = createStore({ name, state });
    trackWithReduxDevtools({ store: select });
    testState.fakeWindowObjectForReduxDevtools!.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replace()", "payload": 2}' });
    expect(select.state.hello).toEqual(2);
  });

  it('should throttle tightly packed updates', done => {
    testState.logLevel = 'debug';
    const state = { test: 0 };
    const select = createStore({ name, state, batchActions: 200 });
    trackWithReduxDevtools({ store: select });
    const payload: number[] = [];
    const updateCount = 6;
    for (let i = 0; i < updateCount; i++) {
      select.test.replace(i);
      expect(testState.currentActionForReduxDevtools).toEqual({ type: 'test.replace()', payload: 0 });
      testState.logLevel = 'none';
      payload.push(i);
    }
    setTimeout(() => {
      expect(testState.currentActionForReduxDevtools).toEqual({
        type: 'test.replace()',
        payload: updateCount - 1,
        batched: payload.slice(1, payload.length - 1),
      })
      done();
    }, 300);
  })

});

