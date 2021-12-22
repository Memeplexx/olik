import { createStore } from '../src';
import { libState, testState } from '../src/constant';

describe('top-level-primitive', () => {

  const name = 'AppStore';
  const state = 0;

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should replace a value', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select
      .replace(payload);
    expect(select.state).toEqual(1);
    expect(libState.currentAction).toEqual({ type: 'replace()', payload });
  })

  it('should increment a value', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select
      .increment(payload);
    expect(select.state).toEqual(1);
    expect(libState.currentAction).toEqual({ type: 'increment()', payload });
  })

});

