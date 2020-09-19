import { make } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Devtools', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('correctly respond to devtools dispatches where the state is an object', () => {
    const initialState = { x: 0, y: 0 };
    const getStore = make('state', initialState);
    getStore(s => s.x).replaceWith(3);
    expect(getStore().read()).toEqual({ x: 3, y: 0 });
    const state = { x: 1, y: 0 };
    tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state) });
    expect(getStore().read()).toEqual(state);
    expect(tests.currentAction.type).toEqual('replace() [dontTrackWithDevtools]');
  })

  it('correctly respond to devtools dispatches where the state is an array', () => {
    const initialState = ['a', 'b', 'c'];
    const getStore = make('state', initialState);
    getStore().replaceAll(['d', 'e', 'f']);
    expect(getStore().read()).toEqual(['d', 'e', 'f']);
    const state = ['g', 'h'];
    tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state) });
    expect(getStore().read()).toEqual(state);
    expect(tests.currentAction.type).toEqual('replace() [dontTrackWithDevtools]');
  })

});
