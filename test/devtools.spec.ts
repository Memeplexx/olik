import { createApplicationStore, derive } from '../src';
import { errorMessages, libState, testState } from '../src/constant';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('devtools', () => {

  beforeEach(() => {
    libState.appStates = {};
    testState.logLevel = 'none';
    libState.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  })

  it('should correctly respond to devtools dispatches where the state is an object', () => {
    const select = createApplicationStore({ x: 0, y: 0 });
    select.x
      .replace(3);
    expect(select.read()).toEqual({ x: 3, y: 0 });
    const state = { x: 1, y: 0 };
    libState.windowObject!.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state), payload: { type: 'JUMP_TO_ACTION' }, source: '@devtools-extension' });
    expect(select.read()).toEqual(state);
    expect(libState.currentAction.type).toEqual('replace()');
  });

  it('should correctly respond to devtools dispatches where the state is an array', () => {
    const select = createApplicationStore(['a', 'b', 'c']);
    select.replaceAll(['d', 'e', 'f']);
    expect(select.read()).toEqual(['d', 'e', 'f']);
    const state = ['g', 'h'];
    libState.windowObject!.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state), payload: { type: 'JUMP_TO_ACTION' }, source: '@devtools-extension' });
    expect(select.read()).toEqual(state);
    expect(libState.currentAction.type).toEqual('replaceAll()');
  });

  it('should handle a COMMIT without throwing an error', () => {
    createApplicationStore({ hello: '' });
    libState.windowObject!.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'COMMIT' }, source: '@devtools-extension' });
  });

  it('should handle a ROLLBACK correctly', () => {
    const select = createApplicationStore({ num: 0 });
    select.num
      .replace(1);
    expect(select.read().num).toEqual(1);
    select.num
      .replace(2);
    expect(select.read().num).toEqual(2);
    libState.windowObject!.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'ROLLBACK' }, source: '@devtools-extension', state: '{ "num": 1 }' });
    expect(select.read().num).toEqual(1);
  });

  it('should throw an error should a devtools dispatch contain invalid JSON', () => {
    createApplicationStore({ hello: 0 });
    expect(() => libState.windowObject!.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: "{'type': 'hello.replace', 'payload': 2}" }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_INVALID_JSON);
  });

  it('should throw an error should a devtools dispatch not contain parenthesis', () => {
    createApplicationStore({ hello: 0 });
    expect(() => libState.windowObject!.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replace", "payload": 2}' }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_WITH_NO_ACTION('hello.replace'));
  });

  it('should throw an error should a devtools dispatch not contain parenthesis', () => {
    createApplicationStore({ hello: 0 });
    expect(() => libState.windowObject!.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replace", "payload": 2}' }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_WITH_NO_ACTION('hello.replace'));
  });

  it('should correctly devtools dispatch made by user', () => {
    const select = createApplicationStore({ hello: 0 });
    libState.windowObject!.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replace()", "payload": 2}' });
    expect(select.read().hello).toEqual(2);
  });

  it('should throttle tightly packed updates', done => {
    const select = createApplicationStore({ test: 0 });
    const payload: number[] = [];
    const updateCount = 3;
    for (let i = 0; i < updateCount; i++) {
      select.test.replace(i);
      expect(testState.currentActionForDevtools).toEqual({ type: 'test.replace()', payload: 0 });
      payload.push(i);
    }
    setTimeout(() => {
      expect(testState.currentActionForDevtools).toEqual({
        type: 'test.replace()',
        payload: updateCount - 1,
        batched: payload.slice(0, payload.length - 1).map(payload => ({ payload })),
      })
      done();
    }, 300);
  })

});

