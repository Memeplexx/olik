import { make } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Devtools', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should update a top-level object', () => {
    const initialState = { x: 0, y: 0 };
    const getStore = make('state', initialState);
    getStore(s => s.x).replaceWith(3);
    expect(getStore().read()).toEqual({ x: 3, y: 0 });
    const state = { x: 1, y: 0 };
    tests.windowObject?.__REDUX_DEVTOOLS_EXTENSION__._mockInvokeSubscription({ type: 'DISPATCH', state: JSON.stringify(state) });
    expect(getStore().read()).toEqual(state);
  })

});
