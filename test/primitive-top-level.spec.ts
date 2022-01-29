import { testState } from '../src/constant';
import { createStore } from '../src/core';
import { currentAction } from './_utility';

describe('top-level-primitive', () => {

  const name = 'AppStore';
  const state = 0;

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should replace a value', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store
      .$replace(payload);
    expect(store.$state).toEqual(1);
    expect(currentAction(store)).toEqual({ type: 'replace()', payload });
  })

  it('should increment a value', () => {
    const store = createStore({ name, state });
    const payload = 1;
    store
      .$add(payload);
    expect(store.$state).toEqual(1);
    expect(currentAction(store)).toEqual({ type: 'add()', payload });
  })

});

