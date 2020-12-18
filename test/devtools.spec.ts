import { listenToDevtoolsDispatch } from '../src';
import { errorMessages } from '../src/consts';
import { make } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Devtools', () => {

  const spyWarn = jest.spyOn(console, 'warn');

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);
  
  beforeEach( () => spyWarn.mockReset());

  it('should correctly respond to devtools dispatches where the state is an object', () => {
    const select = make({ x: 0, y: 0 });
    select(s => s.x).replace(3);
    expect(select().read()).toEqual({ x: 3, y: 0 });
    const state = { x: 1, y: 0 };
    tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state), payload: { type: 'JUMP_TO_ACTION' }, source: '@devtools-extension' });
    expect(select().read()).toEqual(state);    expect(tests.currentAction.type).toEqual('replace() [dontTrackWithDevtools]');
  });

  it('should correctly respond to devtools dispatches where the state is an array', () => {
    const select = make(['a', 'b', 'c']);
    select().replaceAll(['d', 'e', 'f']);
    expect(select().read()).toEqual(['d', 'e', 'f']);
    const state = ['g', 'h'];
    tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state), payload: { type: 'JUMP_TO_ACTION' }, source: '@devtools-extension' });
    expect(select().read()).toEqual(state);
    expect(tests.currentAction.type).toEqual('replaceAll() [dontTrackWithDevtools]');
  });

  it('should handle a COMMIT without throwing an error', () => {
    make({ hello: '' });
    tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'COMMIT' }, source: '@devtools-extension' });
  });

  it('should handle a RESET correctly', () => {
    const select = make({ hello: '' });
    select(s => s.hello).replace('world');
    expect(select(s => s.hello).read()).toEqual('world');
    tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'RESET' }, source: '@devtools-extension' });
    expect(select(s => s.hello).read()).toEqual('');
  });

  it('should handle a ROLLBACK correctly', () => {
    const select = make({ num: 0 });
    select(s => s.num).replace(1);
    expect(select(s => s.num).read()).toEqual(1);
    select(s => s.num).replace(2);
    expect(select(s => s.num).read()).toEqual(2);
    tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'ROLLBACK' }, source: '@devtools-extension', state: '{ "num": 1 }' });
    expect(select(s => s.num).read()).toEqual(1);
  });

  it('should throw an error should a devtools dispatch contain invalid JSON', () => {
    make({ hello: 0 });
    expect(() => tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: "{'type': 'hello.replace', 'payload': 2}" }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_INVALID_JSON);
  });

  it('should throw an error should a devtools dispatch not contain parenthesis', () => {
    make({ hello: 0 });
    expect(() => tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replace", "payload": 2}' }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_WITH_NO_ACTION('hello.replace'));
  });

  it('should throw an error should a devtools dispatch not contain parenthesis', () => {
    make({ hello: 0 });
    expect(() => tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replace", "payload": 2}' }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_WITH_NO_ACTION('hello.replace'));
  });

  it('should correctly devtools dispatch made by user', () => {
    const select = make({ hello: 0 });
    tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replace()", "payload": 2}' });
    expect(select(s => s.hello).read()).toEqual(2);
  })

  it('should throttle tightly packed updates', done => {
    const select = make({ test: 0 });
    const payload: number[] = [];
    for (let i = 0; i < 100; i++) {
      select(s => s.test).replace(i);
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

  it('should log an error if no devtools extension could be found', () => {
    tests.windowObject = null;
    make(new Array<string>());
    expect( spyWarn ).toHaveBeenCalledWith(errorMessages.DEVTOOL_CANNOT_FIND_EXTENSION); 
  })

});

