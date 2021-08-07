import '@testing-library/jest-dom';

import { createRootStore, deriveFrom, init } from '../src';

describe('React', () => {

  const initialState = {
    one: 0,
    two: 0,
  };

  beforeAll(() => {
    init();
  })

  it('should create and update a store', () => {
    const select = createRootStore(initialState, { devtools: false });
    deriveFrom(
      select(s => s.one),
      select(s => s.two)
    ).usingExpensiveCalc((a, b) => a + b);
  })

  

});
