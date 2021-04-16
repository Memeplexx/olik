import { errorMessages } from '../src/shared-consts';
import { libState } from '../src/shared-state';
import { store } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Devtools', () => {

  const spyWarn = jest.spyOn(console, 'warn');

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);
  
  beforeEach( () => spyWarn.mockReset());

  it('should correctly respond to devtools dispatches where the state is an object', () => {
    const select = store({ x: 0, y: 0 }, { tagsToAppearInType: true });
    select(s => s.x)
      .replace(3);
    expect(select().read()).toEqual({ x: 3, y: 0 });
    const state = { x: 1, y: 0 };
    libState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state), payload: { type: 'JUMP_TO_ACTION' }, source: '@devtools-extension' });
    expect(select().read()).toEqual(state);
    expect(libState.currentAction.type).toEqual('replace() [dontTrackWithDevtools]');
  });

  it('should correctly respond to devtools dispatches where the state is an array', () => {
    const select = store(['a', 'b', 'c'], { tagsToAppearInType: true });
    select()
      .replaceAll(['d', 'e', 'f']);
    expect(select().read()).toEqual(['d', 'e', 'f']);
    const state = ['g', 'h'];
    libState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state), payload: { type: 'JUMP_TO_ACTION' }, source: '@devtools-extension' });
    expect(select().read()).toEqual(state);
    expect(libState.currentAction.type).toEqual('replaceAll() [dontTrackWithDevtools]');
  });

  it('should handle a COMMIT without throwing an error', () => {
    store({ hello: '' });
    libState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'COMMIT' }, source: '@devtools-extension' });
  });

  it('should handle a RESET correctly', () => {
    const select = store({ hello: '' });
    select(s => s.hello)
      .replace('world');
    expect(select(s => s.hello).read()).toEqual('world');
    libState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'RESET' }, source: '@devtools-extension' });
    expect(select(s => s.hello).read()).toEqual('');
  });

  it('should handle a ROLLBACK correctly', () => {
    const select = store({ num: 0 });
    select(s => s.num)
      .replace(1);
    expect(select(s => s.num).read()).toEqual(1);
    select(s => s.num)
      .replace(2);
    expect(select(s => s.num).read()).toEqual(2);
    libState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', payload: { type: 'ROLLBACK' }, source: '@devtools-extension', state: '{ "num": 1 }' });
    expect(select(s => s.num).read()).toEqual(1);
  });

  it('should throw an error should a devtools dispatch contain invalid JSON', () => {
    store({ hello: 0 });
    expect(() => libState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: "{'type': 'hello.replace', 'payload': 2}" }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_INVALID_JSON);
  });

  it('should throw an error should a devtools dispatch not contain parenthesis', () => {
    store({ hello: 0 });
    expect(() => libState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replace", "payload": 2}' }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_WITH_NO_ACTION('hello.replace'));
  });

  it('should throw an error should a devtools dispatch not contain parenthesis', () => {
    store({ hello: 0 });
    expect(() => libState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replace", "payload": 2}' }))
      .toThrow(errorMessages.DEVTOOL_DISPATCHED_WITH_NO_ACTION('hello.replace'));
  });

  it('should correctly devtools dispatch made by user', () => {
    const select = store({ hello: 0 });
    libState.windowObject?.__REDUX_DEVTOOLS_EXTENSION__
      ._mockInvokeSubscription({ type: 'ACTION', source: '@devtools-extension', payload: '{"type": "hello.replace()", "payload": 2}' });
    expect(select(s => s.hello).read()).toEqual(2);
  })

  it('should throttle tightly packed updates', done => {
    const select = store({ test: 0 });
    const payload: number[] = [];
    for (let i = 0; i < 100; i++) {
      select(s => s.test).replace(i);
      expect(libState.currentActionForDevtools).toEqual({ type: 'test.replace()', replacement: 0 });
      if (i > 0) {
        payload.push(i);
      }
    }
    setTimeout(() => {
      expect(libState.currentActionForDevtools).toEqual({
        type: 'test.replace()',
        replacement: 99,
        batched: payload.slice(0, payload.length - 1).map(replacement => ({ replacement })),
      })
      done();
    }, 300);
  })

  it('should log an error if no devtools extension could be found', () => {
    libState.windowObject = null;
    store(new Array<string>());
    expect( spyWarn ).toHaveBeenCalledWith(errorMessages.DEVTOOL_CANNOT_FIND_EXTENSION); 
  })

});

