import { errorMessages } from '../src/shared-consts';
import { testState } from '../src/shared-state';
import { createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Devtools', () => {

  const spyWarn = jest.spyOn(console, 'warn');

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);
  
  beforeEach( () => spyWarn.mockReset());

  it('should correctly respond to devtools dispatches where the state is an object', () => {
    const select = createGlobalStore({ x: 0, y: 0 }, { tagsToAppearInType: true });
    select(s => s.x)
      .replace(3);
    expect(select().read()).toEqual({ x: 3, y: 0 });
    const state = { x: 1, y: 0 };
    testState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state), payload: { type: 'JUMP_TO_ACTION' }, source: '@devtools-extension' });
    expect(select().read()).toEqual(state);
    expect(testState.currentAction.type).toEqual('replace() [dontTrackWithDevtools]');
  });

  it('should correctly respond to devtools dispatches where the state is an array', () => {
    const select = createGlobalStore(['a', 'b', 'c'], { tagsToAppearInType: true });
    select().replaceAll(['d', 'e', 'f']);
    expect(select().read()).toEqual(['d', 'e', 'f']);
    const state = ['g', 'h'];
    testState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state), payload: { type: 'JUMP_TO_ACTION' }, source: '@devtools-extension' });
    expect(select().read()).toEqual(state);
    expect(testState.currentAction.type).toEqual('replaceAll() [dontTrackWithDevtools]');
  });

  it('should handle a COMMIT without throwing an error', () => {
    createGlobalStore({ hello: '' });
    testState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'COMMIT' }, source: '@devtools-extension' });
  });

  it('should handle a RESET correctly', () => {
    const select = createGlobalStore({ hello: '' });
    select(s => s.hello)
      .replace('world');
    expect(select().read().hello).toEqual('world');
    testState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'RESET' }, source: '@devtools-extension' });
    expect(select().read().hello).toEqual('');
  });

  it('should handle a ROLLBACK correctly', () => {
    const select = createGlobalStore({ num: 0 });
    select(s => s.num)
      .replace(1);
    expect(select().read().num).toEqual(1);
    select(s => s.num)
      .replace(2);
    expect(select().read().num).toEqual(2);
    testState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'ROLLBACK' }, source: '@devtools-extension', state: '{ "num": 1 }' });
    expect(select().read().num).toEqual(1);
  });

  it('should throw an error should a devtools dispatch contain invalid JSON', () => {
    createGlobalStore({ hello: 0 });
    expect(() => testState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: "{'type': 'hello.replace', 'payload': 2}" }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_INVALID_JSON);
  });

  it('should throw an error should a devtools dispatch not contain parenthesis', () => {
    createGlobalStore({ hello: 0 });
    expect(() => testState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replace", "payload": 2}' }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_WITH_NO_ACTION('hello.replace'));
  });

  it('should throw an error should a devtools dispatch not contain parenthesis', () => {
    createGlobalStore({ hello: 0 });
    expect(() => testState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replace", "payload": 2}' }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_WITH_NO_ACTION('hello.replace'));
  });

  it('should correctly devtools dispatch made by user', () => {
    const select = createGlobalStore({ hello: 0 });
    testState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replace()", "payload": 2}' });
    expect(select().read().hello).toEqual(2);
  })

  it('should throttle tightly packed updates', done => {
    const store = createGlobalStore({ test: 0 });
    const payload: number[] = [];
    for (let i = 0; i < 100; i++) {
      store(s => s.test).replace(i);
      expect(testState.currentActionForDevtools).toEqual({ type: 'test.replace()', replacement: 0 });
      if (i > 0) {
        payload.push(i);
      }
    }
    setTimeout(() => {
      expect(testState.currentActionForDevtools).toEqual({
        type: 'test.replace()',
        replacement: 99,
        batched: payload.slice(0, payload.length - 1).map(replacement => ({ replacement })),
      })
      done();
    }, 300);
  })

  it('should log an error if no devtools extension could be found', () => {
    testState.windowObject = null;
    createGlobalStore(new Array<string>());
    expect( spyWarn ).toHaveBeenCalledWith(errorMessages.DEVTOOL_CANNOT_FIND_EXTENSION);
  })

});

