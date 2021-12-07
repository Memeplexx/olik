import { createApplicationStore } from '../src';
import { libState } from '../src/constant';

describe('top-level-primitive', () => {

  const initialState = 0;

  beforeEach(() => {
    libState.appStates = {};
    libState.logLevel = 'none';
  })

  it('should replace a value', () => {
    const select = createApplicationStore(initialState);
    const payload = 1;
    select
      .replace(payload);
    expect(select.read()).toEqual(1);
    expect(libState.currentAction).toEqual({ type: 'replace()', payload });
  })

  it('should increment a value', () => {
    const select = createApplicationStore(initialState);
    const payload = 1;
    select
      .increment(payload);
    expect(select.read()).toEqual(1);
    expect(libState.currentAction).toEqual({ type: 'increment()', payload });
  })

});

