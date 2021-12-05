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
    select
      .replace(1);
    expect(select.read()).toEqual(1);
    expect(libState.currentAction).toEqual({ type: 'replace()', replacement: 1 });
  })

  it('should increment a value', () => {
    const select = createApplicationStore(initialState);
    select
      .increment(1);
    expect(select.read()).toEqual(1);
    expect(libState.currentAction).toEqual({ type: 'increment()', by: 1 });
  })

});

